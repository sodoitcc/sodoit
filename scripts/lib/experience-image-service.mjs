import { optimizeImage, formatKB, percentSaved } from "./optimize-image.mjs";
import {
  PexelsRateLimitError,
  delay,
  downloadImage,
  pexelsPhotoSrcUrl,
  searchPexelsPhoto,
} from "./pexels.mjs";

export const EXPERIENCE_IMAGE_BUCKET = "experience-images";
export const EXPERIENCE_IMAGE_SEARCH_DELAY_MS = 350;

export const EXPERIENCE_IMAGE_COLUMNS =
  "id, title, category, image_query, image_url";

export { PexelsRateLimitError, delay };

export function buildExperienceImageQuery(experience) {
  const explicit = experience.image_query?.trim();
  if (explicit) return explicit;

  return [experience.title, experience.category]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" ")
    .trim();
}

export function hasUsableImage(experience) {
  return (
    typeof experience.image_url === "string" &&
    experience.image_url.trim().length > 0
  );
}

export async function findExperiencesMissingImages(supabase, { limit } = {}) {
  const pageSize = 1000;
  const all = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_IMAGE_COLUMNS)
      .or("image_url.is.null,image_url.eq.")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    all.push(...(data ?? []));

    if (!data || data.length < pageSize) break;
    if (limit && all.length >= limit) break;

    from += pageSize;
  }

  return limit ? all.slice(0, limit) : all;
}

export async function loadExperienceImageCandidate(supabase, experienceId) {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_IMAGE_COLUMNS)
    .eq("id", experienceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function generateExperienceImage(supabase, experience) {
  const query = buildExperienceImageQuery(experience);
  if (!query) {
    return { ok: false, error: "empty_query" };
  }

  const photo = await searchPexelsPhoto(query);
  if (!photo) {
    return { ok: false, error: "no_results" };
  }

  const imageSrc = pexelsPhotoSrcUrl(photo);
  if (!imageSrc) {
    return { ok: false, error: "no_source_url" };
  }

  const original = await downloadImage(imageSrc);
  const optimized = await optimizeImage(original);

  const path = `experiences/${experience.id}-${photo.id}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(EXPERIENCE_IMAGE_BUCKET)
    .upload(path, optimized, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(EXPERIENCE_IMAGE_BUCKET).getPublicUrl(path);

  return {
    ok: true,
    imageUrl: publicUrl,
    imageAlt: photo.alt || experience.title,
    originalSize: original.byteLength,
    optimizedSize: optimized.byteLength,
  };
}

export async function applyExperienceImageResult(
  supabase,
  experienceId,
  result,
) {
  const { error } = await supabase
    .from("experiences")
    .update({ image_url: result.imageUrl, image_alt: result.imageAlt })
    .eq("id", experienceId);

  if (error) throw error;
}

export async function regenerateExperienceImage(supabase, experienceId) {
  const experience = await loadExperienceImageCandidate(supabase, experienceId);
  if (!experience) {
    return { ok: false, error: "not_found" };
  }

  const result = await generateExperienceImage(supabase, experience);
  if (!result.ok) return result;

  await applyExperienceImageResult(supabase, experienceId, result);
  return result;
}

export async function runExperienceImageEnrichment(
  supabase,
  experiences,
  { delayMs = EXPERIENCE_IMAGE_SEARCH_DELAY_MS, onProgress, onItem } = {},
) {
  const summary = {
    attempted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
    stoppedReason: null,
  };

  for (const experience of experiences) {
    summary.attempted += 1;
    onItem?.({ phase: "start", experience });

    try {
      const query = buildExperienceImageQuery(experience);
      if (!query) {
        summary.skipped += 1;
        onItem?.({ phase: "skipped", experience, reason: "empty_query" });
      } else {
        const result = await generateExperienceImage(supabase, experience);

        if (!result.ok) {
          summary.skipped += 1;
          onItem?.({ phase: "skipped", experience, reason: result.error });
        } else {
          await applyExperienceImageResult(supabase, experience.id, result);
          summary.updated += 1;
          onItem?.({ phase: "updated", experience, result });
        }
      }
    } catch (error) {
      if (error instanceof PexelsRateLimitError) {
        summary.stoppedReason = "rate_limited";
        onItem?.({ phase: "rate_limited", experience, error });
        break;
      }

      summary.failed += 1;
      const failure = {
        id: experience.id,
        title: experience.title,
        error: error instanceof Error ? error.message : String(error),
      };
      summary.failures.push(failure);
      onItem?.({ phase: "failed", experience, error });
    }

    onProgress?.(summary);
    await delay(delayMs);
  }

  return summary;
}

export { formatKB, percentSaved };
