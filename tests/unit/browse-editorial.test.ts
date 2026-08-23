import { describe, expect, it } from "vitest";
import {
  isDefaultBrowseView,
  splitFeatured,
} from "../../app/(app)/browse/browse-editorial";
import type { Experience } from "../../lib/experiences/types";

const DEFAULT_PARAMS = {
  q: "",
  category: null,
  difficulty: null,
  status: "all" as const,
  sort: "recommended" as const,
};

function experience(overrides: Partial<Experience>): Experience {
  return {
    id: "id",
    title: "Title",
    slug: "title",
    description: null,
    category: null,
    difficulty: null,
    location_type: "global",
    country_code: null,
    city: null,
    featured: false,
    is_public: true,
    image_url: null,
    image_alt: null,
    saved_count: 0,
    completed_count: 0,
    why_it_matters: null,
    what_to_know: null,
    best_time: null,
    duration_text: null,
    location_note: null,
    ...overrides,
  };
}

describe("isDefaultBrowseView", () => {
  it("is true only when no search/filter/sort state is active", () => {
    expect(isDefaultBrowseView(DEFAULT_PARAMS)).toBe(true);
  });

  it.each([
    { ...DEFAULT_PARAMS, q: "japan" },
    { ...DEFAULT_PARAMS, category: "Food" },
    { ...DEFAULT_PARAMS, difficulty: "Easy" },
    { ...DEFAULT_PARAMS, status: "completed" as const },
    { ...DEFAULT_PARAMS, sort: "newest" as const },
  ])("is false when any filter is active: %j", (params) => {
    expect(isDefaultBrowseView(params)).toBe(false);
  });
});

describe("splitFeatured", () => {
  const featured = experience({ id: "a", featured: true });
  const plain1 = experience({ id: "b" });
  const plain2 = experience({ id: "c" });
  const rows = [plain1, featured, plain2];

  it("does nothing when the editorial view is not active", () => {
    expect(splitFeatured(rows, false)).toEqual({
      featured: null,
      rest: rows,
    });
  });

  it("pulls the featured experience out of the list, derived from real data", () => {
    const result = splitFeatured(rows, true);

    expect(result.featured).toEqual(featured);
    expect(result.rest).toEqual([plain1, plain2]);
  });

  it("falls back to no feature when nothing is marked featured", () => {
    const noneFeatured = [plain1, plain2];

    expect(splitFeatured(noneFeatured, true)).toEqual({
      featured: null,
      rest: noneFeatured,
    });
  });
});
