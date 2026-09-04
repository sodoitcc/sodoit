import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { listGuidesForExport } from "./queries";
import {
  buildGuideImportPreview,
  parseGuidesWorkbook,
  type GuideComparisonImportCandidate,
  type GuideImportCandidate,
  type GuideImportParent,
  type GuideImportPreview,
  type GuideSpotImportCandidate,
} from "./import";

export type ApplyFingerprints = Record<string, string>;

export interface GuideApplyConflict {
  entity: "guide" | "spot" | "comparison";
  id: string;
  title: string | null;
  reason: "changed" | "missing_fingerprint";
}

interface ApplyEntitySummary {
  created: { id: string; title: string }[];
  updated: { id: string; title: string }[];
}

export type GuideApplyResult =
  | {
      ok: true;
      guides: ApplyEntitySummary;
      spots: ApplyEntitySummary;
      comparisons: ApplyEntitySummary;
    }
  | { ok: false; kind: "invalid_file"; error: string }
  | { ok: false; kind: "validation_error"; preview: GuideImportPreview }
  | { ok: false; kind: "stale_preview"; conflicts: GuideApplyConflict[] }
  | {
      ok: false;
      kind: "apply_failed";
      error: string;
      debug?: RpcErrorDebug;
    };

export interface RpcErrorDebug {
  code: string | null;
  message: string;
  details: string | null;
  hint: string | null;
}

function toGuideRow(candidate: GuideImportCandidate) {
  return {
    title: candidate.title,
    slug: candidate.slug,
    description: candidate.description,
    type: candidate.type,
    city: candidate.city,
    country_code: candidate.country_code,
    city_slug: candidate.city_slug,
    cover_image_url: candidate.cover_image_url,
    cover_image_alt: candidate.cover_image_alt,
    duration_label: candidate.duration_label,
    best_time: candidate.best_time,
    local_tip: candidate.local_tip,
    route_mode: candidate.route_mode,
    featured: candidate.featured,
    is_public: candidate.is_public,
    sort_order: candidate.sort_order,
    editorial_attribution: candidate.editorial_attribution,
  };
}

function toGuideSpotRow(candidate: GuideSpotImportCandidate) {
  return {
    position: candidate.position,
    title: candidate.title,
    description: candidate.description,
    neighborhood: candidate.neighborhood,
    address: candidate.address,
    google_maps_url: candidate.google_maps_url,
    external_url: candidate.external_url,
    tags: candidate.tags,
    place_name: candidate.place_name,
    image_url: candidate.image_url,
    image_alt: candidate.image_alt,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  };
}

function toGuideComparisonRow(candidate: GuideComparisonImportCandidate) {
  return {
    position: candidate.position,
    skip_title: candidate.skip_title,
    skip_description: candidate.skip_description,
    skip_neighborhood: candidate.skip_neighborhood,
    skip_address: candidate.skip_address,
    skip_google_maps_url: candidate.skip_google_maps_url,
    skip_external_url: candidate.skip_external_url,
    skip_tags: candidate.skip_tags,
    go_instead_title: candidate.go_instead_title,
    go_instead_description: candidate.go_instead_description,
    go_instead_neighborhood: candidate.go_instead_neighborhood,
    go_instead_address: candidate.go_instead_address,
    go_instead_google_maps_url: candidate.go_instead_google_maps_url,
    go_instead_external_url: candidate.go_instead_external_url,
    go_instead_tags: candidate.go_instead_tags,
    reason: candidate.reason,
    skip_latitude: candidate.skip_latitude,
    skip_longitude: candidate.skip_longitude,
    go_instead_latitude: candidate.go_instead_latitude,
    go_instead_longitude: candidate.go_instead_longitude,
  };
}

function parentPayload(parent: GuideImportParent) {
  return {
    guide_id: parent.kind === "existing" ? parent.guideId : null,
    guide_ref: parent.kind === "new" ? parent.slug : null,
  };
}

export async function applyGuideImport(
  buffer: ArrayBuffer,
  guideFingerprints: ApplyFingerprints,
  spotFingerprints: ApplyFingerprints,
  comparisonFingerprints: ApplyFingerprints,
): Promise<GuideApplyResult> {
  const parseResult = await parseGuidesWorkbook(buffer);
  if (!parseResult.ok) {
    return { ok: false, kind: "invalid_file", error: parseResult.error };
  }

  const {
    guides: existingGuides,
    items: existingSpots,
    comparisons: existingComparisons,
  } = await listGuidesForExport();

  const preview = buildGuideImportPreview(
    parseResult.guideRows,
    parseResult.spotRows,
    parseResult.comparisonRows,
    existingGuides,
    existingSpots,
    existingComparisons,
  );

  if (
    preview.summary.guides.error > 0 ||
    preview.summary.spots.error > 0 ||
    preview.summary.comparisons.error > 0
  ) {
    return { ok: false, kind: "validation_error", preview };
  }

  const conflicts: GuideApplyConflict[] = [];

  for (const row of preview.guides) {
    if (row.status !== "update") continue;
    const supplied = guideFingerprints[row.id];
    if (!supplied) {
      conflicts.push({
        entity: "guide",
        id: row.id,
        title: row.candidate.title,
        reason: "missing_fingerprint",
      });
    } else if (supplied !== row.baseFingerprint) {
      conflicts.push({
        entity: "guide",
        id: row.id,
        title: row.candidate.title,
        reason: "changed",
      });
    }
  }

  for (const row of preview.spots) {
    if (row.status !== "update") continue;
    const supplied = spotFingerprints[row.id];
    if (!supplied) {
      conflicts.push({
        entity: "spot",
        id: row.id,
        title: row.candidate.title,
        reason: "missing_fingerprint",
      });
    } else if (supplied !== row.baseFingerprint) {
      conflicts.push({
        entity: "spot",
        id: row.id,
        title: row.candidate.title,
        reason: "changed",
      });
    }
  }

  for (const row of preview.comparisons) {
    if (row.status !== "update") continue;
    const supplied = comparisonFingerprints[row.id];
    if (!supplied) {
      conflicts.push({
        entity: "comparison",
        id: row.id,
        title: row.candidate.skip_title,
        reason: "missing_fingerprint",
      });
    } else if (supplied !== row.baseFingerprint) {
      conflicts.push({
        entity: "comparison",
        id: row.id,
        title: row.candidate.skip_title,
        reason: "changed",
      });
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, kind: "stale_preview", conflicts };
  }

  const guideCreates = preview.guides.filter((r) => r.status === "create");
  const guideUpdates = preview.guides.filter((r) => r.status === "update");
  const spotCreates = preview.spots.filter((r) => r.status === "create");
  const spotUpdates = preview.spots.filter((r) => r.status === "update");
  const comparisonCreates = preview.comparisons.filter(
    (r) => r.status === "create",
  );
  const comparisonUpdates = preview.comparisons.filter(
    (r) => r.status === "update",
  );

  if (
    guideCreates.length === 0 &&
    guideUpdates.length === 0 &&
    spotCreates.length === 0 &&
    spotUpdates.length === 0 &&
    comparisonCreates.length === 0 &&
    comparisonUpdates.length === 0
  ) {
    return {
      ok: true,
      guides: { created: [], updated: [] },
      spots: { created: [], updated: [] },
      comparisons: { created: [], updated: [] },
    };
  }

  const rpcPayload = {
    guide_creates: guideCreates.map((r) => ({
      import_ref: r.candidate.slug,
      ...toGuideRow(r.candidate),
    })),
    guide_updates: guideUpdates.map((r) => ({
      id: r.id,
      ...toGuideRow(r.candidate),
    })),
    spot_creates: spotCreates.map((r) => ({
      ...parentPayload(r.parent),
      ...toGuideSpotRow(r.candidate),
    })),
    spot_updates: spotUpdates.map((r) => ({
      id: r.id,
      ...toGuideSpotRow(r.candidate),
    })),
    comparison_creates: comparisonCreates.map((r) => ({
      ...parentPayload(r.parent),
      ...toGuideComparisonRow(r.candidate),
    })),
    comparison_updates: comparisonUpdates.map((r) => ({
      id: r.id,
      ...toGuideComparisonRow(r.candidate),
    })),
  };

  if (process.env.NODE_ENV === "development") {
    logger.info("admin.guides.import_apply_payload_summary", {
      guide_creates: rpcPayload.guide_creates.length,
      guide_updates: rpcPayload.guide_updates.length,
      spot_creates: rpcPayload.spot_creates.length,
      spot_updates: rpcPayload.spot_updates.length,
      comparison_creates: rpcPayload.comparison_creates.length,
      comparison_updates: rpcPayload.comparison_updates.length,
      spot_creates_unresolved_parent: rpcPayload.spot_creates.filter(
        (r) => !r.guide_id && !r.guide_ref,
      ).length,
      comparison_creates_unresolved_parent:
        rpcPayload.comparison_creates.filter((r) => !r.guide_id && !r.guide_ref)
          .length,
    });
  }

  const client = createAdminClient();
  const { data, error } = await client.rpc("apply_guide_import", rpcPayload);

  if (error) {
    logger.error("admin.guides.import_apply_failed", {
      code: error.code ?? null,
      message: error.message,
      details: error.details ?? null,
      hint: error.hint ?? null,
    });

    const debug: RpcErrorDebug | undefined =
      process.env.NODE_ENV === "development"
        ? {
            code: error.code ?? null,
            message: error.message,
            details: error.details ?? null,
            hint: error.hint ?? null,
          }
        : undefined;

    return {
      ok: false,
      kind: "apply_failed",
      error: "Could not apply the import. No changes were made.",
      ...(debug ? { debug } : {}),
    };
  }

  const createdGuideIds: string[] = Array.isArray(data?.created_guide_ids)
    ? data.created_guide_ids
    : [];
  const createdSpotIds: string[] = Array.isArray(data?.created_spot_ids)
    ? data.created_spot_ids
    : [];
  const createdComparisonIds: string[] = Array.isArray(
    data?.created_comparison_ids,
  )
    ? data.created_comparison_ids
    : [];

  return {
    ok: true,
    guides: {
      created: guideCreates.map((r, index) => ({
        id: createdGuideIds[index] ?? "",
        title: r.candidate.title,
      })),
      updated: guideUpdates.map((r) => ({
        id: r.id,
        title: r.candidate.title,
      })),
    },
    spots: {
      created: spotCreates.map((r, index) => ({
        id: createdSpotIds[index] ?? "",
        title: r.candidate.title,
      })),
      updated: spotUpdates.map((r) => ({
        id: r.id,
        title: r.candidate.title,
      })),
    },
    comparisons: {
      created: comparisonCreates.map((r, index) => ({
        id: createdComparisonIds[index] ?? "",
        title: r.candidate.skip_title,
      })),
      updated: comparisonUpdates.map((r) => ({
        id: r.id,
        title: r.candidate.skip_title,
      })),
    },
  };
}
