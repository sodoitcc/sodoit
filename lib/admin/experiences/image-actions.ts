"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { UUID_RE } from "@/lib/validation";
import {
  findExperiencesMissingImages,
  regenerateExperienceImage,
  runExperienceImageEnrichment,
} from "../../../scripts/lib/experience-image-service.mjs";

export interface ImageEnrichmentSummary {
  attempted: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: { id: string; title: string; error: string }[];
  stoppedReason: string | null;
}

export interface ImageEnrichmentChunkResult {
  success: true;
  summary: ImageEnrichmentSummary;
  remainingCount: number;
  done: boolean;
}

export type ImageEnrichmentResult =
  ImageEnrichmentChunkResult | { success: false; error: string };

const DEFAULT_CHUNK_SIZE = 10;
const MAX_CHUNK_SIZE = 25;

function clampChunkSize(chunkSize: number | undefined): number {
  if (!chunkSize || !Number.isFinite(chunkSize) || chunkSize < 1) {
    return DEFAULT_CHUNK_SIZE;
  }
  return Math.min(chunkSize, MAX_CHUNK_SIZE);
}

function revalidateExperiencePaths(id?: string) {
  revalidatePath("/admin/experiences");
  revalidatePath("/admin/imports");
  if (id) revalidatePath(`/admin/experiences/${id}`);
}

export async function countMissingExperienceImages(): Promise<number> {
  const admin = await requireAdmin();
  if (!admin.ok) return 0;

  const client = createAdminClient();
  const { count, error } = await client
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .or("image_url.is.null,image_url.eq.");

  if (error) return 0;
  return count ?? 0;
}

export async function generateMissingExperienceImagesChunk(input: {
  chunkSize?: number;
}): Promise<ImageEnrichmentResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const chunkSize = clampChunkSize(input.chunkSize);
  const client = createAdminClient();

  const experiences = await findExperiencesMissingImages(client, {
    limit: chunkSize,
  });

  const summary = await runExperienceImageEnrichment(client, experiences);

  const { count } = await client
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .or("image_url.is.null,image_url.eq.");

  revalidateExperiencePaths();

  return {
    success: true,
    summary,
    remainingCount: count ?? 0,
    done: (count ?? 0) === 0,
  };
}

export async function generateExperienceImagesForIds(input: {
  ids: string[];
  cursor?: number;
  chunkSize?: number;
}): Promise<
  | {
      success: true;
      summary: ImageEnrichmentSummary;
      nextCursor: number;
      done: boolean;
    }
  | { success: false; error: string }
> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const ids = input.ids.filter((id) => UUID_RE.test(id));
  if (ids.length === 0) {
    return { success: false, error: "No valid Experience ids provided." };
  }

  const chunkSize = clampChunkSize(input.chunkSize);
  const cursor = Math.max(0, input.cursor ?? 0);
  const chunkIds = ids.slice(cursor, cursor + chunkSize);

  const client = createAdminClient();

  const { data, error } = await client
    .from("experiences")
    .select("id, title, category, image_query, image_url")
    .in("id", chunkIds)
    .or("image_url.is.null,image_url.eq.");

  if (error) {
    return { success: false, error: "Could not load the Experiences." };
  }

  const summary = await runExperienceImageEnrichment(client, data ?? []);

  const nextCursor = cursor + chunkIds.length;
  revalidateExperiencePaths();

  return {
    success: true,
    summary,
    nextCursor,
    done: nextCursor >= ids.length,
  };
}

export async function regenerateSingleExperienceImage(
  experienceId: string,
): Promise<
  | { success: true; imageUrl: string; imageAlt: string }
  | { success: false; error: string }
> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  if (!UUID_RE.test(experienceId)) {
    return { success: false, error: "Invalid Experience id." };
  }

  const client = createAdminClient();
  const result = await regenerateExperienceImage(client, experienceId);

  if (!result.ok) {
    const message =
      result.error === "not_found"
        ? "Experience not found."
        : result.error === "empty_query"
          ? "Not enough information to search for an image."
          : result.error === "no_results"
            ? "No matching image was found."
            : "Could not generate a new image.";
    return { success: false, error: message };
  }

  revalidateExperiencePaths(experienceId);

  return {
    success: true,
    imageUrl: result.imageUrl,
    imageAlt: result.imageAlt,
  };
}
