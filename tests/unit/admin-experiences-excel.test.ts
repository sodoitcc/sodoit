import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  buildExperiencesWorkbook,
  EXPERIENCE_EXCEL_COLUMNS,
  EXPERIENCES_SHEET_NAME,
  experienceExportFilename,
  toExperienceExcelRow,
  workbookToBlob,
} from "@/lib/admin/experiences/excel";
import type { ExperienceExportSource } from "@/lib/admin/experiences/excel";

const CANONICAL_HEADERS = [
  "id",
  "title",
  "slug",
  "description",
  "category",
  "difficulty",
  "location_type",
  "country_code",
  "city",
  "image_url",
  "image_alt",
  "why_it_matters",
  "what_to_know",
  "best_time",
  "duration_text",
  "location_note",
  "featured",
  "is_public",
];

async function readBack(workbook: ExcelJS.Workbook) {
  const blob = await workbookToBlob(workbook);
  const arrayBuffer = await blob.arrayBuffer();
  const roundTrip = new ExcelJS.Workbook();
  await roundTrip.xlsx.load(arrayBuffer);
  return roundTrip;
}

describe("EXPERIENCE_EXCEL_COLUMNS", () => {
  it("matches the canonical export schema and order", () => {
    expect(EXPERIENCE_EXCEL_COLUMNS.map((c) => c.header)).toEqual(
      CANONICAL_HEADERS,
    );
  });
});

describe("toExperienceExcelRow", () => {
  it("coerces null/optional fields to safe values", () => {
    const source = {
      id: "exp-1",
      title: "Watch a sunrise",
      slug: "watch-a-sunrise",
      description: null,
      category: null,
      difficulty: null,
      location_type: "global",
      country_code: null,
      city: null,
      image_url: null,
      image_alt: null,
      featured: null,
      is_public: null,
    } as unknown as ExperienceExportSource;

    const row = toExperienceExcelRow(source);

    expect(row).toEqual({
      id: "exp-1",
      title: "Watch a sunrise",
      slug: "watch-a-sunrise",
      description: "",
      category: "",
      difficulty: "",
      location_type: "global",
      country_code: "",
      city: "",
      image_url: "",
      image_alt: "",
      why_it_matters: "",
      what_to_know: "",
      best_time: "",
      duration_text: "",
      location_note: "",
      featured: false,
      is_public: false,
    });
  });

  it("preserves true boolean fields deterministically", () => {
    const row = toExperienceExcelRow({
      id: "exp-2",
      title: "Cook a meal with friends",
      slug: "cook-a-meal-with-friends",
      description: "desc",
      category: "Social",
      difficulty: "Easy",
      location_type: "global",
      country_code: null,
      city: null,
      image_url: null,
      image_alt: null,
      why_it_matters: null,
      what_to_know: null,
      best_time: null,
      duration_text: null,
      location_note: null,
      featured: true,
      is_public: true,
    });

    expect(row.featured).toBe(true);
    expect(row.is_public).toBe(true);
  });
});

describe("buildExperiencesWorkbook", () => {
  it("produces a workbook with the Experiences worksheet and canonical headers", async () => {
    const workbook = buildExperiencesWorkbook([]);
    const roundTrip = await readBack(workbook);

    const sheet = roundTrip.getWorksheet(EXPERIENCES_SHEET_NAME);
    expect(sheet).toBeDefined();

    const headerValues = sheet!.getRow(1).values as unknown as (
      string | undefined
    )[];
    expect(headerValues.slice(1)).toEqual(CANONICAL_HEADERS);
  });

  it("freezes the header row and enables autofilter", () => {
    const workbook = buildExperiencesWorkbook([]);
    const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME)!;

    expect(sheet.views?.[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(sheet.autoFilter).toBeTruthy();
  });

  it("serializes data rows in the exact column order", async () => {
    const row = toExperienceExcelRow({
      id: "exp-3",
      title: "Organize a potluck",
      slug: "organize-a-potluck",
      description: "Gather friends",
      category: "Social",
      difficulty: "Easy",
      location_type: "global",
      country_code: null,
      city: null,
      image_url: "https://example.com/image.jpg",
      image_alt: "A potluck table",
      why_it_matters: null,
      what_to_know: null,
      best_time: null,
      duration_text: null,
      location_note: null,
      featured: false,
      is_public: true,
    });

    const workbook = buildExperiencesWorkbook([row]);
    const roundTrip = await readBack(workbook);
    const sheet = roundTrip.getWorksheet(EXPERIENCES_SHEET_NAME)!;

    const dataValues = sheet.getRow(2).values as unknown as unknown[];
    expect(dataValues.slice(1)).toEqual([
      "exp-3",
      "Organize a potluck",
      "organize-a-potluck",
      "Gather friends",
      "Social",
      "Easy",
      "global",
      "",
      "",
      "https://example.com/image.jpg",
      "A potluck table",
      "",
      "",
      "",
      "",
      "",
      false,
      true,
    ]);
  });

  it("produces a blank template with headers but no records", async () => {
    const workbook = buildExperiencesWorkbook([]);
    const roundTrip = await readBack(workbook);
    const sheet = roundTrip.getWorksheet(EXPERIENCES_SHEET_NAME)!;

    expect(sheet.rowCount).toBe(1);
  });

  it("gives the difficulty column a dropdown listing all four values, without padding the sheet with empty rows", () => {
    const workbook = buildExperiencesWorkbook([]);
    const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME)! as unknown as {
      dataValidations: {
        model: Record<string, { type: string; formulae: string[] }>;
      };
      rowCount: number;
      getColumn(key: string): { letter: string };
    };

    const letter = sheet.getColumn("difficulty").letter;
    const entry = Object.entries(sheet.dataValidations.model).find(([range]) =>
      range.startsWith(`${letter}2:${letter}`),
    );

    expect(entry).toBeDefined();
    expect(entry?.[1].type).toBe("list");
    expect(entry?.[1].formulae[0]).toBe('"Easy,Medium,Hard,Extreme"');
    expect(sheet.rowCount).toBe(1);
  });

  it("styles an Extreme difficulty cell distinctly from Hard", () => {
    const hardRow = toExperienceExcelRow({
      id: "exp-hard",
      title: "Complete a full marathon",
      slug: "complete-a-full-marathon",
      description: "Run 42km",
      category: "Fitness",
      difficulty: "Hard",
      location_type: "global",
      country_code: null,
      city: null,
      image_url: null,
      image_alt: null,
      why_it_matters: null,
      what_to_know: null,
      best_time: null,
      duration_text: null,
      location_note: null,
      featured: false,
      is_public: true,
    });
    const extremeRow = toExperienceExcelRow({
      id: "exp-extreme",
      title: "Climb Mount Everest",
      slug: "climb-everest",
      description: "Summit the tallest mountain on Earth",
      category: "Adventure",
      difficulty: "Extreme",
      location_type: "global",
      country_code: null,
      city: null,
      image_url: null,
      image_alt: null,
      why_it_matters: null,
      what_to_know: null,
      best_time: null,
      duration_text: null,
      location_note: null,
      featured: false,
      is_public: true,
    });

    const workbook = buildExperiencesWorkbook([hardRow, extremeRow]);
    const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME)!;
    const difficultyColumn = sheet.getColumn("difficulty").number;

    const hardFill = sheet.getCell(2, difficultyColumn).fill;
    const extremeFill = sheet.getCell(3, difficultyColumn).fill;

    expect(extremeFill).not.toEqual(hardFill);
    expect(
      extremeFill && "fgColor" in extremeFill
        ? extremeFill.fgColor?.argb
        : undefined,
    ).toBe("FFFEE2E2");
  });
});

describe("experienceExportFilename", () => {
  it("is deterministic and dated", () => {
    const date = new Date("2026-08-17T12:00:00Z");
    expect(experienceExportFilename(date)).toBe(
      "sodoit-experiences-2026-08-17.xlsx",
    );
  });
});
