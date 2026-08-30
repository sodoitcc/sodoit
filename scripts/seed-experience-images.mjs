import { createClient } from "@supabase/supabase-js";
import {
  findExperiencesMissingImages,
  runExperienceImageEnrichment,
} from "./lib/experience-image-service.mjs";
import { formatKB, percentSaved } from "./lib/optimize-image.mjs";

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

function onItem(event) {
  if (event.phase === "start") {
    console.log(`Searching: ${event.experience.title}`);
    return;
  }

  if (event.phase === "updated") {
    const { originalSize, optimizedSize } = event.result;
    console.log(
      `  ${formatKB(originalSize)} -> ${formatKB(optimizedSize)} (-${percentSaved(originalSize, optimizedSize)}%)`,
    );
    console.log(`Done: ${event.experience.title}`);
    return;
  }

  if (event.phase === "skipped") {
    console.warn(`No image found: ${event.experience.title}`);
    return;
  }

  if (event.phase === "rate_limited") {
    const wait = event.error.retryAfter
      ? ` (retry after ${event.error.retryAfter}s)`
      : "";
    console.warn(`\nPexels rate limit reached${wait}. Stopping run.`);
    return;
  }

  if (event.phase === "failed") {
    console.error(`Failed: ${event.experience.title}`, event.error);
  }
}

function printSummary(summary, totalFound) {
  const remaining = totalFound - summary.updated;

  console.log("");
  console.log(`Processed: ${summary.updated}`);
  console.log(`Remaining: ${remaining}`);
  console.log(
    `Stopped: ${summary.stoppedReason === "rate_limited" ? "Pexels rate limit reached" : "finished normally"}`,
  );

  if (remaining > 0) {
    console.log("");
    console.log("Run `npm run seed:images` later to continue.");
  }
}

async function main() {
  const limit = parseLimitArg();

  const found = await findExperiencesMissingImages(supabase);
  const experiences = limit ? found.slice(0, limit) : found;

  console.log(
    `Found ${found.length} experiences without images.` +
      (limit ? ` Processing up to ${limit} this run.` : ""),
  );

  const summary = await runExperienceImageEnrichment(supabase, experiences, {
    onItem,
  });

  printSummary(summary, found.length);
}

await main();
