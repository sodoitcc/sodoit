import { createClient } from "@supabase/supabase-js";
import {
  optimizeImage,
  formatKB,
  percentSaved,
} from "./lib/optimize-image.mjs";
import {
  PexelsRateLimitError,
  delay,
  downloadImage,
  pexelsPhotoSrcUrl,
  searchPexelsPhotos,
} from "./lib/pexels.mjs";
import { selectUnusedPhoto } from "./enrich-guide-images.mjs";

const BUCKET = "guide-images";
const SEARCH_DELAY_MS = 350;
const PAGE_SIZE = 1000;
const RESULTS_PER_QUERY = 10;

let supabase;

function requireSupabaseClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !pexelsApiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or PEXELS_API_KEY",
    );
  }

  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
}

function parseLimitArg() {
  const arg = process.argv.find((value) => value.startsWith("--limit="));
  if (!arg) return null;
  const limit = Number(arg.split("=")[1]);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

const isDryRun = process.argv.includes("--dry-run");

async function loadItemsNeedingImage() {
  const supabase = requireSupabaseClient();
  const all = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("guide_items")
      .select("id, guide_id, title, image_url, guides(id, title, city)")
      .is("image_url", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    all.push(...(data ?? []));

    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all.filter((item) => item.guides);
}

function normalizeQueryText(text) {
  return text
    .replace(/[:;,!?"'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildItemQuery(item, guide) {
  const title = normalizeQueryText(item.title ?? "");
  const city = guide?.city ? normalizeQueryText(guide.city) : "";

  if (!city) return title;
  if (title.toLowerCase().includes(city.toLowerCase())) return title;

  return `${title} ${city}`;
}

async function uploadItemImage(item, photo) {
  const supabase = requireSupabaseClient();
  const path = `items/${item.guide_id}/${item.id}-${photo.id}.webp`;

  const imageSrc = pexelsPhotoSrcUrl(photo);
  if (!imageSrc) {
    throw new Error(`Pexels photo ${photo.id} has no usable src`);
  }

  const original = await downloadImage(imageSrc);
  const optimized = await optimizeImage(original);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimized, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  console.log(
    `  ${formatKB(original.byteLength)} -> ${formatKB(optimized.byteLength)} (-${percentSaved(original.byteLength, optimized.byteLength)}%)`,
  );

  return {
    publicUrl,
    originalSize: original.byteLength,
    optimizedSize: optimized.byteLength,
  };
}

async function persistItemImage(item, photo, publicUrl) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("guide_items")
    .update({
      image_url: publicUrl,
      image_alt: photo.alt || item.title,
    })
    .eq("id", item.id)
    .is("image_url", null)
    .select("id");

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Item image was set concurrently; skipped update");
  }
}

async function enrichItem(item, totals, usedPhotoIds) {
  const guide = item.guides;
  const query = buildItemQuery(item, guide);

  console.log(`Searching: ${item.title} (${guide?.title} / ${guide?.city})`);

  const photos = await searchPexelsPhotos(query, {
    perPage: RESULTS_PER_QUERY,
  });
  const photo = selectUnusedPhoto(photos, usedPhotoIds);

  if (!photo) {
    console.warn(`No image found: ${item.title}`);
    totals.notFound += 1;
    return;
  }

  usedPhotoIds.add(photo.id);

  if (isDryRun) {
    console.log(
      `  [dry-run] query="${query}" selected photo ${photo.id} (${pexelsPhotoSrcUrl(photo)})`,
    );
    totals.wouldSet += 1;
    return;
  }

  const { publicUrl, originalSize, optimizedSize } = await uploadItemImage(
    item,
    photo,
  );

  await persistItemImage(item, photo, publicUrl);

  totals.original += originalSize;
  totals.optimized += optimizedSize;
  totals.count += 1;

  console.log(`Done: ${item.title}`);
}

function printSummary(totals, totalFound, stoppedReason) {
  console.log("");

  if (isDryRun) {
    console.log(`Would set: ${totals.wouldSet}`);
    console.log(`No image found: ${totals.notFound}`);
    console.log("Dry run — no data was changed.");
    return;
  }

  const remaining = totalFound - totals.count - totals.notFound;

  console.log(`Processed: ${totals.count}`);
  console.log(`No image found: ${totals.notFound}`);
  console.log(`Remaining: ${remaining}`);

  if (totals.count > 0) {
    const originalMB = totals.original / (1024 * 1024);
    const optimizedMB = totals.optimized / (1024 * 1024);

    console.log(
      `Size saved: ${originalMB.toFixed(2)} MB -> ${optimizedMB.toFixed(2)} MB (-${percentSaved(totals.original, totals.optimized)}%)`,
    );
  }

  console.log(`Stopped: ${stoppedReason ?? "finished normally"}`);

  if (remaining > 0) {
    console.log("");
    console.log("Run `npm run seed:guide-item-images` later to continue.");
  }
}

async function main() {
  const limit = parseLimitArg();

  const found = await loadItemsNeedingImage();
  const items = limit ? found.slice(0, limit) : found;

  console.log(
    `Found ${found.length} guide items without an image.` +
      (limit ? ` Processing up to ${limit} this run.` : "") +
      (isDryRun ? " (dry run)" : ""),
  );

  const totals = {
    original: 0,
    optimized: 0,
    count: 0,
    notFound: 0,
    wouldSet: 0,
  };
  let stoppedReason = null;
  const usedPhotoIds = new Set();

  for (const item of items) {
    try {
      await enrichItem(item, totals, usedPhotoIds);
    } catch (error) {
      if (error instanceof PexelsRateLimitError) {
        const wait = error.retryAfter
          ? ` (retry after ${error.retryAfter}s)`
          : "";

        console.warn(`\nPexels rate limit reached${wait}. Stopping run.`);

        stoppedReason = "Pexels rate limit reached";
        break;
      }

      console.error(`Failed: ${item.title}`, error);
    }

    await delay(SEARCH_DELAY_MS);
  }

  printSummary(totals, found.length, stoppedReason);
}

const isMain =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  await main();
}
