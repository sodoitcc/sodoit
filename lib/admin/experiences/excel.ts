import "server-only";
import ExcelJS from "exceljs";
import type { Experience } from "@/lib/experiences/types";
import { EXPERIENCE_DIFFICULTIES } from "@/lib/experiences/difficulty.mjs";
import {
  EXCEL_COLORS,
  setStatusStyle,
  styleBooleanCell,
  styleHeaderRow,
  workbookToBlob as workbookToBlobShared,
} from "@/lib/admin/excelWorkbook";

export const EXPERIENCES_SHEET_NAME = "Experiences";
export const EXPERIENCE_TEMPLATE_FILENAME = "sodoit-experiences-template.xlsx";

const DIFFICULTY_DROPDOWN_ROWS = 500;

export interface ExperienceExcelRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  location_type: string;
  country_code: string;
  city: string;
  image_url: string;
  image_alt: string;
  why_it_matters: string;
  what_to_know: string;
  best_time: string;
  duration_text: string;
  location_note: string;
  featured: boolean;
  is_public: boolean;
}

interface ExperienceExcelColumn {
  key: keyof ExperienceExcelRow;
  header: string;
  width: number;
}

export const EXPERIENCE_EXCEL_COLUMNS: readonly ExperienceExcelColumn[] = [
  { key: "id", header: "id", width: 38 },
  { key: "title", header: "title", width: 42 },
  { key: "slug", header: "slug", width: 32 },
  { key: "description", header: "description", width: 60 },
  { key: "category", header: "category", width: 16 },
  { key: "difficulty", header: "difficulty", width: 14 },
  { key: "location_type", header: "location_type", width: 14 },
  { key: "country_code", header: "country_code", width: 14 },
  { key: "city", header: "city", width: 20 },
  { key: "image_url", header: "image_url", width: 44 },
  { key: "image_alt", header: "image_alt", width: 32 },
  { key: "why_it_matters", header: "why_it_matters", width: 50 },
  { key: "what_to_know", header: "what_to_know", width: 50 },
  { key: "best_time", header: "best_time", width: 20 },
  { key: "duration_text", header: "duration_text", width: 18 },
  { key: "location_note", header: "location_note", width: 32 },
  { key: "featured", header: "featured", width: 12 },
  { key: "is_public", header: "is_public", width: 12 },
];

export type ExperienceExportSource = Pick<
  Experience,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "category"
  | "difficulty"
  | "location_type"
  | "country_code"
  | "city"
  | "image_url"
  | "image_alt"
  | "why_it_matters"
  | "what_to_know"
  | "best_time"
  | "duration_text"
  | "location_note"
  | "featured"
  | "is_public"
>;

const COLORS = {
  ...EXCEL_COLORS,

  easyBackground: "FFDCFCE7",
  easyText: "FF166534",

  mediumBackground: "FFFEF3C7",
  mediumText: "FF92400E",

  hardBackground: "FFFFEDD5",
  hardText: "FF9A3412",

  extremeBackground: "FFFEE2E2",
  extremeText: "FF991B1B",

  globalBackground: "FFDBEAFE",
  globalText: "FF1D4ED8",

  countryBackground: "FFF3E8FF",
  countryText: "FF7E22CE",

  cityBackground: "FFCCFBF1",
  cityText: "FF0F766E",
} as const;

export function toExperienceExcelRow(
  experience: ExperienceExportSource,
): ExperienceExcelRow {
  return {
    id: experience.id,
    title: experience.title ?? "",
    slug: experience.slug ?? "",
    description: experience.description ?? "",
    category: experience.category ?? "",
    difficulty: experience.difficulty ?? "",
    location_type: experience.location_type ?? "",
    country_code: experience.country_code ?? "",
    city: experience.city ?? "",
    image_url: experience.image_url ?? "",
    image_alt: experience.image_alt ?? "",
    why_it_matters: experience.why_it_matters ?? "",
    what_to_know: (experience.what_to_know ?? []).join("\n"),
    best_time: experience.best_time ?? "",
    duration_text: experience.duration_text ?? "",
    location_note: experience.location_note ?? "",
    featured: Boolean(experience.featured),
    is_public: Boolean(experience.is_public),
  };
}

function styleDifficultyCell(cell: ExcelJS.Cell): void {
  const value = String(cell.value ?? "")
    .trim()
    .toLowerCase();

  switch (value) {
    case "easy":
      setStatusStyle(cell, COLORS.easyBackground, COLORS.easyText);
      break;

    case "medium":
      setStatusStyle(cell, COLORS.mediumBackground, COLORS.mediumText);
      break;

    case "hard":
      setStatusStyle(cell, COLORS.hardBackground, COLORS.hardText);
      break;

    case "extreme":
      setStatusStyle(cell, COLORS.extremeBackground, COLORS.extremeText);
      break;
  }
}

function styleLocationTypeCell(cell: ExcelJS.Cell): void {
  const value = String(cell.value ?? "")
    .trim()
    .toLowerCase();

  switch (value) {
    case "global":
      setStatusStyle(cell, COLORS.globalBackground, COLORS.globalText);
      break;

    case "country":
      setStatusStyle(cell, COLORS.countryBackground, COLORS.countryText);
      break;

    case "city":
      setStatusStyle(cell, COLORS.cityBackground, COLORS.cityText);
      break;
  }
}

function styleDataRow(row: ExcelJS.Row): void {
  const idCell = row.getCell("id");
  const titleCell = row.getCell("title");
  const descriptionCell = row.getCell("description");
  const difficultyCell = row.getCell("difficulty");
  const locationTypeCell = row.getCell("location_type");
  const featuredCell = row.getCell("featured");
  const publicCell = row.getCell("is_public");

  idCell.font = {
    color: { argb: COLORS.mutedText },
  };

  idCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.mutedBackground },
  };

  titleCell.font = {
    bold: true,
    color: { argb: COLORS.headerText },
  };

  descriptionCell.alignment = {
    vertical: "top",
    wrapText: true,
  };

  styleDifficultyCell(difficultyCell);
  styleLocationTypeCell(locationTypeCell);

  styleBooleanCell(
    featuredCell,
    COLORS.featuredBackground,
    COLORS.featuredText,
  );

  styleBooleanCell(publicCell, COLORS.publicBackground, COLORS.publicText);

  row.alignment = {
    vertical: "top",
  };
}

export function buildExperiencesWorkbook(
  rows: ExperienceExcelRow[],
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Sodoit Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(EXPERIENCES_SHEET_NAME, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = EXPERIENCE_EXCEL_COLUMNS.map((column) => ({
    key: column.key,
    header: column.header,
    width: column.width,
  }));

  styleHeaderRow(sheet);

  for (const experience of rows) {
    const row = sheet.addRow(experience);
    styleDataRow(row);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: EXPERIENCE_EXCEL_COLUMNS.length },
  };

  const difficultyLetter = sheet.getColumn("difficulty").letter;
  const lastRow = Math.max(rows.length + 1, DIFFICULTY_DROPDOWN_ROWS);

  (
    sheet as ExcelJS.Worksheet & {
      dataValidations: { add(address: string, validation: unknown): void };
    }
  ).dataValidations.add(`${difficultyLetter}2:${difficultyLetter}${lastRow}`, {
    type: "list",
    allowBlank: true,
    formulae: [`"${EXPERIENCE_DIFFICULTIES.join(",")}"`],
  });

  return workbook;
}

export const workbookToBlob = workbookToBlobShared;

export function experienceExportFilename(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `sodoit-experiences-${iso}.xlsx`;
}
