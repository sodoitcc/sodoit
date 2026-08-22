import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { listExperiencesForExport } from "./queries";
import {
  buildExperienceImportPreview,
  parseExperiencesWorkbook,
  type ExperienceImportCandidate,
  type ExperienceImportPreview,
} from "./import";

export type ApplyFingerprints = Record<string, string>;

export interface ApplyConflict {
  id: string;
  title: string | null;
  reason: "changed" | "missing_fingerprint";
}

export type ExperienceApplyResult =
  | {
      ok: true;
      created: { id: string; title: string }[];
      updated: { id: string; title: string }[];
    }
  | { ok: false; kind: "invalid_file"; error: string }
  | { ok: false; kind: "validation_error"; preview: ExperienceImportPreview }
  | { ok: false; kind: "stale_preview"; conflicts: ApplyConflict[] }
  | { ok: false; kind: "apply_failed"; error: string };

function toWriteRow(candidate: ExperienceImportCandidate) {
  return {
    title: candidate.title,
    slug: candidate.slug,
    description: candidate.description,
    category: candidate.category,
    difficulty: candidate.difficulty,
    location_type: candidate.location_type,
    country_code: candidate.country_code,
    city: candidate.city,
    image_url: candidate.image_url,
    image_alt: candidate.image_alt,
    why_it_matters: candidate.why_it_matters,
    what_to_know: candidate.what_to_know,
    best_time: candidate.best_time,
    duration_text: candidate.duration_text,
    location_note: candidate.location_note,
    featured: candidate.featured,
    is_public: candidate.is_public,
  };
}

export async function applyExperienceImport(
  buffer: ArrayBuffer,
  clientFingerprints: ApplyFingerprints,
): Promise<ExperienceApplyResult> {
  const parseResult = await parseExperiencesWorkbook(buffer);
  if (!parseResult.ok) {
    return { ok: false, kind: "invalid_file", error: parseResult.error };
  }

  const existing = await listExperiencesForExport();
  const preview = buildExperienceImportPreview(parseResult.rows, existing);

  if (preview.summary.error > 0) {
    return { ok: false, kind: "validation_error", preview };
  }

  const conflicts: ApplyConflict[] = [];
  for (const row of preview.rows) {
    if (row.status !== "update") continue;
    const suppliedFingerprint = clientFingerprints[row.id];
    if (!suppliedFingerprint) {
      conflicts.push({
        id: row.id,
        title: row.candidate.title,
        reason: "missing_fingerprint",
      });
    } else if (suppliedFingerprint !== row.baseFingerprint) {
      conflicts.push({
        id: row.id,
        title: row.candidate.title,
        reason: "changed",
      });
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, kind: "stale_preview", conflicts };
  }

  const createRows = preview.rows.filter((row) => row.status === "create");
  const updateRows = preview.rows.filter((row) => row.status === "update");

  if (createRows.length === 0 && updateRows.length === 0) {
    return { ok: true, created: [], updated: [] };
  }

  const creates = createRows.map((row) => toWriteRow(row.candidate));
  const updates = updateRows.map((row) => ({
    id: row.id,
    ...toWriteRow(row.candidate),
  }));

  const client = createAdminClient();
  const { data, error } = await client.rpc("apply_experience_import", {
    creates,
    updates,
  });

  if (error) {
    logger.error("admin.experiences.import_apply_failed", {
      message: error.message,
    });
    return {
      ok: false,
      kind: "apply_failed",
      error: "Could not apply the import. No changes were made.",
    };
  }

  const createdIds: string[] = Array.isArray(data?.created_ids)
    ? data.created_ids
    : [];

  return {
    ok: true,
    created: createRows.map((row, index) => ({
      id: createdIds[index] ?? "",
      title: row.candidate.title,
    })),
    updated: updateRows.map((row) => ({
      id: row.id,
      title: row.candidate.title,
    })),
  };
}
