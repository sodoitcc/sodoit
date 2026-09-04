import { describe, expect, it } from "vitest";
import {
  COMPARISONS_SHEET_NAME,
  GUIDE_COMPARISON_EXCEL_COLUMNS,
  GUIDE_EXCEL_COLUMNS,
  GUIDE_SPOT_EXCEL_COLUMNS,
  GUIDES_SHEET_NAME,
  README_SHEET_NAME,
  SPOTS_SHEET_NAME,
  buildGuidesWorkbook,
  guideExportFilename,
  toGuideComparisonExcelRow,
  toGuideExcelRow,
  toGuideSpotExcelRow,
} from "@/lib/admin/guides/excel";

function guide(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    title: "48 Hours in Prague",
    slug: "48-hours-in-prague",
    description: "A weekend plan.",
    type: "itinerary" as const,
    city: "Prague",
    country_code: "CZ",
    city_slug: "prague",
    cover_image_url: null,
    cover_image_alt: null,
    duration_label: "2 days",
    best_time: "Morning",
    local_tip: "Arrive early.",
    route_mode: "walking" as const,
    featured: true,
    is_public: true,
    sort_order: 0,
    editorial_attribution: "Sodoit editorial",
    ...overrides,
  };
}

function spot(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    guide_id: "g1",
    position: 0,
    title: "Old Town Square",
    description: "Start here.",
    place_name: "Old Town Square",
    image_url: null,
    image_alt: null,
    external_url: null,
    neighborhood: "Staré Město",
    address: null,
    latitude: 50.087,
    longitude: 14.421,
    google_maps_url: null,
    tags: ["historic", "square"],
    ...overrides,
  };
}

function comparison(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    guide_id: "g1",
    position: 0,
    skip_title: "Old Town tourist restaurants",
    skip_description: "Overpriced.",
    skip_neighborhood: "Staré Město",
    skip_address: null,
    skip_latitude: null,
    skip_longitude: null,
    skip_google_maps_url: null,
    skip_external_url: null,
    skip_tags: null,
    go_instead_title: "Lokál Dlouhááá",
    go_instead_description: "Better value.",
    go_instead_neighborhood: "Staré Město",
    go_instead_address: null,
    go_instead_latitude: null,
    go_instead_longitude: null,
    go_instead_google_maps_url: null,
    go_instead_external_url: null,
    go_instead_tags: null,
    reason: "Same neighborhood, real food.",
    ...overrides,
  };
}

describe("Guide export row mapping", () => {
  it("maps a guide to its excel row, including new fields", () => {
    const row = toGuideExcelRow(guide());
    expect(row).toMatchObject({
      id: "g1",
      slug: "48-hours-in-prague",
      type: "itinerary",
      best_time: "Morning",
      local_tip: "Arrive early.",
      route_mode: "walking",
      featured: true,
      is_public: true,
    });
  });

  it("resolves a spot's guide_id to guide_slug via the lookup map", () => {
    const row = toGuideSpotExcelRow(spot(), new Map([["g1", "48-hours-in-prague"]]));
    expect(row.guide_slug).toBe("48-hours-in-prague");
    expect(row.tags).toBe("historic, square");
    expect(row.latitude).toBe("50.087");
  });

  it("leaves guide_slug blank when the guide is not in the lookup map", () => {
    const row = toGuideSpotExcelRow(spot(), new Map());
    expect(row.guide_slug).toBe("");
  });

  it("maps a comparison pair including both sides and reason", () => {
    const row = toGuideComparisonExcelRow(
      comparison(),
      new Map([["g1", "48-hours-in-prague"]]),
    );
    expect(row.guide_slug).toBe("48-hours-in-prague");
    expect(row.skip_title).toBe("Old Town tourist restaurants");
    expect(row.go_instead_title).toBe("Lokál Dlouhááá");
    expect(row.reason).toBe("Same neighborhood, real food.");
  });
});

describe("Guides workbook structure", () => {
  const guideSlugById = new Map([["g1", "48-hours-in-prague"]]);
  const workbook = buildGuidesWorkbook(
    [toGuideExcelRow(guide())],
    [toGuideSpotExcelRow(spot(), guideSlugById)],
    [toGuideComparisonExcelRow(comparison(), guideSlugById)],
  );

  it("creates all four sheets", () => {
    expect(workbook.getWorksheet(GUIDES_SHEET_NAME)).toBeDefined();
    expect(workbook.getWorksheet(SPOTS_SHEET_NAME)).toBeDefined();
    expect(workbook.getWorksheet(COMPARISONS_SHEET_NAME)).toBeDefined();
    expect(workbook.getWorksheet(README_SHEET_NAME)).toBeDefined();
  });

  it("puts stable identifiers first on each data sheet", () => {
    expect(GUIDE_EXCEL_COLUMNS[0].key).toBe("id");
    expect(GUIDE_EXCEL_COLUMNS[1].key).toBe("slug");
    expect(GUIDE_SPOT_EXCEL_COLUMNS[0].key).toBe("id");
    expect(GUIDE_SPOT_EXCEL_COLUMNS[1].key).toBe("guide_slug");
    expect(GUIDE_COMPARISON_EXCEL_COLUMNS[0].key).toBe("id");
    expect(GUIDE_COMPARISON_EXCEL_COLUMNS[1].key).toBe("guide_slug");
  });

  it("keeps latitude/longitude optional and near the end of the Spots sheet", () => {
    const keys = GUIDE_SPOT_EXCEL_COLUMNS.map((c) => c.key);
    const latIndex = keys.indexOf("latitude");
    const lngIndex = keys.indexOf("longitude");
    expect(latIndex).toBeGreaterThan(keys.length - 4);
    expect(lngIndex).toBeGreaterThan(latIndex);
  });

  it("writes matching header rows for each sheet", () => {
    const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME)!;
    const headerRow = guidesSheet.getRow(1);
    GUIDE_EXCEL_COLUMNS.forEach((column, index) => {
      expect(headerRow.getCell(index + 1).text).toBe(column.header);
    });
  });

  it("freezes the header row and adds an autofilter on data sheets", () => {
    const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME)!;
    expect(guidesSheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(guidesSheet.autoFilter).toBeDefined();
  });

  it("bolds header cells", () => {
    const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME)!;
    expect(guidesSheet.getRow(1).getCell(1).font?.bold).toBe(true);
  });

  it("adds a guide type dropdown on the Guides sheet", () => {
    const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME)!;
    const typeColumnIndex =
      GUIDE_EXCEL_COLUMNS.findIndex((c) => c.key === "type") + 1;
    const validation = guidesSheet.getCell(2, typeColumnIndex).dataValidation;
    expect(validation?.type).toBe("list");
    expect(validation?.formulae?.[0]).toContain("worth_it_or_skip_it");
  });

  it("adds a route_mode dropdown on the Guides sheet", () => {
    const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME)!;
    const routeColumnIndex =
      GUIDE_EXCEL_COLUMNS.findIndex((c) => c.key === "route_mode") + 1;
    const validation = guidesSheet.getCell(2, routeColumnIndex).dataValidation;
    expect(validation?.formulae?.[0]).toContain("walking");
  });

  it("adds TRUE/FALSE dropdowns for boolean columns", () => {
    const guidesSheet = workbook.getWorksheet(GUIDES_SHEET_NAME)!;
    const featuredColumnIndex =
      GUIDE_EXCEL_COLUMNS.findIndex((c) => c.key === "featured") + 1;
    const validation = guidesSheet.getCell(
      2,
      featuredColumnIndex,
    ).dataValidation;
    expect(validation?.formulae?.[0]).toBe('"TRUE,FALSE"');
  });
});

describe("README sheet", () => {
  const workbook = buildGuidesWorkbook([], [], []);
  const readme = workbook.getWorksheet(README_SHEET_NAME)!;

  function readmeText(): string {
    let text = "";
    readme.eachRow((row) => {
      text += `${row.getCell(1).text}\n`;
    });
    return text;
  }

  it("documents one row = one entity and guide_slug linking", () => {
    const text = readmeText();
    expect(text).toMatch(/one row = one entity/i);
    expect(text).toContain("guide_slug");
  });

  it("lists all five supported guide types", () => {
    const text = readmeText();
    for (const type of [
      "itinerary",
      "hidden_gems",
      "food_drink",
      "local_favorites",
      "worth_it_or_skip_it",
    ]) {
      expect(text).toContain(type);
    }
  });

  it("lists all four supported route modes", () => {
    const text = readmeText();
    for (const mode of ["walking", "driving", "bicycling", "transit"]) {
      expect(text).toContain(mode);
    }
  });

  it("documents blank/null behavior and the instruction against inventing data", () => {
    const text = readmeText();
    expect(text.toLowerCase()).toMatch(/blank/);
    expect(text.toLowerCase()).toMatch(/never invent/);
  });

  it("documents coordinate ranges", () => {
    const text = readmeText();
    expect(text).toMatch(/-90 and 90/);
    expect(text).toMatch(/-180 and 180/);
  });

  it("documents create vs update semantics for the id column", () => {
    const text = readmeText();
    expect(text.toLowerCase()).toMatch(/leave blank to create/);
    expect(text.toLowerCase()).toMatch(/set to an existing id to update/);
  });

  it("gives the LLM-editing instruction", () => {
    const text = readmeText();
    expect(text).toMatch(/preserving its schema/i);
  });
});

describe("guideExportFilename", () => {
  it("formats a dated xlsx filename", () => {
    const date = new Date("2026-03-05T00:00:00Z");
    expect(guideExportFilename(date)).toBe("sodoit-guides-2026-03-05.xlsx");
  });
});
