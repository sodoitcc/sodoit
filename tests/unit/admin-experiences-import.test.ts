import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  buildExperiencesWorkbook,
  EXPERIENCE_EXCEL_COLUMNS,
  EXPERIENCES_SHEET_NAME,
  workbookToBlob,
  type ExperienceExcelRow,
} from "@/lib/admin/experiences/excel";
import {
  buildExperienceImportPreview,
  hasXlsxSignature,
  parseExperiencesWorkbook,
} from "@/lib/admin/experiences/import";
import type { ExperienceExportItem } from "@/lib/admin/experiences/queries";

function row(overrides: Partial<ExperienceExcelRow> = {}): ExperienceExcelRow {
  return {
    id: "",
    title: "Watch a sunrise",
    slug: "watch-a-sunrise",
    description: "Wake up early",
    category: "Nature",
    difficulty: "Easy",
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
    is_public: true,
    ...overrides,
  };
}

async function bufferFromRows(
  rows: ExperienceExcelRow[],
): Promise<ArrayBuffer> {
  const workbook = buildExperiencesWorkbook(rows);
  const blob = await workbookToBlob(workbook);
  return blob.arrayBuffer();
}

async function bufferFromWorkbook(
  workbook: ExcelJS.Workbook,
): Promise<ArrayBuffer> {
  const blob = await workbookToBlob(workbook);
  return blob.arrayBuffer();
}

function existingItem(
  overrides: Partial<ExperienceExportItem> = {},
): ExperienceExportItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Watch a sunrise",
    slug: "watch-a-sunrise",
    description: "Wake up early",
    category: "Nature",
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
    featured: false,
    is_public: true,
    ...overrides,
  };
}

describe("parseExperiencesWorkbook — contract", () => {
  it("parses a valid exported workbook successfully", async () => {
    const buffer = await bufferFromRows([row()]);
    const result = await parseExperiencesWorkbook(buffer);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });

  it("ignores fully blank rows", async () => {
    const workbook = buildExperiencesWorkbook([row()]);
    const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME)!;
    sheet.addRow({});

    const buffer = await bufferFromWorkbook(workbook);
    const result = await parseExperiencesWorkbook(buffer);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });

  it("rejects a workbook missing the Experiences sheet", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Sheet1");

    const buffer = await bufferFromWorkbook(workbook);
    const result = await parseExperiencesWorkbook(buffer);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Experiences/);
  });

  it("rejects a workbook with the wrong headers", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(EXPERIENCES_SHEET_NAME);
    sheet.addRow(["id", "name", "url"]);

    const buffer = await bufferFromWorkbook(workbook);
    const result = await parseExperiencesWorkbook(buffer);

    expect(result.ok).toBe(false);
  });

  it("parses TRUE/FALSE strings and native booleans deterministically", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(EXPERIENCES_SHEET_NAME);
    sheet.addRow(EXPERIENCE_EXCEL_COLUMNS.map((c) => c.header));
    sheet.addRow([
      "",
      "Row A",
      "row-a",
      "",
      "Nature",
      "",
      "global",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "TRUE",
      "false",
    ]);
    sheet.addRow([
      "",
      "Row B",
      "row-b",
      "",
      "Nature",
      "",
      "global",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      true,
      false,
    ]);

    const buffer = await bufferFromWorkbook(workbook);
    const result = await parseExperiencesWorkbook(buffer);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    for (const parsed of result.rows) {
      expect(parsed.kind).toBe("candidate");
      if (parsed.kind === "candidate") {
        expect(parsed.candidate.featured).toBe(true);
        expect(parsed.candidate.is_public).toBe(false);
      }
    }
  });

  it("rejects an ambiguous boolean string instead of guessing", async () => {
    const buffer = await bufferFromRows([
      row({ id: "", slug: "row-bad-bool" }),
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME)!;
    sheet.getRow(2).getCell(17).value = "yes";

    const rebuilt = await bufferFromWorkbook(workbook);
    const result = await parseExperiencesWorkbook(rebuilt);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [parsed] = result.rows;
    expect(parsed.kind).toBe("error");
    if (parsed.kind === "error") {
      expect(
        parsed.errors.some((message) => message.includes("featured")),
      ).toBe(true);
    }
  });

  it("rejects a row with a formula cell", async () => {
    const buffer = await bufferFromRows([row({ slug: "row-formula" })]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet(EXPERIENCES_SHEET_NAME)!;
    sheet.getRow(2).getCell(2).value = { formula: "A1", result: "Watch" };

    const rebuilt = await bufferFromWorkbook(workbook);
    const result = await parseExperiencesWorkbook(rebuilt);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [parsed] = result.rows;
    expect(parsed.kind).toBe("error");
    if (parsed.kind === "error") {
      expect(parsed.errors.some((message) => message.includes("formula"))).toBe(
        true,
      );
    }
  });
});

describe("hasXlsxSignature", () => {
  it("accepts real xlsx bytes", async () => {
    const buffer = await bufferFromRows([row()]);
    expect(hasXlsxSignature(buffer)).toBe(true);
  });

  it("rejects arbitrary bytes", () => {
    expect(
      hasXlsxSignature(new TextEncoder().encode("not an xlsx").buffer),
    ).toBe(false);
  });
});

describe("buildExperienceImportPreview — classification", () => {
  async function parseRows(rows: ExperienceExcelRow[]) {
    const buffer = await bufferFromRows(rows);
    const result = await parseExperiencesWorkbook(buffer);
    if (!result.ok) throw new Error(result.error);
    return result.rows;
  }

  it("classifies a blank-id valid row as create", async () => {
    const rows = await parseRows([row({ id: "", slug: "new-thing" })]);
    const preview = buildExperienceImportPreview(rows, []);

    expect(preview.summary.create).toBe(1);
    expect(preview.rows[0].status).toBe("create");
  });

  it("classifies an existing id with changed values as update", async () => {
    const existing = existingItem();
    const rows = await parseRows([
      row({ id: existing.id, difficulty: "Hard", featured: true }),
    ]);

    const preview = buildExperienceImportPreview(rows, [existing]);

    expect(preview.summary.update).toBe(1);
    const [result] = preview.rows;
    expect(result.status).toBe("update");
    if (result.status === "update") {
      const fields = result.changes.map((c) => c.field);
      expect(fields).toContain("difficulty");
      expect(fields).toContain("featured");
      expect(fields).not.toContain("slug");
    }
  });

  it("classifies an existing id with equivalent normalized values as unchanged", async () => {
    const existing = existingItem({ description: null, country_code: null });
    const rows = await parseRows([
      row({ id: existing.id, description: "", country_code: "" }),
    ]);

    const preview = buildExperienceImportPreview(rows, [existing]);

    expect(preview.summary.unchanged).toBe(1);
    expect(preview.rows[0].status).toBe("unchanged");
  });

  it("errors on an unknown non-empty id", async () => {
    const rows = await parseRows([
      row({ id: "99999999-9999-4999-8999-999999999999" }),
    ]);

    const preview = buildExperienceImportPreview(rows, []);

    expect(preview.summary.error).toBe(1);
    const [result] = preview.rows;
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.errors.some((m) => m.includes("No experience"))).toBe(true);
    }
  });

  it("errors on duplicate ids inside the workbook", async () => {
    const existing = existingItem();
    const rows = await parseRows([
      row({ id: existing.id, slug: "watch-a-sunrise" }),
      row({ id: existing.id, slug: "watch-a-sunrise-2", title: "Second row" }),
    ]);

    const preview = buildExperienceImportPreview(rows, [existing]);

    expect(preview.summary.error).toBe(2);
    for (const result of preview.rows) {
      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(
          result.errors.some((m) => m.includes("id appears more than once")),
        ).toBe(true);
      }
    }
  });

  it("errors when two rows in the same file share a slug", async () => {
    const rows = await parseRows([
      row({ id: "", slug: "shared-slug", title: "First" }),
      row({ id: "", slug: "shared-slug", title: "Second" }),
    ]);

    const preview = buildExperienceImportPreview(rows, []);

    expect(preview.summary.error).toBe(2);
  });

  it("errors when a create row's slug collides with an existing experience", async () => {
    const existing = existingItem();
    const rows = await parseRows([
      row({ id: "", slug: existing.slug, title: "Different title" }),
    ]);

    const preview = buildExperienceImportPreview(rows, [existing]);

    expect(preview.summary.error).toBe(1);
    const [result] = preview.rows;
    if (result.status === "error") {
      expect(
        result.errors.some((m) => m.includes("already used by another")),
      ).toBe(true);
    }
  });

  it("errors when an update row's new slug collides with another experience", async () => {
    const target = existingItem();
    const other = existingItem({
      id: "22222222-2222-4222-8222-222222222222",
      slug: "other-slug",
    });
    const rows = await parseRows([row({ id: target.id, slug: "other-slug" })]);

    const preview = buildExperienceImportPreview(rows, [target, other]);

    expect(preview.summary.error).toBe(1);
  });

  it("errors on an invalid category/difficulty/location_type", async () => {
    const rows = await parseRows([
      row({ id: "", slug: "bad-category", category: "Not a category" }),
    ]);

    const preview = buildExperienceImportPreview(rows, []);

    expect(preview.summary.error).toBe(1);
  });

  it("accepts the new Extreme difficulty", async () => {
    const rows = await parseRows([
      row({ id: "", slug: "extreme-row", difficulty: "Extreme" }),
    ]);

    const preview = buildExperienceImportPreview(rows, []);

    expect(preview.summary.error).toBe(0);
    expect(preview.summary.create).toBe(1);
  });

  it("rejects an unknown difficulty value", async () => {
    const rows = await parseRows([
      row({ id: "", slug: "bad-difficulty", difficulty: "Super Hard" }),
    ]);

    const preview = buildExperienceImportPreview(rows, []);

    expect(preview.summary.error).toBe(1);
  });

  it.each(["Easy", "Medium", "Hard"] as const)(
    "keeps importing the pre-Extreme difficulty %s",
    async (difficulty) => {
      const rows = await parseRows([
        row({ id: "", slug: `legacy-${difficulty.toLowerCase()}`, difficulty }),
      ]);

      const preview = buildExperienceImportPreview(rows, []);

      expect(preview.summary.error).toBe(0);
      expect(preview.summary.create).toBe(1);
    },
  );

  it("does not treat blank Excel text and DB null as a change", async () => {
    const existing = existingItem({
      description: null,
      image_url: null,
      image_alt: null,
      country_code: null,
      city: null,
    });
    const rows = await parseRows([
      row({
        id: existing.id,
        description: "",
        image_url: "",
        image_alt: "",
        country_code: "",
        city: "",
      }),
    ]);

    const preview = buildExperienceImportPreview(rows, [existing]);

    expect(preview.rows[0].status).toBe("unchanged");
  });
});
