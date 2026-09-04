import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGuidesWorkbook,
  workbookToBlob,
  type GuideComparisonExcelRow,
  type GuideExcelRow,
  type GuideSpotExcelRow,
} from "@/lib/admin/guides/excel";
import type { Guide, GuideComparisonPair, GuideItem } from "@/lib/guides/types";

const { listExportMock, rpcMock } = vi.hoisted(() => ({
  listExportMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/lib/admin/guides/queries", () => ({
  listGuidesForExport: listExportMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}));

import { applyGuideImport } from "@/lib/admin/guides/apply";

function guideRow(overrides: Partial<GuideExcelRow> = {}): GuideExcelRow {
  return {
    id: "",
    title: "48 Hours in Prague",
    slug: "48-hours-in-prague",
    type: "itinerary",
    city: "Prague",
    country_code: "CZ",
    city_slug: "",
    description: "A weekend in Prague.",
    duration_label: "",
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
    title: "Explore the National Museum",
    neighborhood: "",
    address: "",
    description: "",
    google_maps_url: "",
    external_url: "",
    tags: "",
    place_name: "",
    image_url: "",
    image_alt: "",
    latitude: "",
    longitude: "",
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
    skip_description: "",
    skip_neighborhood: "",
    skip_address: "",
    skip_google_maps_url: "",
    skip_external_url: "",
    skip_tags: "",
    go_instead_title: "Lokál Dlouhááá",
    go_instead_description: "",
    go_instead_neighborhood: "",
    go_instead_address: "",
    go_instead_google_maps_url: "",
    go_instead_external_url: "",
    go_instead_tags: "",
    reason: "",
    skip_latitude: "",
    skip_longitude: "",
    go_instead_latitude: "",
    go_instead_longitude: "",
    ...overrides,
  };
}

function existingGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "48-hours-in-prague",
    title: "48 Hours in Prague",
    description: "A weekend in Prague.",
    city: "Prague",
    country_code: "CZ",
    cover_image_url: null,
    cover_image_alt: null,
    duration_label: null,
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

function existingSpot(overrides: Partial<GuideItem> = {}): GuideItem {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    guide_id: "11111111-1111-4111-8111-111111111111",
    position: 0,
    title: "Explore the National Museum",
    description: null,
    place_name: null,
    image_url: null,
    image_alt: null,
    external_url: null,
    place_id: null,
    neighborhood: null,
    address: null,
    latitude: null,
    longitude: null,
    google_maps_url: null,
    tags: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function existingComparison(
  overrides: Partial<GuideComparisonPair> = {},
): GuideComparisonPair {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    guide_id: "11111111-1111-4111-8111-111111111111",
    position: 0,
    skip_title: "Old Town tourist restaurants",
    skip_description: null,
    skip_neighborhood: null,
    skip_address: null,
    skip_latitude: null,
    skip_longitude: null,
    skip_google_maps_url: null,
    skip_external_url: null,
    skip_tags: null,
    go_instead_title: "Lokál Dlouhááá",
    go_instead_description: null,
    go_instead_neighborhood: null,
    go_instead_address: null,
    go_instead_latitude: null,
    go_instead_longitude: null,
    go_instead_google_maps_url: null,
    go_instead_external_url: null,
    go_instead_tags: null,
    reason: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

async function bufferFromSheets(
  guides: GuideExcelRow[],
  spots: GuideSpotExcelRow[],
  comparisons: GuideComparisonExcelRow[],
): Promise<ArrayBuffer> {
  const workbook = buildGuidesWorkbook(guides, spots, comparisons);
  const blob = await workbookToBlob(workbook);
  return blob.arrayBuffer();
}

beforeEach(() => {
  vi.clearAllMocks();
  listExportMock.mockResolvedValue({ guides: [], items: [], comparisons: [] });
  rpcMock.mockResolvedValue({
    data: {
      created_guide_ids: [],
      created_spot_ids: [],
      created_comparison_ids: [],
    },
    error: null,
  });
});

describe("applyGuideImport — no-op", () => {
  it("does not call the RPC when nothing changed", async () => {
    listExportMock.mockResolvedValue({
      guides: [existingGuide()],
      items: [],
      comparisons: [],
    });
    const buffer = await bufferFromSheets(
      [guideRow({ id: existingGuide().id })],
      [],
      [],
    );

    const result = await applyGuideImport(buffer, {}, {}, {});

    expect(result.ok).toBe(true);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("applyGuideImport — validation", () => {
  it("returns validation_error without calling the RPC", async () => {
    const buffer = await bufferFromSheets(
      [guideRow({ type: "spaceship" })],
      [],
      [],
    );

    const result = await applyGuideImport(buffer, {}, {}, {});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("validation_error");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("applyGuideImport — stale preview", () => {
  it("flags a guide update whose fingerprint no longer matches", async () => {
    const guide = existingGuide();
    listExportMock.mockResolvedValue({
      guides: [guide],
      items: [],
      comparisons: [],
    });
    const buffer = await bufferFromSheets(
      [guideRow({ id: guide.id, title: "Renamed" })],
      [],
      [],
    );

    const result = await applyGuideImport(
      buffer,
      { [guide.id]: "stale" },
      {},
      {},
    );

    expect(result.ok).toBe(false);
    if (!result.ok && result.kind === "stale_preview") {
      expect(result.conflicts[0]).toMatchObject({
        entity: "guide",
        id: guide.id,
      });
    }
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("applyGuideImport — creates", () => {
  it("creates a guide with import_ref set to its own slug, then resolves child rows to it", async () => {
    const buffer = await bufferFromSheets(
      [guideRow({ id: "", slug: "new-guide", title: "New Guide" })],
      [spotRow({ id: "", guide_slug: "new-guide" })],
      [comparisonRow({ id: "", guide_slug: "new-guide" })],
    );

    rpcMock.mockResolvedValue({
      data: {
        created_guide_ids: ["g-new"],
        created_spot_ids: ["s-new"],
        created_comparison_ids: ["c-new"],
      },
      error: null,
    });

    const result = await applyGuideImport(buffer, {}, {}, {});

    expect(result.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledOnce();
    const [, payload] = rpcMock.mock.calls[0];
    expect(payload.guide_creates[0]).toMatchObject({
      import_ref: "new-guide",
      slug: "new-guide",
    });
    expect(payload.spot_creates[0]).toMatchObject({ guide_ref: "new-guide" });
    expect(payload.comparison_creates[0]).toMatchObject({
      guide_ref: "new-guide",
    });

    if (result.ok) {
      expect(result.guides.created[0]).toMatchObject({ id: "g-new" });
      expect(result.spots.created[0]).toMatchObject({ id: "s-new" });
      expect(result.comparisons.created[0]).toMatchObject({ id: "c-new" });
    }
  });
});

describe("applyGuideImport — updates including comparisons", () => {
  it("sends guide, spot and comparison updates in one atomic RPC call", async () => {
    const guide = existingGuide();
    const spot = existingSpot();
    const comparison = existingComparison();

    listExportMock.mockResolvedValue({
      guides: [guide],
      items: [spot],
      comparisons: [comparison],
    });

    const buffer = await bufferFromSheets(
      [guideRow({ id: guide.id, title: "Updated title" })],
      [spotRow({ id: spot.id, title: "Updated spot" })],
      [comparisonRow({ id: comparison.id, reason: "Now has a reason." })],
    );

    const {
      fingerprintGuide,
      fingerprintGuideSpot,
      fingerprintGuideComparison,
    } = await import("@/lib/admin/guides/import");

    const result = await applyGuideImport(
      buffer,
      { [guide.id]: fingerprintGuide(guide) },
      { [spot.id]: fingerprintGuideSpot(spot) },
      { [comparison.id]: fingerprintGuideComparison(comparison) },
    );

    expect(result.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledOnce();
    const [, payload] = rpcMock.mock.calls[0];
    expect(payload.guide_updates[0]).toMatchObject({
      id: guide.id,
      title: "Updated title",
    });
    expect(payload.spot_updates[0]).toMatchObject({
      id: spot.id,
      title: "Updated spot",
    });
    expect(payload.comparison_updates[0]).toMatchObject({
      id: comparison.id,
      reason: "Now has a reason.",
    });
  });
});

describe("applyGuideImport — RPC failure", () => {
  it("fails safely without leaking the underlying error", async () => {
    listExportMock.mockResolvedValue({
      guides: [],
      items: [],
      comparisons: [],
    });
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "constraint violation on guide_comparisons" },
    });

    const buffer = await bufferFromSheets(
      [guideRow({ id: "", slug: "new-guide" })],
      [],
      [],
    );

    const result = await applyGuideImport(buffer, {}, {}, {});

    expect(result.ok).toBe(false);
    if (!result.ok && result.kind === "apply_failed") {
      expect(result.error).not.toMatch(/constraint violation/);
    }
  });
});
