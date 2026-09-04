import "server-only";
import ExcelJS from "exceljs";
import type { Guide, GuideComparisonPair, GuideItem } from "@/lib/guides/types";
import { GUIDE_ROUTE_MODES } from "@/lib/guides/types";
import { GUIDE_TYPES } from "./validation";
import {
  EXCEL_COLORS,
  setStatusStyle,
  styleBooleanCell,
  styleHeaderRow,
  workbookToBlob as workbookToBlobShared,
} from "@/lib/admin/excelWorkbook";

export const GUIDES_SHEET_NAME = "Guides";
export const SPOTS_SHEET_NAME = "Spots";
export const COMPARISONS_SHEET_NAME = "Comparisons";
export const README_SHEET_NAME = "README";
export const GUIDE_TEMPLATE_FILENAME = "sodoit-guides-template.xlsx";

export interface GuideExcelRow {
  id: string;
  slug: string;
  title: string;
  type: string;
  city: string;
  country_code: string;
  city_slug: string;
  description: string;
  duration_label: string;
  best_time: string;
  local_tip: string;
  route_mode: string;
  cover_image_url: string;
  cover_image_alt: string;
  editorial_attribution: string;
  featured: boolean;
  is_public: boolean;
  sort_order: number;
}

export interface GuideSpotExcelRow {
  id: string;
  guide_slug: string;
  position: number;
  title: string;
  neighborhood: string;
  address: string;
  description: string;
  google_maps_url: string;
  external_url: string;
  tags: string;
  place_name: string;
  image_url: string;
  image_alt: string;
  latitude: string;
  longitude: string;
}

export interface GuideComparisonExcelRow {
  id: string;
  guide_slug: string;
  position: number;
  skip_title: string;
  skip_description: string;
  skip_neighborhood: string;
  skip_address: string;
  skip_google_maps_url: string;
  skip_external_url: string;
  skip_tags: string;
  go_instead_title: string;
  go_instead_description: string;
  go_instead_neighborhood: string;
  go_instead_address: string;
  go_instead_google_maps_url: string;
  go_instead_external_url: string;
  go_instead_tags: string;
  reason: string;
  skip_latitude: string;
  skip_longitude: string;
  go_instead_latitude: string;
  go_instead_longitude: string;
}

interface ExcelColumn<Row> {
  key: keyof Row;
  header: string;
  width: number;
}

export const GUIDE_EXCEL_COLUMNS: readonly ExcelColumn<GuideExcelRow>[] = [
  { key: "id", header: "id", width: 38 },
  { key: "slug", header: "slug", width: 32 },
  { key: "title", header: "title", width: 42 },
  { key: "type", header: "type", width: 16 },
  { key: "city", header: "city", width: 20 },
  { key: "country_code", header: "country_code", width: 14 },
  { key: "city_slug", header: "city_slug", width: 20 },
  { key: "description", header: "description", width: 60 },
  { key: "duration_label", header: "duration_label", width: 18 },
  { key: "best_time", header: "best_time", width: 16 },
  { key: "local_tip", header: "local_tip", width: 40 },
  { key: "route_mode", header: "route_mode", width: 14 },
  { key: "cover_image_url", header: "cover_image_url", width: 44 },
  { key: "cover_image_alt", header: "cover_image_alt", width: 32 },
  {
    key: "editorial_attribution",
    header: "editorial_attribution",
    width: 28,
  },
  { key: "featured", header: "featured", width: 12 },
  { key: "is_public", header: "is_public", width: 12 },
  { key: "sort_order", header: "sort_order", width: 12 },
];

export const GUIDE_SPOT_EXCEL_COLUMNS: readonly ExcelColumn<GuideSpotExcelRow>[] =
  [
    { key: "id", header: "id", width: 38 },
    { key: "guide_slug", header: "guide_slug", width: 32 },
    { key: "position", header: "position", width: 10 },
    { key: "title", header: "title", width: 40 },
    { key: "neighborhood", header: "neighborhood", width: 22 },
    { key: "address", header: "address", width: 32 },
    { key: "description", header: "description", width: 50 },
    { key: "google_maps_url", header: "google_maps_url", width: 44 },
    { key: "external_url", header: "external_url", width: 32 },
    { key: "tags", header: "tags", width: 28 },
    { key: "place_name", header: "place_name", width: 24 },
    { key: "image_url", header: "image_url", width: 40 },
    { key: "image_alt", header: "image_alt", width: 28 },
    { key: "latitude", header: "latitude", width: 12 },
    { key: "longitude", header: "longitude", width: 12 },
  ];

export const GUIDE_COMPARISON_EXCEL_COLUMNS: readonly ExcelColumn<GuideComparisonExcelRow>[] =
  [
    { key: "id", header: "id", width: 38 },
    { key: "guide_slug", header: "guide_slug", width: 32 },
    { key: "position", header: "position", width: 10 },
    { key: "skip_title", header: "skip_title", width: 32 },
    { key: "skip_description", header: "skip_description", width: 44 },
    { key: "skip_neighborhood", header: "skip_neighborhood", width: 20 },
    { key: "skip_address", header: "skip_address", width: 28 },
    { key: "skip_google_maps_url", header: "skip_google_maps_url", width: 40 },
    { key: "skip_external_url", header: "skip_external_url", width: 28 },
    { key: "skip_tags", header: "skip_tags", width: 24 },
    { key: "go_instead_title", header: "go_instead_title", width: 32 },
    {
      key: "go_instead_description",
      header: "go_instead_description",
      width: 44,
    },
    {
      key: "go_instead_neighborhood",
      header: "go_instead_neighborhood",
      width: 20,
    },
    { key: "go_instead_address", header: "go_instead_address", width: 28 },
    {
      key: "go_instead_google_maps_url",
      header: "go_instead_google_maps_url",
      width: 40,
    },
    {
      key: "go_instead_external_url",
      header: "go_instead_external_url",
      width: 28,
    },
    { key: "go_instead_tags", header: "go_instead_tags", width: 24 },
    { key: "reason", header: "reason", width: 44 },
    { key: "skip_latitude", header: "skip_latitude", width: 12 },
    { key: "skip_longitude", header: "skip_longitude", width: 12 },
    { key: "go_instead_latitude", header: "go_instead_latitude", width: 12 },
    { key: "go_instead_longitude", header: "go_instead_longitude", width: 12 },
  ];

export type GuideExportSource = Pick<
  Guide,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "type"
  | "city"
  | "country_code"
  | "city_slug"
  | "cover_image_url"
  | "cover_image_alt"
  | "duration_label"
  | "best_time"
  | "local_tip"
  | "route_mode"
  | "featured"
  | "is_public"
  | "sort_order"
  | "editorial_attribution"
>;

export type GuideSpotExportSource = Pick<
  GuideItem,
  | "id"
  | "guide_id"
  | "position"
  | "title"
  | "description"
  | "place_name"
  | "image_url"
  | "image_alt"
  | "external_url"
  | "neighborhood"
  | "address"
  | "latitude"
  | "longitude"
  | "google_maps_url"
  | "tags"
>;

export type GuideComparisonExportSource = Pick<
  GuideComparisonPair,
  | "id"
  | "guide_id"
  | "position"
  | "skip_title"
  | "skip_description"
  | "skip_neighborhood"
  | "skip_address"
  | "skip_latitude"
  | "skip_longitude"
  | "skip_google_maps_url"
  | "skip_external_url"
  | "skip_tags"
  | "go_instead_title"
  | "go_instead_description"
  | "go_instead_neighborhood"
  | "go_instead_address"
  | "go_instead_latitude"
  | "go_instead_longitude"
  | "go_instead_google_maps_url"
  | "go_instead_external_url"
  | "go_instead_tags"
  | "reason"
>;

function joinTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(", ");
}

function numberCell(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function toGuideExcelRow(guide: GuideExportSource): GuideExcelRow {
  return {
    id: guide.id,
    slug: guide.slug ?? "",
    title: guide.title ?? "",
    type: guide.type ?? "",
    city: guide.city ?? "",
    country_code: guide.country_code ?? "",
    city_slug: guide.city_slug ?? "",
    description: guide.description ?? "",
    duration_label: guide.duration_label ?? "",
    best_time: guide.best_time ?? "",
    local_tip: guide.local_tip ?? "",
    route_mode: guide.route_mode ?? "",
    cover_image_url: guide.cover_image_url ?? "",
    cover_image_alt: guide.cover_image_alt ?? "",
    editorial_attribution: guide.editorial_attribution ?? "",
    featured: Boolean(guide.featured),
    is_public: Boolean(guide.is_public),
    sort_order: guide.sort_order ?? 0,
  };
}

export function toGuideSpotExcelRow(
  item: GuideSpotExportSource,
  guideSlugById: ReadonlyMap<string, string>,
): GuideSpotExcelRow {
  return {
    id: item.id,
    guide_slug: guideSlugById.get(item.guide_id) ?? "",
    position: item.position ?? 0,
    title: item.title ?? "",
    neighborhood: item.neighborhood ?? "",
    address: item.address ?? "",
    description: item.description ?? "",
    google_maps_url: item.google_maps_url ?? "",
    external_url: item.external_url ?? "",
    tags: joinTags(item.tags),
    place_name: item.place_name ?? "",
    image_url: item.image_url ?? "",
    image_alt: item.image_alt ?? "",
    latitude: numberCell(item.latitude),
    longitude: numberCell(item.longitude),
  };
}

export function toGuideComparisonExcelRow(
  pair: GuideComparisonExportSource,
  guideSlugById: ReadonlyMap<string, string>,
): GuideComparisonExcelRow {
  return {
    id: pair.id,
    guide_slug: guideSlugById.get(pair.guide_id) ?? "",
    position: pair.position ?? 0,
    skip_title: pair.skip_title ?? "",
    skip_description: pair.skip_description ?? "",
    skip_neighborhood: pair.skip_neighborhood ?? "",
    skip_address: pair.skip_address ?? "",
    skip_google_maps_url: pair.skip_google_maps_url ?? "",
    skip_external_url: pair.skip_external_url ?? "",
    skip_tags: joinTags(pair.skip_tags),
    go_instead_title: pair.go_instead_title ?? "",
    go_instead_description: pair.go_instead_description ?? "",
    go_instead_neighborhood: pair.go_instead_neighborhood ?? "",
    go_instead_address: pair.go_instead_address ?? "",
    go_instead_google_maps_url: pair.go_instead_google_maps_url ?? "",
    go_instead_external_url: pair.go_instead_external_url ?? "",
    go_instead_tags: joinTags(pair.go_instead_tags),
    reason: pair.reason ?? "",
    skip_latitude: numberCell(pair.skip_latitude),
    skip_longitude: numberCell(pair.skip_longitude),
    go_instead_latitude: numberCell(pair.go_instead_latitude),
    go_instead_longitude: numberCell(pair.go_instead_longitude),
  };
}

const GUIDE_COLORS = {
  ...EXCEL_COLORS,
  itineraryBackground: "FFDBEAFE",
  itineraryText: "FF1D4ED8",
  collectionBackground: "FFF3E8FF",
  collectionText: "FF7E22CE",
  comparisonBackground: "FFFEF3C7",
  comparisonText: "FF92400E",
} as const;

const COLLECTION_TYPES = new Set([
  "hidden_gems",
  "food_drink",
  "local_favorites",
]);

function styleTypeCell(cell: ExcelJS.Cell): void {
  const value = String(cell.value ?? "")
    .trim()
    .toLowerCase();

  if (value === "itinerary") {
    setStatusStyle(
      cell,
      GUIDE_COLORS.itineraryBackground,
      GUIDE_COLORS.itineraryText,
    );
    return;
  }

  if (value === "worth_it_or_skip_it") {
    setStatusStyle(
      cell,
      GUIDE_COLORS.comparisonBackground,
      GUIDE_COLORS.comparisonText,
    );
    return;
  }

  if (COLLECTION_TYPES.has(value)) {
    setStatusStyle(
      cell,
      GUIDE_COLORS.collectionBackground,
      GUIDE_COLORS.collectionText,
    );
  }
}

function mutedCell(cell: ExcelJS.Cell): void {
  cell.font = { color: { argb: GUIDE_COLORS.mutedText } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: GUIDE_COLORS.mutedBackground },
  };
}

function styleGuideDataRow(row: ExcelJS.Row): void {
  mutedCell(row.getCell("id"));

  row.getCell("title").font = {
    bold: true,
    color: { argb: GUIDE_COLORS.headerText },
  };
  row.getCell("description").alignment = { vertical: "top", wrapText: true };
  row.getCell("local_tip").alignment = { vertical: "top", wrapText: true };

  styleTypeCell(row.getCell("type"));
  styleBooleanCell(
    row.getCell("featured"),
    GUIDE_COLORS.featuredBackground,
    GUIDE_COLORS.featuredText,
  );
  styleBooleanCell(
    row.getCell("is_public"),
    GUIDE_COLORS.publicBackground,
    GUIDE_COLORS.publicText,
  );

  row.alignment = { vertical: "top" };
}

function styleSpotDataRow(row: ExcelJS.Row): void {
  mutedCell(row.getCell("id"));
  mutedCell(row.getCell("guide_slug"));

  row.getCell("position").alignment = { horizontal: "center", vertical: "top" };
  row.getCell("title").font = {
    bold: true,
    color: { argb: GUIDE_COLORS.headerText },
  };
  row.getCell("description").alignment = { vertical: "top", wrapText: true };

  row.alignment = { vertical: "top" };
}

function styleComparisonDataRow(row: ExcelJS.Row): void {
  mutedCell(row.getCell("id"));
  mutedCell(row.getCell("guide_slug"));

  row.getCell("position").alignment = { horizontal: "center", vertical: "top" };
  row.getCell("skip_title").font = {
    bold: true,
    color: { argb: GUIDE_COLORS.headerText },
  };
  row.getCell("go_instead_title").font = {
    bold: true,
    color: { argb: GUIDE_COLORS.headerText },
  };
  row.getCell("skip_description").alignment = {
    vertical: "top",
    wrapText: true,
  };
  row.getCell("go_instead_description").alignment = {
    vertical: "top",
    wrapText: true,
  };
  row.getCell("reason").alignment = { vertical: "top", wrapText: true };

  row.alignment = { vertical: "top" };
}

function addListValidation<Row>(
  sheet: ExcelJS.Worksheet,
  columns: readonly ExcelColumn<Row>[],
  key: keyof Row,
  options: readonly string[],
  rowCount: number,
) {
  const columnIndex = columns.findIndex((column) => column.key === key) + 1;
  if (columnIndex === 0) return;
  const lastRow = rowCount + 1;

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber += 1) {
    sheet.getCell(rowNumber, columnIndex).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${options.join(",")}"`],
    };
  }
}

function buildSheet<Row extends object>(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: readonly ExcelColumn<Row>[],
  rows: Row[],
  styleRow: (row: ExcelJS.Row) => void,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columns.map((column) => ({
    key: column.key as string,
    header: column.header,
    width: column.width,
  }));

  styleHeaderRow(sheet);

  for (const row of rows) {
    const excelRow = sheet.addRow(row);
    styleRow(excelRow);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  return sheet;
}

const README_LINES: readonly string[] = [
  "Sodoit Guides workbook",
  "",
  "One row = one entity. Guides, Spots and Comparisons are separate sheets linked by guide_slug.",
  "",
  "Stable identifiers",
  "- id: leave blank to CREATE a new row. Set to an existing id to UPDATE that row.",
  "- Never reorder, retype, or delete an id value on a row you intend to keep — that is what identifies it.",
  "- guide_slug (Spots, Comparisons sheets): must match a slug on the Guides sheet, either an existing guide or a new guide row in this same file.",
  "",
  "Supported guide types",
  "- itinerary",
  "- hidden_gems",
  "- food_drink",
  "- local_favorites",
  "- worth_it_or_skip_it",
  "",
  "Supported route_mode values (itinerary only, optional)",
  "- walking",
  "- driving",
  "- bicycling",
  "- transit",
  "",
  "Tags format",
  '- Comma separated plain text in one cell, e.g. "coffee, breakfast".',
  "",
  "Blank / null behavior",
  '- A blank cell means "no value" (null). It does not delete an existing value unless you are updating that row and intentionally clear the cell.',
  "- Do not guess or invent a value to fill a blank cell.",
  "",
  "URL requirements",
  "- google_maps_url, external_url, cover_image_url, image_url must be http:// or https:// URLs, or left blank.",
  "",
  "Coordinates",
  "- latitude must be between -90 and 90.",
  "- longitude must be between -180 and 180.",
  "- Leave both blank if unknown. Never invent coordinates, addresses, or URLs — leave the cell blank instead.",
  "",
  "Creating vs updating rows",
  "- To create: leave id blank, fill in the required fields.",
  "- To update: keep the existing id, edit only the fields that changed.",
  "- To leave a row unchanged: do not edit it at all.",
  "",
  "Deletion",
  "- This workbook format does not support deleting rows by removing them from the sheet. Removing a row from the file does not delete it from Sodoit.",
  "",
  "Import flow",
  "- Upload this workbook in the Sodoit admin Guides import screen.",
  "- Review the generated preview (created / updated / unchanged / errors) before applying.",
  "- Nothing is written to the database until you explicitly apply the import.",
  "",
  "Editing with an LLM",
  '- You can send this workbook to an LLM with the instruction: "Edit this workbook while preserving its schema."',
  "- Keep column headers, sheet names, and this README sheet unchanged.",
  "- The LLM should leave a cell blank rather than invent a URL, address, or coordinate it is not certain about.",
];

function buildReadmeSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(README_SHEET_NAME);
  sheet.columns = [{ key: "line", header: "", width: 100 }];

  for (const line of README_LINES) {
    const row = sheet.addRow({ line });
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
    if (line && !line.startsWith("-")) {
      row.getCell(1).font = { bold: true };
    }
  }
}

export function buildGuidesWorkbook(
  guideRows: GuideExcelRow[],
  spotRows: GuideSpotExcelRow[],
  comparisonRows: GuideComparisonExcelRow[],
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Sodoit Admin";
  workbook.created = new Date();

  const guidesSheet = buildSheet(
    workbook,
    GUIDES_SHEET_NAME,
    GUIDE_EXCEL_COLUMNS,
    guideRows,
    styleGuideDataRow,
  );
  addListValidation(
    guidesSheet,
    GUIDE_EXCEL_COLUMNS,
    "type",
    GUIDE_TYPES,
    guideRows.length,
  );
  addListValidation(
    guidesSheet,
    GUIDE_EXCEL_COLUMNS,
    "route_mode",
    GUIDE_ROUTE_MODES,
    guideRows.length,
  );
  addListValidation(
    guidesSheet,
    GUIDE_EXCEL_COLUMNS,
    "featured",
    ["TRUE", "FALSE"],
    guideRows.length,
  );
  addListValidation(
    guidesSheet,
    GUIDE_EXCEL_COLUMNS,
    "is_public",
    ["TRUE", "FALSE"],
    guideRows.length,
  );

  buildSheet(
    workbook,
    SPOTS_SHEET_NAME,
    GUIDE_SPOT_EXCEL_COLUMNS,
    spotRows,
    styleSpotDataRow,
  );

  buildSheet(
    workbook,
    COMPARISONS_SHEET_NAME,
    GUIDE_COMPARISON_EXCEL_COLUMNS,
    comparisonRows,
    styleComparisonDataRow,
  );

  buildReadmeSheet(workbook);

  return workbook;
}

export const workbookToBlob = workbookToBlobShared;

export function guideExportFilename(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `sodoit-guides-${iso}.xlsx`;
}
