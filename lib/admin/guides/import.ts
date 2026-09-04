import "server-only";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import type { Guide, GuideComparisonPair, GuideItem } from "@/lib/guides/types";
import {
  COMPARISONS_SHEET_NAME,
  GUIDE_COMPARISON_EXCEL_COLUMNS,
  GUIDE_EXCEL_COLUMNS,
  GUIDE_SPOT_EXCEL_COLUMNS,
  GUIDES_SHEET_NAME,
  SPOTS_SHEET_NAME,
} from "./excel";
import {
  validateGuideComparisonInput,
  validateGuideInput,
  validateGuideItemInput,
  parseTags,
  type GuideComparisonInput,
  type GuideInput,
  type GuideItemInput,
} from "./validation";
import {
  cellText,
  isBlankText,
  parseBooleanCell,
  validateSheetHeaders,
} from "@/lib/admin/excelParsing";

export interface GuideImportCandidate {
  id: string | null;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  city: string;
  country_code: string;
  city_slug: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  duration_label: string | null;
  best_time: string | null;
  local_tip: string | null;
  route_mode: string | null;
  featured: boolean;
  is_public: boolean;
  sort_order: number;
  editorial_attribution: string | null;
}

export interface GuideSpotImportCandidate {
  id: string | null;
  guideSlug: string;
  position: number;
  title: string;
  neighborhood: string | null;
  address: string | null;
  description: string | null;
  google_maps_url: string | null;
  external_url: string | null;
  tags: string[] | null;
  place_name: string | null;
  image_url: string | null;
  image_alt: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface GuideComparisonImportCandidate {
  id: string | null;
  guideSlug: string;
  position: number;
  skip_title: string;
  skip_description: string | null;
  skip_neighborhood: string | null;
  skip_address: string | null;
  skip_google_maps_url: string | null;
  skip_external_url: string | null;
  skip_tags: string[] | null;
  go_instead_title: string;
  go_instead_description: string | null;
  go_instead_neighborhood: string | null;
  go_instead_address: string | null;
  go_instead_google_maps_url: string | null;
  go_instead_external_url: string | null;
  go_instead_tags: string[] | null;
  reason: string | null;
  skip_latitude: number | null;
  skip_longitude: number | null;
  go_instead_latitude: number | null;
  go_instead_longitude: number | null;
}

const GUIDE_FIELDS = GUIDE_EXCEL_COLUMNS.filter((c) => c.key !== "id").map(
  (c) => c.key,
);

const GUIDE_SPOT_FIELDS = GUIDE_SPOT_EXCEL_COLUMNS.filter(
  (c) => c.key !== "id" && c.key !== "guide_slug",
).map((c) => c.key);

const GUIDE_COMPARISON_FIELDS = GUIDE_COMPARISON_EXCEL_COLUMNS.filter(
  (c) => c.key !== "id" && c.key !== "guide_slug",
).map((c) => c.key);

interface RawGuideDisplay {
  id: string | null;
  title: string | null;
  slug: string | null;
}

interface RawSpotDisplay {
  id: string | null;
  guideSlug: string | null;
  title: string | null;
}

interface RawComparisonDisplay {
  id: string | null;
  guideSlug: string | null;
  skipTitle: string | null;
}

type ParsedGuideRow =
  | { rowNumber: number; kind: "candidate"; candidate: GuideImportCandidate }
  | {
      rowNumber: number;
      kind: "error";
      raw: RawGuideDisplay;
      errors: string[];
    };

type ParsedSpotRow =
  | {
      rowNumber: number;
      kind: "candidate";
      candidate: GuideSpotImportCandidate;
    }
  | {
      rowNumber: number;
      kind: "error";
      raw: RawSpotDisplay;
      errors: string[];
    };

type ParsedComparisonRow =
  | {
      rowNumber: number;
      kind: "candidate";
      candidate: GuideComparisonImportCandidate;
    }
  | {
      rowNumber: number;
      kind: "error";
      raw: RawComparisonDisplay;
      errors: string[];
    };

export type ParseGuidesWorkbookResult =
  | {
      ok: true;
      guideRows: ParsedGuideRow[];
      spotRows: ParsedSpotRow[];
      comparisonRows: ParsedComparisonRow[];
    }
  | { ok: false; error: string };

function parseIntegerCell(
  cell: ExcelJS.Cell,
  header: string,
  { allowBlank }: { allowBlank: boolean },
): { ok: true; value: number } | { ok: false; error: string } {
  const isBlank =
    cell.value === null || cell.value === undefined || cellText(cell) === "";

  if (isBlank) {
    if (allowBlank) return { ok: true, value: 0 };
    return { ok: false, error: `Column "${header}" is required.` };
  }

  if (typeof cell.value !== "number") {
    return { ok: false, error: `Column "${header}" must be a whole number.` };
  }

  if (!Number.isInteger(cell.value)) {
    return { ok: false, error: `Column "${header}" must be a whole number.` };
  }

  if (cell.value < 0) {
    return { ok: false, error: `Column "${header}" cannot be negative.` };
  }

  return { ok: true, value: cell.value };
}

function parseSheetRows<Candidate>(
  sheet: ExcelJS.Worksheet,
  columns: readonly { key: string; header: string }[],
  numericKeys: readonly string[],
  booleanKeys: readonly string[],
  buildCandidate: (
    values: Record<string, string | boolean | number>,
  ) => Candidate,
  buildRaw: (
    values: Record<string, string | boolean | number>,
  ) => Record<string, string | null>,
) {
  const rows: {
    rowNumber: number;
    kind: "candidate" | "error";
    candidate?: Candidate;
    raw?: Record<string, string | null>;
    errors?: string[];
  }[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const values: Record<string, string | boolean | number> = {};
    const errors: string[] = [];

    columns.forEach((column, index) => {
      const cell = row.getCell(index + 1);

      if (cell.type === ExcelJS.ValueType.Formula) {
        errors.push(
          `Column "${column.header}" contains a formula, which is not supported.`,
        );
        return;
      }

      if (booleanKeys.includes(column.key)) {
        const parsed = parseBooleanCell(cell, column.header);
        if (parsed.ok) values[column.key] = parsed.value;
        else errors.push(parsed.error);
        return;
      }

      if (numericKeys.includes(column.key)) {
        const parsed = parseIntegerCell(cell, column.header, {
          allowBlank: column.key === "sort_order",
        });
        if (parsed.ok) values[column.key] = parsed.value;
        else errors.push(parsed.error);
        return;
      }

      values[column.key] = cellText(cell);
    });

    const raw = buildRaw(values);

    const isBlankRow =
      errors.length === 0 &&
      columns.every((column) => {
        const value = values[column.key];
        if (typeof value === "boolean") return value === false;
        if (typeof value === "number") return value === 0;
        return isBlankText(String(value ?? ""));
      });
    if (isBlankRow) return;

    if (errors.length > 0) {
      rows.push({ rowNumber, kind: "error", raw, errors });
      return;
    }

    rows.push({
      rowNumber,
      kind: "candidate",
      candidate: buildCandidate(values),
    });
  });

  return rows;
}

function toNumberOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

export async function parseGuidesWorkbook(
  buffer: ArrayBuffer,
): Promise<ParseGuidesWorkbookResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return {
      ok: false,
      error: "Could not read this file as an Excel workbook.",
    };
  }

  const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME);
  if (!guidesSheet) {
    return {
      ok: false,
      error: `Missing the "${GUIDES_SHEET_NAME}" worksheet. Re-download the template and try again.`,
    };
  }

  const spotsSheet = workbook.getWorksheet(SPOTS_SHEET_NAME);
  if (!spotsSheet) {
    return {
      ok: false,
      error: `Missing the "${SPOTS_SHEET_NAME}" worksheet. Re-download the template and try again.`,
    };
  }

  const comparisonsSheet = workbook.getWorksheet(COMPARISONS_SHEET_NAME);
  if (!comparisonsSheet) {
    return {
      ok: false,
      error: `Missing the "${COMPARISONS_SHEET_NAME}" worksheet. Re-download the template and try again.`,
    };
  }

  const guideHeaders = GUIDE_EXCEL_COLUMNS.map((c) => c.header);
  if (!validateSheetHeaders(guidesSheet, guideHeaders)) {
    return {
      ok: false,
      error: `Unexpected columns on the "${GUIDES_SHEET_NAME}" sheet. Re-download the template and try again.`,
    };
  }

  const spotHeaders = GUIDE_SPOT_EXCEL_COLUMNS.map((c) => c.header);
  if (!validateSheetHeaders(spotsSheet, spotHeaders)) {
    return {
      ok: false,
      error: `Unexpected columns on the "${SPOTS_SHEET_NAME}" sheet. Re-download the template and try again.`,
    };
  }

  const comparisonHeaders = GUIDE_COMPARISON_EXCEL_COLUMNS.map((c) => c.header);
  if (!validateSheetHeaders(comparisonsSheet, comparisonHeaders)) {
    return {
      ok: false,
      error: `Unexpected columns on the "${COMPARISONS_SHEET_NAME}" sheet. Re-download the template and try again.`,
    };
  }

  const guideRows = parseSheetRows<GuideImportCandidate>(
    guidesSheet,
    GUIDE_EXCEL_COLUMNS,
    ["sort_order"],
    ["featured", "is_public"],
    (values) => ({
      id: (values.id as string) || null,
      title: values.title as string,
      slug: values.slug as string,
      description: (values.description as string) || null,
      type: values.type as string,
      city: values.city as string,
      country_code: values.country_code as string,
      city_slug: (values.city_slug as string) || null,
      cover_image_url: (values.cover_image_url as string) || null,
      cover_image_alt: (values.cover_image_alt as string) || null,
      duration_label: (values.duration_label as string) || null,
      best_time: (values.best_time as string) || null,
      local_tip: (values.local_tip as string) || null,
      route_mode: (values.route_mode as string) || null,
      featured: values.featured as boolean,
      is_public: values.is_public as boolean,
      sort_order: values.sort_order as number,
      editorial_attribution: (values.editorial_attribution as string) || null,
    }),
    (values) => ({
      id: (values.id as string) || null,
      title: (values.title as string) || null,
      slug: (values.slug as string) || null,
    }),
  ) as ParsedGuideRow[];

  const spotRows = parseSheetRows<GuideSpotImportCandidate>(
    spotsSheet,
    GUIDE_SPOT_EXCEL_COLUMNS,
    ["position"],
    [],
    (values) => ({
      id: (values.id as string) || null,
      guideSlug: values.guide_slug as string,
      position: values.position as number,
      title: values.title as string,
      neighborhood: (values.neighborhood as string) || null,
      address: (values.address as string) || null,
      description: (values.description as string) || null,
      google_maps_url: (values.google_maps_url as string) || null,
      external_url: (values.external_url as string) || null,
      tags: parseTags((values.tags as string) || ""),
      place_name: (values.place_name as string) || null,
      image_url: (values.image_url as string) || null,
      image_alt: (values.image_alt as string) || null,
      latitude: toNumberOrNull((values.latitude as string) || ""),
      longitude: toNumberOrNull((values.longitude as string) || ""),
    }),
    (values) => ({
      id: (values.id as string) || null,
      guideSlug: (values.guide_slug as string) || null,
      title: (values.title as string) || null,
    }),
  ) as ParsedSpotRow[];

  const comparisonRows = parseSheetRows<GuideComparisonImportCandidate>(
    comparisonsSheet,
    GUIDE_COMPARISON_EXCEL_COLUMNS,
    ["position"],
    [],
    (values) => ({
      id: (values.id as string) || null,
      guideSlug: values.guide_slug as string,
      position: values.position as number,
      skip_title: values.skip_title as string,
      skip_description: (values.skip_description as string) || null,
      skip_neighborhood: (values.skip_neighborhood as string) || null,
      skip_address: (values.skip_address as string) || null,
      skip_google_maps_url: (values.skip_google_maps_url as string) || null,
      skip_external_url: (values.skip_external_url as string) || null,
      skip_tags: parseTags((values.skip_tags as string) || ""),
      go_instead_title: values.go_instead_title as string,
      go_instead_description: (values.go_instead_description as string) || null,
      go_instead_neighborhood:
        (values.go_instead_neighborhood as string) || null,
      go_instead_address: (values.go_instead_address as string) || null,
      go_instead_google_maps_url:
        (values.go_instead_google_maps_url as string) || null,
      go_instead_external_url:
        (values.go_instead_external_url as string) || null,
      go_instead_tags: parseTags((values.go_instead_tags as string) || ""),
      reason: (values.reason as string) || null,
      skip_latitude: toNumberOrNull((values.skip_latitude as string) || ""),
      skip_longitude: toNumberOrNull((values.skip_longitude as string) || ""),
      go_instead_latitude: toNumberOrNull(
        (values.go_instead_latitude as string) || "",
      ),
      go_instead_longitude: toNumberOrNull(
        (values.go_instead_longitude as string) || "",
      ),
    }),
    (values) => ({
      id: (values.id as string) || null,
      guideSlug: (values.guide_slug as string) || null,
      skipTitle: (values.skip_title as string) || null,
    }),
  ) as ParsedComparisonRow[];

  return { ok: true, guideRows, spotRows, comparisonRows };
}

export interface GuideImportChange {
  field: (typeof GUIDE_FIELDS)[number];
  before: unknown;
  after: unknown;
}

export interface GuideSpotImportChange {
  field: (typeof GUIDE_SPOT_FIELDS)[number];
  before: unknown;
  after: unknown;
}

export interface GuideComparisonImportChange {
  field: (typeof GUIDE_COMPARISON_FIELDS)[number];
  before: unknown;
  after: unknown;
}

export type GuideImportParent =
  { kind: "existing"; guideId: string } | { kind: "new"; slug: string };

export type GuideImportPreviewRow =
  | { status: "create"; rowNumber: number; candidate: GuideImportCandidate }
  | {
      status: "update";
      rowNumber: number;
      id: string;
      candidate: GuideImportCandidate;
      changes: GuideImportChange[];
      baseFingerprint: string;
    }
  | { status: "unchanged"; rowNumber: number; id: string }
  | {
      status: "error";
      rowNumber: number;
      id: string | null;
      title: string | null;
      slug: string | null;
      errors: string[];
    };

export type GuideSpotImportPreviewRow =
  | {
      status: "create";
      rowNumber: number;
      candidate: GuideSpotImportCandidate;
      parent: GuideImportParent;
    }
  | {
      status: "update";
      rowNumber: number;
      id: string;
      candidate: GuideSpotImportCandidate;
      changes: GuideSpotImportChange[];
      baseFingerprint: string;
    }
  | { status: "unchanged"; rowNumber: number; id: string }
  | {
      status: "error";
      rowNumber: number;
      id: string | null;
      guideSlug: string | null;
      title: string | null;
      errors: string[];
    };

export type GuideComparisonImportPreviewRow =
  | {
      status: "create";
      rowNumber: number;
      candidate: GuideComparisonImportCandidate;
      parent: GuideImportParent;
    }
  | {
      status: "update";
      rowNumber: number;
      id: string;
      candidate: GuideComparisonImportCandidate;
      changes: GuideComparisonImportChange[];
      baseFingerprint: string;
    }
  | { status: "unchanged"; rowNumber: number; id: string }
  | {
      status: "error";
      rowNumber: number;
      id: string | null;
      guideSlug: string | null;
      skipTitle: string | null;
      errors: string[];
    };

export interface GuideImportSummary {
  total: number;
  create: number;
  update: number;
  unchanged: number;
  error: number;
}

export interface GuideImportPreview {
  guides: GuideImportPreviewRow[];
  spots: GuideSpotImportPreviewRow[];
  comparisons: GuideComparisonImportPreviewRow[];
  summary: {
    guides: GuideImportSummary;
    spots: GuideImportSummary;
    comparisons: GuideImportSummary;
  };
}

function toGuideValidationInput(candidate: GuideImportCandidate): GuideInput {
  return {
    title: candidate.title,
    slug: candidate.slug,
    description: candidate.description ?? "",
    type: candidate.type,
    city: candidate.city,
    country_code: candidate.country_code,
    city_slug: candidate.city_slug ?? "",
    cover_image_url: candidate.cover_image_url ?? "",
    cover_image_alt: candidate.cover_image_alt ?? "",
    duration_label: candidate.duration_label ?? "",
    editorial_attribution: candidate.editorial_attribution ?? "",
    best_time: candidate.best_time ?? "",
    local_tip: candidate.local_tip ?? "",
    route_mode: candidate.route_mode ?? "",
    sort_order: candidate.sort_order,
    featured: candidate.featured,
    is_public: candidate.is_public,
  };
}

function toGuideSpotValidationInput(
  candidate: GuideSpotImportCandidate,
): GuideItemInput {
  return {
    title: candidate.title,
    description: candidate.description ?? "",
    place_name: candidate.place_name ?? "",
    image_url: candidate.image_url ?? "",
    image_alt: candidate.image_alt ?? "",
    external_url: candidate.external_url ?? "",
    neighborhood: candidate.neighborhood ?? "",
    address: candidate.address ?? "",
    latitude: candidate.latitude === null ? "" : String(candidate.latitude),
    longitude: candidate.longitude === null ? "" : String(candidate.longitude),
    google_maps_url: candidate.google_maps_url ?? "",
    tags: (candidate.tags ?? []).join(", "),
  };
}

function toGuideComparisonValidationInput(
  candidate: GuideComparisonImportCandidate,
): GuideComparisonInput {
  return {
    skip_title: candidate.skip_title,
    skip_description: candidate.skip_description ?? "",
    skip_neighborhood: candidate.skip_neighborhood ?? "",
    skip_address: candidate.skip_address ?? "",
    skip_latitude:
      candidate.skip_latitude === null ? "" : String(candidate.skip_latitude),
    skip_longitude:
      candidate.skip_longitude === null ? "" : String(candidate.skip_longitude),
    skip_google_maps_url: candidate.skip_google_maps_url ?? "",
    skip_external_url: candidate.skip_external_url ?? "",
    skip_tags: (candidate.skip_tags ?? []).join(", "),
    go_instead_title: candidate.go_instead_title,
    go_instead_description: candidate.go_instead_description ?? "",
    go_instead_neighborhood: candidate.go_instead_neighborhood ?? "",
    go_instead_address: candidate.go_instead_address ?? "",
    go_instead_latitude:
      candidate.go_instead_latitude === null
        ? ""
        : String(candidate.go_instead_latitude),
    go_instead_longitude:
      candidate.go_instead_longitude === null
        ? ""
        : String(candidate.go_instead_longitude),
    go_instead_google_maps_url: candidate.go_instead_google_maps_url ?? "",
    go_instead_external_url: candidate.go_instead_external_url ?? "",
    go_instead_tags: (candidate.go_instead_tags ?? []).join(", "),
    reason: candidate.reason ?? "",
  };
}

export function fingerprintGuide(existing: Guide): string {
  const canonical = GUIDE_FIELDS.map((field) =>
    JSON.stringify(existing[field as keyof Guide] ?? null),
  ).join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

function fingerprintTags(tags: string[] | null | undefined): string {
  return JSON.stringify((tags ?? []).slice().sort());
}

export function fingerprintGuideSpot(existing: GuideItem): string {
  const canonical = GUIDE_SPOT_FIELDS.map((field) => {
    if (field === "tags") return fingerprintTags(existing.tags);
    return JSON.stringify(existing[field as keyof GuideItem] ?? null);
  }).join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

export function fingerprintGuideComparison(
  existing: GuideComparisonPair,
): string {
  const canonical = GUIDE_COMPARISON_FIELDS.map((field) => {
    if (field === "skip_tags") return fingerprintTags(existing.skip_tags);
    if (field === "go_instead_tags")
      return fingerprintTags(existing.go_instead_tags);
    return JSON.stringify(existing[field as keyof GuideComparisonPair] ?? null);
  }).join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

function diffGuide(
  candidate: GuideImportCandidate,
  existing: Guide,
): GuideImportChange[] {
  const changes: GuideImportChange[] = [];
  for (const field of GUIDE_FIELDS) {
    const after = candidate[field as keyof GuideImportCandidate];
    const before = existing[field as keyof Guide] ?? null;
    if (before !== after) changes.push({ field, before, after });
  }
  return changes;
}

function diffGuideSpot(
  candidate: GuideSpotImportCandidate,
  existing: GuideItem,
): GuideSpotImportChange[] {
  const changes: GuideSpotImportChange[] = [];
  for (const field of GUIDE_SPOT_FIELDS) {
    if (field === "tags") {
      const after = fingerprintTags(candidate.tags);
      const before = fingerprintTags(existing.tags);
      if (before !== after)
        changes.push({ field, before: existing.tags, after: candidate.tags });
      continue;
    }
    const after = candidate[field as keyof GuideSpotImportCandidate];
    const before = existing[field as keyof GuideItem] ?? null;
    if (before !== after) changes.push({ field, before, after });
  }
  return changes;
}

function diffGuideComparison(
  candidate: GuideComparisonImportCandidate,
  existing: GuideComparisonPair,
): GuideComparisonImportChange[] {
  const changes: GuideComparisonImportChange[] = [];
  for (const field of GUIDE_COMPARISON_FIELDS) {
    if (field === "skip_tags" || field === "go_instead_tags") {
      const candidateTags = candidate[field as "skip_tags" | "go_instead_tags"];
      const existingTags = existing[field as "skip_tags" | "go_instead_tags"];
      const after = fingerprintTags(candidateTags);
      const before = fingerprintTags(existingTags);
      if (before !== after)
        changes.push({ field, before: existingTags, after: candidateTags });
      continue;
    }
    const after = candidate[field as keyof GuideComparisonImportCandidate];
    const before = existing[field as keyof GuideComparisonPair] ?? null;
    if (before !== after) changes.push({ field, before, after });
  }
  return changes;
}

function buildGuideParentIndex(
  guidePreviewRows: GuideImportPreviewRow[],
  existingGuides: Guide[],
): Map<string, GuideImportParent> {
  const index = new Map<string, GuideImportParent>();

  for (const guide of existingGuides) {
    index.set(guide.slug, { kind: "existing", guideId: guide.id });
  }

  for (const row of guidePreviewRows) {
    if (row.status === "create") {
      index.set(row.candidate.slug, { kind: "new", slug: row.candidate.slug });
    } else if (row.status === "update" || row.status === "unchanged") {
      const slug = row.status === "update" ? row.candidate.slug : undefined;
      if (slug) index.set(slug, { kind: "existing", guideId: row.id });
    }
  }

  return index;
}

function summarize(rows: { status: string }[]): GuideImportSummary {
  return {
    total: rows.length,
    create: rows.filter((r) => r.status === "create").length,
    update: rows.filter((r) => r.status === "update").length,
    unchanged: rows.filter((r) => r.status === "unchanged").length,
    error: rows.filter((r) => r.status === "error").length,
  };
}

export function buildGuideImportPreview(
  guideRows: ParsedGuideRow[],
  spotRows: ParsedSpotRow[],
  comparisonRows: ParsedComparisonRow[],
  existingGuides: Guide[],
  existingSpots: GuideItem[],
  existingComparisons: GuideComparisonPair[],
): GuideImportPreview {
  const existingGuideById = new Map(existingGuides.map((g) => [g.id, g]));
  const existingGuideBySlug = new Map(existingGuides.map((g) => [g.slug, g]));
  const existingSpotById = new Map(existingSpots.map((i) => [i.id, i]));
  const existingComparisonById = new Map(
    existingComparisons.map((c) => [c.id, c]),
  );

  const guideIdCounts = new Map<string, number>();
  const guideSlugCounts = new Map<string, number>();

  for (const row of guideRows) {
    if (row.kind !== "candidate") continue;
    if (row.candidate.id) {
      guideIdCounts.set(
        row.candidate.id,
        (guideIdCounts.get(row.candidate.id) ?? 0) + 1,
      );
    }
    guideSlugCounts.set(
      row.candidate.slug,
      (guideSlugCounts.get(row.candidate.slug) ?? 0) + 1,
    );
  }

  const guidePreviewRows: GuideImportPreviewRow[] = guideRows.map((row) => {
    if (row.kind === "error") {
      return {
        status: "error",
        rowNumber: row.rowNumber,
        id: row.raw.id,
        title: row.raw.title,
        slug: row.raw.slug,
        errors: row.errors,
      };
    }

    const { candidate } = row;
    const errors: string[] = [];

    if (candidate.id && (guideIdCounts.get(candidate.id) ?? 0) > 1) {
      errors.push("This id appears more than once in this file.");
    }
    if ((guideSlugCounts.get(candidate.slug) ?? 0) > 1) {
      errors.push("This slug appears more than once in this file.");
    }

    const domainError = validateGuideInput(toGuideValidationInput(candidate));
    if (domainError) errors.push(domainError);

    let existingRow: Guide | undefined;
    if (candidate.id) {
      existingRow = existingGuideById.get(candidate.id);
      if (!existingRow) errors.push("No guide exists with this id.");
    }

    const slugOwner = existingGuideBySlug.get(candidate.slug);
    if (slugOwner && slugOwner.id !== candidate.id) {
      errors.push("This slug is already used by another guide.");
    }

    if (errors.length > 0) {
      return {
        status: "error",
        rowNumber: row.rowNumber,
        id: candidate.id,
        title: candidate.title || null,
        slug: candidate.slug || null,
        errors,
      };
    }

    if (!candidate.id) {
      return { status: "create", rowNumber: row.rowNumber, candidate };
    }

    const changes = diffGuide(candidate, existingRow!);
    if (changes.length === 0) {
      return {
        status: "unchanged",
        rowNumber: row.rowNumber,
        id: candidate.id,
      };
    }

    return {
      status: "update",
      rowNumber: row.rowNumber,
      id: candidate.id,
      candidate,
      changes,
      baseFingerprint: fingerprintGuide(existingRow!),
    };
  });

  const guideParentIndex = buildGuideParentIndex(
    guidePreviewRows,
    existingGuides,
  );

  function resolveParent(guideSlug: string): GuideImportParent | null {
    if (!guideSlug) return null;
    return guideParentIndex.get(guideSlug) ?? null;
  }

  function resolveChildErrors<
    Candidate extends {
      id: string | null;
      guideSlug: string;
      position: number;
    },
  >(
    rows: (
      | { rowNumber: number; kind: "candidate"; candidate: Candidate }
      | { rowNumber: number; kind: "error" }
    )[],
    existingById: Map<string, { guide_id: string }>,
    domainError: (candidate: Candidate) => string | null,
  ) {
    const idCounts = new Map<string, number>();
    for (const row of rows) {
      if (row.kind !== "candidate" || !row.candidate.id) continue;
      idCounts.set(row.candidate.id, (idCounts.get(row.candidate.id) ?? 0) + 1);
    }

    interface Resolved {
      rowNumber: number;
      candidate: Candidate;
      errors: string[];
      parent: GuideImportParent | null;
      existing?: { guide_id: string };
    }

    const resolved: Resolved[] = [];

    for (const row of rows) {
      if (row.kind !== "candidate") continue;
      const candidate = row.candidate;
      const errors: string[] = [];
      let parent: GuideImportParent | null = null;
      let existing: { guide_id: string } | undefined;

      if (candidate.id && (idCounts.get(candidate.id) ?? 0) > 1) {
        errors.push("This id appears more than once in this file.");
      }

      if (!candidate.guideSlug) {
        errors.push("guide_slug is required.");
      } else {
        parent = resolveParent(candidate.guideSlug);
        if (!parent) errors.push("No guide exists with this guide_slug.");
      }

      if (candidate.id) {
        existing = existingById.get(candidate.id);
        if (!existing) {
          errors.push("No row exists with this id.");
        } else if (
          parent &&
          (parent.kind !== "existing" || parent.guideId !== existing.guide_id)
        ) {
          errors.push(
            "Moving rows between guides is not supported. Keep guide_slug pointed at the current guide.",
          );
        }
      }

      const err = domainError(candidate);
      if (err) errors.push(err);

      resolved.push({
        rowNumber: row.rowNumber,
        candidate,
        errors,
        parent,
        existing,
      });
    }

    const positionGroups = new Map<string, Map<number, number[]>>();
    for (const entry of resolved) {
      if (entry.errors.length > 0 || !entry.parent) continue;
      const key =
        entry.parent.kind === "existing"
          ? `existing:${entry.parent.guideId}`
          : `new:${entry.parent.slug}`;
      const byPosition = positionGroups.get(key) ?? new Map<number, number[]>();
      const list = byPosition.get(entry.candidate.position) ?? [];
      list.push(entry.rowNumber);
      byPosition.set(entry.candidate.position, list);
      positionGroups.set(key, byPosition);
    }

    for (const entry of resolved) {
      if (entry.errors.length > 0 || !entry.parent) continue;
      const key =
        entry.parent.kind === "existing"
          ? `existing:${entry.parent.guideId}`
          : `new:${entry.parent.slug}`;
      const rowsAtPosition = positionGroups
        .get(key)!
        .get(entry.candidate.position)!;
      if (rowsAtPosition.length > 1) {
        entry.errors.push(
          `Duplicate position ${entry.candidate.position} within this guide.`,
        );
      }
    }

    return resolved;
  }

  const resolvedSpots = resolveChildErrors(
    spotRows,
    existingSpotById,
    (candidate) =>
      validateGuideItemInput(toGuideSpotValidationInput(candidate)),
  );

  const spotPreviewRows: GuideSpotImportPreviewRow[] = [];

  for (const row of spotRows) {
    if (row.kind === "error") {
      spotPreviewRows.push({
        status: "error",
        rowNumber: row.rowNumber,
        id: row.raw.id,
        guideSlug: row.raw.guideSlug,
        title: row.raw.title,
        errors: row.errors,
      });
      continue;
    }

    const entry = resolvedSpots.find((r) => r.rowNumber === row.rowNumber)!;
    const { candidate } = row;

    if (entry.errors.length > 0) {
      spotPreviewRows.push({
        status: "error",
        rowNumber: row.rowNumber,
        id: candidate.id,
        guideSlug: candidate.guideSlug || null,
        title: candidate.title || null,
        errors: entry.errors,
      });
      continue;
    }

    if (!candidate.id) {
      spotPreviewRows.push({
        status: "create",
        rowNumber: row.rowNumber,
        candidate,
        parent: entry.parent!,
      });
      continue;
    }

    const existingSpot = existingSpotById.get(candidate.id)!;
    const changes = diffGuideSpot(candidate, existingSpot);
    if (changes.length === 0) {
      spotPreviewRows.push({
        status: "unchanged",
        rowNumber: row.rowNumber,
        id: candidate.id,
      });
    } else {
      spotPreviewRows.push({
        status: "update",
        rowNumber: row.rowNumber,
        id: candidate.id,
        candidate,
        changes,
        baseFingerprint: fingerprintGuideSpot(existingSpot),
      });
    }
  }

  const resolvedComparisons = resolveChildErrors(
    comparisonRows,
    existingComparisonById,
    (candidate) =>
      validateGuideComparisonInput(toGuideComparisonValidationInput(candidate)),
  );

  const comparisonPreviewRows: GuideComparisonImportPreviewRow[] = [];

  for (const row of comparisonRows) {
    if (row.kind === "error") {
      comparisonPreviewRows.push({
        status: "error",
        rowNumber: row.rowNumber,
        id: row.raw.id,
        guideSlug: row.raw.guideSlug,
        skipTitle: row.raw.skipTitle,
        errors: row.errors,
      });
      continue;
    }

    const entry = resolvedComparisons.find(
      (r) => r.rowNumber === row.rowNumber,
    )!;
    const { candidate } = row;

    if (entry.errors.length > 0) {
      comparisonPreviewRows.push({
        status: "error",
        rowNumber: row.rowNumber,
        id: candidate.id,
        guideSlug: candidate.guideSlug || null,
        skipTitle: candidate.skip_title || null,
        errors: entry.errors,
      });
      continue;
    }

    if (!candidate.id) {
      comparisonPreviewRows.push({
        status: "create",
        rowNumber: row.rowNumber,
        candidate,
        parent: entry.parent!,
      });
      continue;
    }

    const existingComparison = existingComparisonById.get(candidate.id)!;
    const changes = diffGuideComparison(candidate, existingComparison);
    if (changes.length === 0) {
      comparisonPreviewRows.push({
        status: "unchanged",
        rowNumber: row.rowNumber,
        id: candidate.id,
      });
    } else {
      comparisonPreviewRows.push({
        status: "update",
        rowNumber: row.rowNumber,
        id: candidate.id,
        candidate,
        changes,
        baseFingerprint: fingerprintGuideComparison(existingComparison),
      });
    }
  }

  return {
    guides: guidePreviewRows,
    spots: spotPreviewRows,
    comparisons: comparisonPreviewRows,
    summary: {
      guides: summarize(guidePreviewRows),
      spots: summarize(spotPreviewRows),
      comparisons: summarize(comparisonPreviewRows),
    },
  };
}
