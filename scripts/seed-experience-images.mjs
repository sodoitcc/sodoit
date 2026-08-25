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
  searchPexelsPhoto,
} from "./lib/pexels.mjs";

const BUCKET = "experience-images";
const SEARCH_DELAY_MS = 350;
const PAGE_SIZE = 1000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pexelsApiKey = process.env.PEXELS_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !pexelsApiKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or PEXELS_API_KEY",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function parseLimitArg() {
  const arg = process.argv.find((value) => value.startsWith("--limit="));

  if (!arg) {
    return null;
  }

  const limit = Number(arg.split("=")[1]);

  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

async function loadExperiences() {
  const all = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("experiences")
      .select("id, title, category, image_query, image_url")
      .is("image_url", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    all.push(...(data ?? []));

    if (!data || data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return all;
}

async function searchPhoto(experience) {
  const query = experience.image_query?.trim()
    ? experience.image_query.trim()
    : [experience.title, experience.category].filter(Boolean).join(" ");

  return searchPexelsPhoto(query);
}

async function uploadImage(experienceId, photo) {
  const path = `experiences/${experienceId}-${photo.id}.webp`;

  const imageSrc = pexelsPhotoSrcUrl(photo);
  const original = await downloadImage(imageSrc);
  const optimized = await optimizeImage(original);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimized, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    throw error;
  }

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

async function updateExperience(experience, photo, imageUrl) {
  const { error } = await supabase
    .from("experiences")
    .update({
      image_url: imageUrl,
      image_alt: photo.alt || experience.title,
    })
    .eq("id", experience.id);

  if (error) {
    throw error;
  }
}

async function seedExperience(experience, totals) {
  console.log(`Searching: ${experience.title}`);

  const photo = await searchPhoto(experience);

  if (!photo) {
    console.warn(`No image found: ${experience.title}`);
    return;
  }

  const { publicUrl, originalSize, optimizedSize } = await uploadImage(
    experience.id,
    photo,
  );

  await updateExperience(experience, photo, publicUrl);

  totals.original += originalSize;
  totals.optimized += optimizedSize;
  totals.count += 1;

  console.log(`Done: ${experience.title}`);
}

function printSummary(totals, totalFound, stoppedReason) {
  const remaining = totalFound - totals.count;

  console.log("");
  console.log(`Processed: ${totals.count}`);
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
    console.log("Run `npm run seed:images` later to continue.");
  }
}

async function main() {
  const limit = parseLimitArg();

  const found = await loadExperiences();
  const experiences = limit ? found.slice(0, limit) : found;

  console.log(
    `Found ${found.length} experiences without images.` +
      (limit ? ` Processing up to ${limit} this run.` : ""),
  );

  const totals = { original: 0, optimized: 0, count: 0 };
  let stoppedReason = null;

  for (const experience of experiences) {
    try {
      await seedExperience(experience, totals);
    } catch (error) {
      if (error instanceof PexelsRateLimitError) {
        const wait = error.retryAfter
          ? ` (retry after ${error.retryAfter}s)`
          : "";

        console.warn(`\nPexels rate limit reached${wait}. Stopping run.`);

        stoppedReason = "Pexels rate limit reached";
        break;
      }

      console.error(`Failed: ${experience.title}`, error);
    }

    await delay(SEARCH_DELAY_MS);
  }

  printSummary(totals, found.length, stoppedReason);
}

await main();
