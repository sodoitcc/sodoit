import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getGuideBySlug } from "@/lib/guides/queries";

const comparisonsQueryMock = vi.fn();

function client(guideRow: Record<string, unknown> | null) {
  return {
    from(table: string) {
      if (table === "guides") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: guideRow, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "guide_items") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }

      if (table === "guide_comparisons") {
        comparisonsQueryMock();
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "c1",
                      guide_id: guideRow?.id,
                      position: 0,
                      skip_title: "Overpriced tourist trap",
                      skip_description: null,
                      go_instead_title: "Hidden local spot",
                      go_instead_description: null,
                      created_at: "2026-01-01T00:00:00Z",
                      updated_at: "2026-01-01T00:00:00Z",
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getGuideBySlug comparison loading", () => {
  it("does not query guide_comparisons for a non-comparison guide", async () => {
    createClientMock.mockResolvedValue(client({ id: "g1", type: "itinerary" }));

    const guide = await getGuideBySlug("some-itinerary");

    expect(comparisonsQueryMock).not.toHaveBeenCalled();
    expect(guide?.comparisons).toEqual([]);
  });

  it("queries and returns guide_comparisons for a worth_it_or_skip_it guide", async () => {
    createClientMock.mockResolvedValue(
      client({ id: "g2", type: "worth_it_or_skip_it" }),
    );

    const guide = await getGuideBySlug("some-comparison-guide");

    expect(comparisonsQueryMock).toHaveBeenCalledTimes(1);
    expect(guide?.comparisons).toHaveLength(1);
    expect(guide?.comparisons?.[0].skip_title).toBe("Overpriced tourist trap");
  });

  it("treats a legacy collection guide as itinerary for the comparisons gate", async () => {
    createClientMock.mockResolvedValue(
      client({ id: "g3", type: "collection" }),
    );

    const guide = await getGuideBySlug("legacy-collection-guide");

    expect(comparisonsQueryMock).not.toHaveBeenCalled();
    expect(guide?.comparisons).toEqual([]);
  });
});
