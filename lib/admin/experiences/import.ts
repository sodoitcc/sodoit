import "server-only";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { EXPERIENCE_EXCEL_COLUMNS, EXPERIENCES_SHEET_NAME } from "./excel";
import { validateExperienceInput, type ExperienceInput } from "./validation";
import { CATEGORIES } from "@/app/(app)/browse/types";
import type { ExperienceExportItem } from "./queries";
import {
  cellText,
  hasXlsxSignature,
  isBlankText,
  MAX_IMPORT_UPLOAD_BYTES,
  parseBooleanCell,
  validateSheetHeaders,
} from "@/lib/admin/excelParsing";

export { hasXlsxSignature, MAX_IMPORT_UPLOAD_BYTES };

function parseWhatToKnow(cellValue: string | undefined): string[] | null {
  const items = String(cellValue ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

export interface ExperienceImportCandidate {
  id: string | null;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  location_type: string;
  country_code: string | null;
  city: string | null;
  image_url: string | null;
  image_alt: string | null;
  why_it_matters: string | null;
  what_to_know: string[] | null;
  best_time: string | null;
  duration_text: string | null;
  location_note: string | null;
  featured: boolean;
  is_public: boolean;
}

const CANDIDATE_FIELDS = EXPERIENCE_EXCEL_COLUMNS.filter(
  (column) => column.key !== "id",
).map((column) => column.key);

interface RawRowDisplay {
  id: string | null;
  title: string | null;
  slug: string | null;
}

type ParsedRow =
  | {
      rowNumber: number;
      kind: "candidate";
      candidate: ExperienceImportCandidate;
    }
  | { rowNumber: number; kind: "error"; raw: RawRowDisplay; errors: string[] };

export type ParseWorkbookResult =
  { ok: true; rows: ParsedRow[] } | { ok: false; error: string };

export async function parseExperiencesWorkbook(
  buffer: ArrayBuffer,
): Promise<ParseWorkbookResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return {
      ok: false,
      error: "Could not read this file as an Excel workbook.",
    };
  }

  const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME);
  if (!sheet) {
    return {
      ok: false,
      error: `Missing the "${EXPERIENCES_SHEET_NAME}" worksheet. Re-download the template and try again.`,
    };
  }

  const expectedHeaders = EXPERIENCE_EXCEL_COLUMNS.map(
    (column) => column.header,
  );

  if (!validateSheetHeaders(sheet, expectedHeaders)) {
    return {
      ok: false,
      error:
        "Unexpected column headers. Re-download the template and try again.",
    };
  }

  const rows: ParsedRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const values: Record<string, string | boolean> = {};
    const errors: string[] = [];

    EXPERIENCE_EXCEL_COLUMNS.forEach((column, index) => {
      const cell = row.getCell(index + 1);

      if (cell.type === ExcelJS.ValueType.Formula) {
        errors.push(
          `Column "${column.header}" contains a formula, which is not supported.`,
        );
        return;
      }

      if (column.key === "featured" || column.key === "is_public") {
        const parsed = parseBooleanCell(cell, column.header);
        if (parsed.ok) values[column.key] = parsed.value;
        else errors.push(parsed.error);
        return;
      }

      values[column.key] = cellText(cell);
    });

    const rawDisplay: RawRowDisplay = {
      id: typeof values.id === "string" && values.id ? values.id : null,
      title:
        typeof values.title === "string" && values.title ? values.title : null,
      slug: typeof values.slug === "string" && values.slug ? values.slug : null,
    };

    const isBlankRow =
      errors.length === 0 &&
      EXPERIENCE_EXCEL_COLUMNS.every((column) => {
        const value = values[column.key];
        return typeof value === "boolean"
          ? value === false
          : isBlankText(String(value ?? ""));
      });
    if (isBlankRow) return;

    if (errors.length > 0) {
      rows.push({ rowNumber, kind: "error", raw: rawDisplay, errors });
      return;
    }

    const candidate: ExperienceImportCandidate = {
      id: (values.id as string) || null,
      title: values.title as string,
      slug: values.slug as string,
      description: (values.description as string) || null,
      category: values.category as string,
      difficulty: (values.difficulty as string) || null,
      location_type: values.location_type as string,
      country_code: (values.country_code as string) || null,
      city: (values.city as string) || null,
      image_url: (values.image_url as string) || null,
      image_alt: (values.image_alt as string) || null,
      why_it_matters: (values.why_it_matters as string) || null,
      what_to_know: parseWhatToKnow(values.what_to_know as string),
      best_time: (values.best_time as string) || null,
      duration_text: (values.duration_text as string) || null,
      location_note: (values.location_note as string) || null,
      featured: values.featured as boolean,
      is_public: values.is_public as boolean,
    };

    rows.push({ rowNumber, kind: "candidate", candidate });
  });

  return { ok: true, rows };
}

export interface ExperienceImportChange {
  field: (typeof CANDIDATE_FIELDS)[number];
  before: unknown;
  after: unknown;
}

export type ExperienceImportPreviewRow =
  | {
      status: "create";
      rowNumber: number;
      candidate: ExperienceImportCandidate;
    }
  | {
      status: "update";
      rowNumber: number;
      id: string;
      candidate: ExperienceImportCandidate;
      changes: ExperienceImportChange[];
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

export interface ExperienceImportPreview {
  rows: ExperienceImportPreviewRow[];
  summary: {
    total: number;
    create: number;
    update: number;
    unchanged: number;
    error: number;
  };
}

function toValidationInput(
  candidate: ExperienceImportCandidate,
): ExperienceInput {
  return {
    title: candidate.title,
    slug: candidate.slug,
    description: candidate.description ?? "",
    difficulty: candidate.difficulty ?? "",
    location_type: candidate.location_type,
    country_code: candidate.country_code ?? "",
    city: candidate.city ?? "",
    image_url: candidate.image_url ?? "",
    image_alt: candidate.image_alt ?? "",
    why_it_matters: candidate.why_it_matters ?? "",
    what_to_know: candidate.what_to_know ?? [],
    best_time: candidate.best_time ?? "",
    duration_text: candidate.duration_text ?? "",
    location_note: candidate.location_note ?? "",
    featured: candidate.featured,
    is_public: candidate.is_public,
  };
}

export function fingerprintExperience(existing: ExperienceExportItem): string {
  const canonical = CANDIDATE_FIELDS.map((field) =>
    JSON.stringify(existing[field] ?? null),
  ).join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

function diffCandidate(
  candidate: ExperienceImportCandidate,
  existing: ExperienceExportItem,
): ExperienceImportChange[] {
  const changes: ExperienceImportChange[] = [];

  for (const field of CANDIDATE_FIELDS) {
    const after = candidate[field];
    const before = existing[field] ?? null;
    if (JSON.stringify(before) !== JSON.stringify(after))
      changes.push({ field, before, after });
  }

  return changes;
}

export function buildExperienceImportPreview(
  rows: ParsedRow[],
  existing: ExperienceExportItem[],
): ExperienceImportPreview {
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const existingBySlug = new Map(existing.map((row) => [row.slug, row]));

  const idRowNumbers = new Map<string, number[]>();
  const slugRowNumbers = new Map<string, number[]>();

  for (const row of rows) {
    if (row.kind !== "candidate") continue;
    if (row.candidate.id) {
      const list = idRowNumbers.get(row.candidate.id) ?? [];
      list.push(row.rowNumber);
      idRowNumbers.set(row.candidate.id, list);
    }
    const slugList = slugRowNumbers.get(row.candidate.slug) ?? [];
    slugList.push(row.rowNumber);
    slugRowNumbers.set(row.candidate.slug, slugList);
  }

  const previewRows: ExperienceImportPreviewRow[] = rows.map((row) => {
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

    if (candidate.id && (idRowNumbers.get(candidate.id)?.length ?? 0) > 1) {
      errors.push("This id appears more than once in this file.");
    }

    if ((slugRowNumbers.get(candidate.slug)?.length ?? 0) > 1) {
      errors.push("This slug appears more than once in this file.");
    }

    const domainError = validateExperienceInput(toValidationInput(candidate));
    if (domainError) errors.push(domainError);

    if (!CATEGORIES.includes(candidate.category as (typeof CATEGORIES)[number])) {
      errors.push("Choose a valid category.");
    }

    let existingRow: ExperienceExportItem | undefined;
    if (candidate.id) {
      existingRow = existingById.get(candidate.id);
      if (!existingRow) errors.push("No experience exists with this id.");
    }

    const slugOwner = existingBySlug.get(candidate.slug);
    if (slugOwner && slugOwner.id !== candidate.id) {
      errors.push("This slug is already used by another experience.");
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

    const changes = diffCandidate(candidate, existingRow!);
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
      baseFingerprint: fingerprintExperience(existingRow!),
    };
  });

  const summary = {
    total: previewRows.length,
    create: previewRows.filter((row) => row.status === "create").length,
    update: previewRows.filter((row) => row.status === "update").length,
    unchanged: previewRows.filter((row) => row.status === "unchanged").length,
    error: previewRows.filter((row) => row.status === "error").length,
  };

  return { rows: previewRows, summary };
}
