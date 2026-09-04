import { describe, expect, it } from "vitest";
import {
  buildGuidesWorkbook,
  workbookToBlob,
  type GuideComparisonExcelRow,
  type GuideExcelRow,
  type GuideSpotExcelRow,
} from "@/lib/admin/guides/excel";
import {
  buildGuideImportPreview,
  parseGuidesWorkbook,
} from "@/lib/admin/guides/import";
import type { Guide, GuideComparisonPair, GuideItem } from "@/lib/guides/types";

function guideRow(overrides: Partial<GuideExcelRow> = {}): GuideExcelRow {
  return {
    id: "",
    slug: "48-hours-in-prague",
    title: "48 Hours in Prague",
    type: "itinerary",
    city: "Prague",
    country_code: "CZ",
    city_slug: "",
    description: "A weekend plan.",
    duration_label: "2 days",
    best_time: "",
    local_tip: "",
    route_mode: "",
    cover_image_url: "",
    cover_image_alt: "",
    editorial_attribution: "",
    featured: false,
    is_public: true,
    sort_order: 0,
    ...overrides,
  };
}

function spotRow(
  overrides: Partial<GuideSpotExcelRow> = {},
): GuideSpotExcelRow {
  return {
    id: "",
    guide_slug: "48-hours-in-prague",
    position: 0,
    title: "Old Town Square",
    neighborhood: "Staré Město",
    address: "",
    description: "Start here.",
    google_maps_url: "",
    external_url: "",
    tags: "historic, square",
    place_name: "",
    image_url: "",
    image_alt: "",
    latitude: "50.087",
    longitude: "14.421",
    ...overrides,
  };
}

function comparisonRow(
  overrides: Partial<GuideComparisonExcelRow> = {},
): GuideComparisonExcelRow {
  return {
    id: "",
    guide_slug: "48-hours-in-prague",
    position: 0,
    skip_title: "Old Town tourist restaurants",
    skip_description: "Overpriced.",
    skip_neighborhood: "Staré Město",
    skip_address: "",
    skip_google_maps_url: "",
    skip_external_url: "",
    skip_tags: "",
    go_instead_title: "Lokál Dlouhááá",
    go_instead_description: "Better value.",
    go_instead_neighborhood: "Staré Město",
    go_instead_address: "",
    go_instead_google_maps_url: "",
    go_instead_external_url: "",
    go_instead_tags: "",
    reason: "Same neighborhood, real food.",
    skip_latitude: "",
    skip_longitude: "",
    go_instead_latitude: "",
    go_instead_longitude: "",
    ...overrides,
  };
}

async function workbookBuffer(
  guides: GuideExcelRow[],
  spots: GuideSpotExcelRow[],
  comparisons: GuideComparisonExcelRow[],
): Promise<ArrayBuffer> {
  const workbook = buildGuidesWorkbook(guides, spots, comparisons);
  const blob = await workbookToBlob(workbook);
  return blob.arrayBuffer();
}

async function parse(
  guides: GuideExcelRow[],
  spots: GuideSpotExcelRow[] = [],
  comparisons: GuideComparisonExcelRow[] = [],
) {
  const buffer = await workbookBuffer(guides, spots, comparisons);
  const result = await parseGuidesWorkbook(buffer);
  if (!result.ok) throw new Error(result.error);
  return result;
}

function dbGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    id: "g1",
    slug: "48-hours-in-prague",
    title: "48 Hours in Prague",
    description: "A weekend plan.",
    city: "Prague",
    country_code: "CZ",
    cover_image_url: null,
    cover_image_alt: null,
    duration_label: "2 days",
    is_public: true,
    featured: false,
    type: "itinerary",
    city_slug: null,
    sort_order: 0,
    editorial_attribution: null,
    best_time: null,
    local_tip: null,
    route_mode: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function dbSpot(overrides: Partial<GuideItem> = {}): GuideItem {
  return {
    id: "s1",
    guide_id: "g1",
    position: 0,
    title: "Old Town Square",
    description: "Start here.",
    place_name: null,
    image_url: null,
    image_alt: null,
    external_url: null,
    place_id: null,
    neighborhood: "Staré Město",
    address: null,
    latitude: 50.087,
    longitude: 14.421,
    google_maps_url: null,
    tags: ["historic", "square"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function dbComparison(
  overrides: Partial<GuideComparisonPair> = {},
): GuideComparisonPair {
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
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("parseGuidesWorkbook headers", () => {
  it("rejects a workbook missing the Spots sheet", async () => {
    const workbook = buildGuidesWorkbook([], [], []);
    workbook.removeWorksheet(workbook.getWorksheet("Spots")!.id);
    const blob = await workbookToBlob(workbook);
    const result = await parseGuidesWorkbook(await blob.arrayBuffer());
    expect(result.ok).toBe(false);
  });
});

describe("Roundtrip: export shape re-imports as unchanged", () => {
  it("produces zero changes when the exact exported row is re-uploaded", async () => {
    const parsed = await parse(
      [guideRow({ id: "g1" })],
      [spotRow({ id: "s1" })],
      [comparisonRow({ id: "c1" })],
    );

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [dbSpot()],
      [dbComparison()],
    );

    expect(preview.summary.guides).toMatchObject({
      update: 0,
      unchanged: 1,
      error: 0,
    });
    expect(preview.summary.spots).toMatchObject({
      update: 0,
      unchanged: 1,
      error: 0,
    });
    expect(preview.summary.comparisons).toMatchObject({
      update: 0,
      unchanged: 1,
      error: 0,
    });
  });
});

describe("Guide create/update via guide_slug", () => {
  it("creates a new guide and resolves a new spot to it by guide_slug", async () => {
    const parsed = await parse(
      [guideRow({ id: "", slug: "new-guide", title: "New Guide" })],
      [spotRow({ id: "", guide_slug: "new-guide" })],
    );

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [],
      [],
      [],
    );

    expect(preview.summary.guides.create).toBe(1);
    expect(preview.summary.spots.create).toBe(1);
    const spot = preview.spots[0];
    expect(spot.status).toBe("create");
    if (spot.status === "create") {
      expect(spot.parent).toEqual({ kind: "new", slug: "new-guide" });
    }
  });

  it("resolves a spot to an existing guide by guide_slug", async () => {
    const parsed = await parse(
      [],
      [spotRow({ guide_slug: "48-hours-in-prague" })],
    );

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [],
    );

    const spot = preview.spots[0];
    expect(spot.status).toBe("create");
    if (spot.status === "create") {
      expect(spot.parent).toEqual({ kind: "existing", guideId: "g1" });
    }
  });

  it("errors when guide_slug matches no guide", async () => {
    const parsed = await parse([], [spotRow({ guide_slug: "does-not-exist" })]);

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [],
      [],
      [],
    );

    expect(preview.spots[0].status).toBe("error");
  });
});

describe("Spot updates", () => {
  it("diffs a changed field and reports it in changes", async () => {
    const parsed = await parse(
      [],
      [spotRow({ id: "s1", title: "Old Town Square (renamed)" })],
    );

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [dbSpot()],
      [],
    );

    const row = preview.spots[0];
    expect(row.status).toBe("update");
    if (row.status === "update") {
      expect(row.changes.some((c) => c.field === "title")).toBe(true);
    }
  });

  it("detects a tags-only change", async () => {
    const parsed = await parse([], [spotRow({ id: "s1", tags: "historic" })]);

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [dbSpot()],
      [],
    );

    const row = preview.spots[0];
    expect(row.status).toBe("update");
    if (row.status === "update") {
      expect(row.changes.some((c) => c.field === "tags")).toBe(true);
    }
  });
});

describe("Comparison updates", () => {
  it("diffs a changed reason field", async () => {
    const parsed = await parse(
      [],
      [],
      [comparisonRow({ id: "c1", reason: "A better, cheaper meal nearby." })],
    );

    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [dbComparison()],
    );

    const row = preview.comparisons[0];
    expect(row.status).toBe("update");
    if (row.status === "update") {
      expect(row.changes.some((c) => c.field === "reason")).toBe(true);
    }
  });
});

describe("Validation errors", () => {
  it("rejects an unknown guide type", async () => {
    const parsed = await parse([guideRow({ type: "spaceship" })]);
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [],
      [],
      [],
    );
    expect(preview.guides[0].status).toBe("error");
  });

  it("rejects an unsafe google_maps_url on a spot", async () => {
    const parsed = await parse(
      [],
      [spotRow({ google_maps_url: "javascript:alert(1)" })],
    );
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [],
    );
    expect(preview.spots[0].status).toBe("error");
  });

  it("rejects an out-of-range latitude on a spot", async () => {
    const parsed = await parse([], [spotRow({ latitude: "200" })]);
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [],
    );
    expect(preview.spots[0].status).toBe("error");
  });

  it("rejects an out-of-range longitude on a comparison side", async () => {
    const parsed = await parse(
      [],
      [],
      [comparisonRow({ skip_longitude: "200" })],
    );
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [],
    );
    expect(preview.comparisons[0].status).toBe("error");
  });

  it("rejects duplicate positions for two spots on the same guide", async () => {
    const parsed = await parse(
      [],
      [
        spotRow({ title: "First", position: 0 }),
        spotRow({ title: "Second", position: 0 }),
      ],
    );
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [],
    );
    expect(preview.spots.every((row) => row.status === "error")).toBe(true);
  });

  it("rejects a duplicate id within the same file", async () => {
    const parsed = await parse([
      guideRow({ id: "g1", slug: "a" }),
      guideRow({ id: "g1", slug: "b" }),
    ]);
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [],
      [],
    );
    expect(preview.guides.every((row) => row.status === "error")).toBe(true);
  });

  it("rejects a duplicate slug within the same file", async () => {
    const parsed = await parse([
      guideRow({ id: "", slug: "dup" }),
      guideRow({ id: "", slug: "dup" }),
    ]);
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [],
      [],
      [],
    );
    expect(preview.guides.every((row) => row.status === "error")).toBe(true);
  });

  it("rejects moving an existing spot to a different guide", async () => {
    const parsed = await parse(
      [guideRow({ id: "", slug: "other-guide" })],
      [spotRow({ id: "s1", guide_slug: "other-guide" })],
    );
    const preview = buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [dbGuide()],
      [dbSpot()],
      [],
    );
    expect(preview.spots[0].status).toBe("error");
  });
});

describe("Preview does not mutate the database", () => {
  it("buildGuideImportPreview is a pure function over its inputs", async () => {
    const parsed = await parse([guideRow({ id: "g1", title: "Changed" })]);
    const before = dbGuide();

    buildGuideImportPreview(
      parsed.guideRows,
      parsed.spotRows,
      parsed.comparisonRows,
      [before],
      [],
      [],
    );

    expect(before.title).toBe("48 Hours in Prague");
  });
});
