import "server-only";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import type { Guide, GuideItem } from "@/lib/guides/types";
import {
  GUIDE_EXCEL_COLUMNS,
  GUIDE_ITEM_EXCEL_COLUMNS,
  GUIDE_ITEMS_SHEET_NAME,
  GUIDES_SHEET_NAME,
} from "./excel";
import {
  validateGuideInput,
  validateGuideItemInput,
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
  importRef: string | null;
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
  featured: boolean;
  is_public: boolean;
  sort_order: number;
  editorial_attribution: string | null;
}

export interface GuideItemImportCandidate {
  id: string | null;
  guideIdRaw: string | null;
  guideRefRaw: string | null;
  position: number;
  title: string;
  description: string | null;
  place_id: string | null;
  place_name: string | null;
  image_url: string | null;
  image_alt: string | null;
  external_url: string | null;
}

const GUIDE_FIELDS = GUIDE_EXCEL_COLUMNS.filter(
  (c) => c.key !== "id" && c.key !== "import_ref",
).map((c) => c.key);

const GUIDE_ITEM_FIELDS = GUIDE_ITEM_EXCEL_COLUMNS.filter(
  (c) => c.key !== "id" && c.key !== "guide_id" && c.key !== "guide_ref",
).map((c) => c.key);

interface RawGuideDisplay {
  id: string | null;
  importRef: string | null;
  title: string | null;
  slug: string | null;
}

interface RawGuideItemDisplay {
  id: string | null;
  guideId: string | null;
  guideRef: string | null;
  title: string | null;
}

type ParsedGuideRow =
  | { rowNumber: number; kind: "candidate"; candidate: GuideImportCandidate }
  | {
      rowNumber: number;
      kind: "error";
      raw: RawGuideDisplay;
      errors: string[];
    };

type ParsedGuideItemRow =
  | {
      rowNumber: number;
      kind: "candidate";
      candidate: GuideItemImportCandidate;
    }
  | {
      rowNumber: number;
      kind: "error";
      raw: RawGuideItemDisplay;
      errors: string[];
    };

export type ParseGuidesWorkbookResult =
  | { ok: true; guideRows: ParsedGuideRow[]; itemRows: ParsedGuideItemRow[] }
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

  const itemsSheet = workbook.getWorksheet(GUIDE_ITEMS_SHEET_NAME);
  if (!itemsSheet) {
    return {
      ok: false,
      error: `Missing the "${GUIDE_ITEMS_SHEET_NAME}" worksheet. Re-download the template and try again.`,
    };
  }

  const guideHeaders = GUIDE_EXCEL_COLUMNS.map((c) => c.header);
  if (!validateSheetHeaders(guidesSheet, guideHeaders)) {
    return {
      ok: false,
      error: `Unexpected columns on the "${GUIDES_SHEET_NAME}" sheet. Re-download the template and try again.`,
    };
  }

  const itemHeaders = GUIDE_ITEM_EXCEL_COLUMNS.map((c) => c.header);
  if (!validateSheetHeaders(itemsSheet, itemHeaders)) {
    return {
      ok: false,
      error: `Unexpected columns on the "${GUIDE_ITEMS_SHEET_NAME}" sheet. Re-download the template and try again.`,
    };
  }

  const guideRows = parseSheetRows<GuideImportCandidate>(
    guidesSheet,
    GUIDE_EXCEL_COLUMNS,
    ["sort_order"],
    ["featured", "is_public"],
    (values) => ({
      id: (values.id as string) || null,
      importRef: (values.import_ref as string) || null,
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
      featured: values.featured as boolean,
      is_public: values.is_public as boolean,
      sort_order: values.sort_order as number,
      editorial_attribution: (values.editorial_attribution as string) || null,
    }),
    (values) => ({
      id: (values.id as string) || null,
      importRef: (values.import_ref as string) || null,
      title: (values.title as string) || null,
      slug: (values.slug as string) || null,
    }),
  ) as ParsedGuideRow[];

  const itemRows = parseSheetRows<GuideItemImportCandidate>(
    itemsSheet,
    GUIDE_ITEM_EXCEL_COLUMNS,
    ["position"],
    [],
    (values) => ({
      id: (values.id as string) || null,
      guideIdRaw: (values.guide_id as string) || null,
      guideRefRaw: (values.guide_ref as string) || null,
      position: values.position as number,
      title: values.title as string,
      description: (values.description as string) || null,
      place_id: (values.place_id as string) || null,
      place_name: (values.place_name as string) || null,
      image_url: (values.image_url as string) || null,
      image_alt: (values.image_alt as string) || null,
      external_url: (values.external_url as string) || null,
    }),
    (values) => ({
      id: (values.id as string) || null,
      guideId: (values.guide_id as string) || null,
      guideRef: (values.guide_ref as string) || null,
      title: (values.title as string) || null,
    }),
  ) as ParsedGuideItemRow[];

  return { ok: true, guideRows, itemRows };
}

export interface GuideImportChange {
  field: (typeof GUIDE_FIELDS)[number];
  before: unknown;
  after: unknown;
}

export interface GuideItemImportChange {
  field: (typeof GUIDE_ITEM_FIELDS)[number];
  before: unknown;
  after: unknown;
}

export type GuideImportParent =
  { kind: "existing"; guideId: string } | { kind: "new"; importRef: string };

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
      importRef: string | null;
      title: string | null;
      slug: string | null;
      errors: string[];
    };

export type GuideItemImportPreviewRow =
  | {
      status: "create";
      rowNumber: number;
      candidate: GuideItemImportCandidate;
      parent: GuideImportParent;
    }
  | {
      status: "update";
      rowNumber: number;
      id: string;
      candidate: GuideItemImportCandidate;
      changes: GuideItemImportChange[];
      baseFingerprint: string;
    }
  | { status: "unchanged"; rowNumber: number; id: string }
  | {
      status: "error";
      rowNumber: number;
      id: string | null;
      guideId: string | null;
      guideRef: string | null;
      title: string | null;
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
  items: GuideItemImportPreviewRow[];
  summary: { guides: GuideImportSummary; items: GuideImportSummary };
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
    best_time: "",
    local_tip: "",
    route_mode: "",
    sort_order: candidate.sort_order,
    featured: candidate.featured,
    is_public: candidate.is_public,
  };
}

function toGuideItemValidationInput(
  candidate: GuideItemImportCandidate,
): GuideItemInput {
  return {
    title: candidate.title,
    description: candidate.description ?? "",
    place_name: candidate.place_name ?? "",
    image_url: candidate.image_url ?? "",
    image_alt: candidate.image_alt ?? "",
    external_url: candidate.external_url ?? "",
    neighborhood: "",
    address: "",
    latitude: "",
    longitude: "",
    google_maps_url: "",
    tags: "",
  };
}

export function fingerprintGuide(existing: Guide): string {
  const canonical = GUIDE_FIELDS.map((field) =>
    JSON.stringify(existing[field as keyof Guide] ?? null),
  ).join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

export function fingerprintGuideItem(existing: GuideItem): string {
  const canonical = GUIDE_ITEM_FIELDS.map((field) =>
    JSON.stringify(existing[field as keyof GuideItem] ?? null),
  ).join("|");
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

function diffGuideItem(
  candidate: GuideItemImportCandidate,
  existing: GuideItem,
): GuideItemImportChange[] {
  const changes: GuideItemImportChange[] = [];
  for (const field of GUIDE_ITEM_FIELDS) {
    const after = candidate[field as keyof GuideItemImportCandidate];
    const before = existing[field as keyof GuideItem] ?? null;
    if (before !== after) changes.push({ field, before, after });
  }
  return changes;
}

export function buildGuideImportPreview(
  guideRows: ParsedGuideRow[],
  itemRows: ParsedGuideItemRow[],
  existingGuides: Guide[],
  existingItems: GuideItem[],
): GuideImportPreview {
  const existingGuideById = new Map(existingGuides.map((g) => [g.id, g]));
  const existingGuideBySlug = new Map(existingGuides.map((g) => [g.slug, g]));
  const existingItemById = new Map(existingItems.map((i) => [i.id, i]));

  const guideIdCounts = new Map<string, number>();
  const importRefCounts = new Map<string, number>();
  const guideSlugCounts = new Map<string, number>();

  for (const row of guideRows) {
    if (row.kind !== "candidate") continue;
    if (row.candidate.id) {
      guideIdCounts.set(
        row.candidate.id,
        (guideIdCounts.get(row.candidate.id) ?? 0) + 1,
      );
    }
    if (row.candidate.importRef) {
      importRefCounts.set(
        row.candidate.importRef,
        (importRefCounts.get(row.candidate.importRef) ?? 0) + 1,
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
        importRef: row.raw.importRef,
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
    if (
      candidate.importRef &&
      (importRefCounts.get(candidate.importRef) ?? 0) > 1
    ) {
      errors.push("This import_ref appears more than once in this file.");
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
        importRef: candidate.importRef,
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

  const validCreateImportRefs = new Set(
    guidePreviewRows
      .filter((row) => row.status === "create")
      .map((row) => row.candidate.importRef)
      .filter((ref): ref is string => Boolean(ref)),
  );

  const itemIdCounts = new Map<string, number>();
  for (const row of itemRows) {
    if (row.kind !== "candidate" || !row.candidate.id) continue;
    itemIdCounts.set(
      row.candidate.id,
      (itemIdCounts.get(row.candidate.id) ?? 0) + 1,
    );
  }

  interface Resolved {
    row: ParsedGuideItemRow & { kind: "candidate" };
    errors: string[];
    resolvedKey: string | null;
    parent: GuideImportParent | null;
    existingItem?: GuideItem;
  }

  const resolved: Resolved[] = [];

  for (const row of itemRows) {
    if (row.kind === "error") continue;
    const candidate = row.candidate;
    const errors: string[] = [];
    let parent: GuideImportParent | null = null;
    let existingItem: GuideItem | undefined;

    if (candidate.id && (itemIdCounts.get(candidate.id) ?? 0) > 1) {
      errors.push("This id appears more than once in this file.");
    }

    const hasGuideId = Boolean(candidate.guideIdRaw);
    const hasGuideRef = Boolean(candidate.guideRefRaw);

    if (candidate.id) {
      existingItem = existingItemById.get(candidate.id);
      if (!existingItem) {
        errors.push("No guide item exists with this id.");
      } else {
        if (hasGuideRef) {
          errors.push("guide_ref must be blank for existing Guide Items.");
        }
        if (!hasGuideId) {
          errors.push("guide_id is required for existing Guide Items.");
        } else if (candidate.guideIdRaw !== existingItem.guide_id) {
          errors.push(
            "Moving Guide Items between guides is not supported. Keep guide_id unchanged.",
          );
        } else {
          parent = { kind: "existing", guideId: existingItem.guide_id };
        }
      }
    } else {
      if (hasGuideId && hasGuideRef) {
        errors.push("Provide either guide_id or guide_ref, not both.");
      } else if (!hasGuideId && !hasGuideRef) {
        errors.push("guide_id or guide_ref is required.");
      } else if (hasGuideId) {
        const targetGuide = existingGuideById.get(candidate.guideIdRaw!);
        if (!targetGuide) errors.push("No guide exists with this guide_id.");
        else parent = { kind: "existing", guideId: candidate.guideIdRaw! };
      } else if (hasGuideRef) {
        if (!validCreateImportRefs.has(candidate.guideRefRaw!)) {
          errors.push("No new guide in this file has that guide_ref.");
        } else {
          parent = { kind: "new", importRef: candidate.guideRefRaw! };
        }
      }
    }

    const domainError = validateGuideItemInput(
      toGuideItemValidationInput(candidate),
    );
    if (domainError) errors.push(domainError);

    const resolvedKey = parent
      ? parent.kind === "existing"
        ? `existing:${parent.guideId}`
        : `new:${parent.importRef}`
      : null;

    resolved.push({
      row: row as ParsedGuideItemRow & { kind: "candidate" },
      errors,
      resolvedKey,
      parent,
      existingItem,
    });
  }

  const positionGroups = new Map<string, Map<number, number[]>>();
  for (const entry of resolved) {
    if (entry.errors.length > 0 || !entry.resolvedKey) continue;
    const byPosition =
      positionGroups.get(entry.resolvedKey) ?? new Map<number, number[]>();
    const list = byPosition.get(entry.row.candidate.position) ?? [];
    list.push(entry.row.rowNumber);
    byPosition.set(entry.row.candidate.position, list);
    positionGroups.set(entry.resolvedKey, byPosition);
  }

  for (const entry of resolved) {
    if (entry.errors.length > 0 || !entry.resolvedKey) continue;
    const rowsAtPosition = positionGroups
      .get(entry.resolvedKey)!
      .get(entry.row.candidate.position)!;
    if (rowsAtPosition.length > 1) {
      entry.errors.push(
        `Duplicate position ${entry.row.candidate.position} within this guide.`,
      );
    }
  }

  const itemPreviewRows: GuideItemImportPreviewRow[] = [];

  for (const row of itemRows) {
    if (row.kind === "error") {
      itemPreviewRows.push({
        status: "error",
        rowNumber: row.rowNumber,
        id: row.raw.id,
        guideId: row.raw.guideId,
        guideRef: row.raw.guideRef,
        title: row.raw.title,
        errors: row.errors,
      });
      continue;
    }

    const entry = resolved.find((r) => r.row.rowNumber === row.rowNumber)!;
    const { candidate } = row;

    if (entry.errors.length > 0) {
      itemPreviewRows.push({
        status: "error",
        rowNumber: row.rowNumber,
        id: candidate.id,
        guideId: candidate.guideIdRaw,
        guideRef: candidate.guideRefRaw,
        title: candidate.title || null,
        errors: entry.errors,
      });
      continue;
    }

    if (!candidate.id) {
      itemPreviewRows.push({
        status: "create",
        rowNumber: row.rowNumber,
        candidate,
        parent: entry.parent!,
      });
      continue;
    }

    const changes = diffGuideItem(candidate, entry.existingItem!);
    if (changes.length === 0) {
      itemPreviewRows.push({
        status: "unchanged",
        rowNumber: row.rowNumber,
        id: candidate.id,
      });
    } else {
      itemPreviewRows.push({
        status: "update",
        rowNumber: row.rowNumber,
        id: candidate.id,
        candidate,
        changes,
        baseFingerprint: fingerprintGuideItem(entry.existingItem!),
      });
    }
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

  return {
    guides: guidePreviewRows,
    items: itemPreviewRows,
    summary: {
      guides: summarize(guidePreviewRows),
      items: summarize(itemPreviewRows),
    },
  };
}
