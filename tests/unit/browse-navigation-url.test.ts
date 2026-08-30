import { describe, expect, it } from "vitest";
import { buildBrowseHref } from "../../app/(app)/browse/hooks/useBrowseNavigation";
import type { BrowseNavState } from "../../app/(app)/browse/hooks/useBrowseNavigation";

function baseState(overrides: Partial<BrowseNavState> = {}): BrowseNavState {
  return {
    q: "",
    category: null,
    type: null,
    difficulty: null,
    locationScope: null,
    status: "all",
    sort: "recommended",
    view: "grid",
    ...overrides,
  };
}

describe("buildBrowseHref", () => {
  it("returns the bare root when every value is default", () => {
    expect(buildBrowseHref(baseState())).toBe("/");
  });

  it("omits default/all values from the URL", () => {
    const href = buildBrowseHref(
      baseState({ status: "all", sort: "recommended", view: "grid" }),
    );
    expect(href).toBe("/");
  });

  it("serializes a full filter combination", () => {
    const href = buildBrowseHref(
      baseState({
        category: "adventure",
        type: "activity",
        difficulty: "Medium",
        locationScope: "anywhere",
      }),
    );
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("category")).toBe("adventure");
    expect(params.get("type")).toBe("activity");
    expect(params.get("difficulty")).toBe("Medium");
    expect(params.get("location")).toBe("anywhere");
  });

  it("preserves search text alongside filters", () => {
    const href = buildBrowseHref(baseState({ q: "japan", category: "places" }));
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("q")).toBe("japan");
    expect(params.get("category")).toBe("places");
  });

  it("round-trips a value through parseTaxonomyFilters", async () => {
    const { parseTaxonomyFilters } = await import(
      "../../app/(app)/browse/browse-filters"
    );
    const href = buildBrowseHref(
      baseState({
        category: "food-drink",
        type: "event",
        difficulty: "Easy",
        locationScope: "city",
      }),
    );
    const params = Object.fromEntries(
      new URLSearchParams(href.split("?")[1]),
    );
    const parsed = parseTaxonomyFilters(params);
    expect(parsed).toEqual({
      categorySlug: "food-drink",
      type: "event",
      difficulty: "Easy",
      locationScope: "city",
    });
  });
});
