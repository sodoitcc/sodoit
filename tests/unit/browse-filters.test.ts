import { describe, expect, it } from "vitest";
import {
  countActiveTaxonomyFilters,
  parseDifficultyFilter,
  parseExperienceType,
  parseLocationScope,
  parseTaxonomyFilters,
  categoryDisplayLabel,
} from "../../app/(app)/browse/browse-filters";

describe("parseExperienceType", () => {
  it("accepts every valid experience type", () => {
    for (const value of ["place", "activity", "event", "skill", "challenge"]) {
      expect(parseExperienceType(value)).toBe(value);
    }
  });

  it("rejects an invalid experience type", () => {
    expect(parseExperienceType("not-a-type")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseExperienceType(undefined)).toBeNull();
  });
});

describe("parseDifficultyFilter", () => {
  it("accepts a valid difficulty label", () => {
    expect(parseDifficultyFilter("Medium")).toBe("Medium");
  });

  it("rejects an invalid difficulty label", () => {
    expect(parseDifficultyFilter("Nightmare")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseDifficultyFilter(undefined)).toBeNull();
  });
});

describe("parseLocationScope", () => {
  it("accepts every valid location scope", () => {
    for (const value of ["anywhere", "country", "city", "specific_place"]) {
      expect(parseLocationScope(value)).toBe(value);
    }
  });

  it("rejects an invalid location scope", () => {
    expect(parseLocationScope("galaxy")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseLocationScope(undefined)).toBeNull();
  });
});

describe("parseTaxonomyFilters", () => {
  it("parses a full valid set of params", () => {
    const result = parseTaxonomyFilters({
      category: "adventure",
      type: "activity",
      difficulty: "Hard",
      location: "country",
    });
    expect(result).toEqual({
      categorySlug: "adventure",
      type: "activity",
      difficulty: "Hard",
      locationScope: "country",
    });
  });

  it("ignores invalid values without throwing", () => {
    const result = parseTaxonomyFilters({
      category: "adventure",
      type: "not-a-type",
      difficulty: "Nightmare",
      location: "galaxy",
    });
    expect(result).toEqual({
      categorySlug: "adventure",
      type: null,
      difficulty: null,
      locationScope: null,
    });
  });

  it("returns all nulls for an empty params object", () => {
    expect(parseTaxonomyFilters({})).toEqual({
      categorySlug: null,
      type: null,
      difficulty: null,
      locationScope: null,
    });
  });
});

describe("countActiveTaxonomyFilters", () => {
  it("is zero when nothing is set", () => {
    expect(
      countActiveTaxonomyFilters({
        type: null,
        difficulty: null,
        locationScope: null,
      }),
    ).toBe(0);
  });

  it("counts each active filter independently", () => {
    expect(
      countActiveTaxonomyFilters({
        type: "activity",
        difficulty: "Medium",
        locationScope: "anywhere",
      }),
    ).toBe(3);
  });
});

describe("categoryDisplayLabel", () => {
  it("shortens long canonical category names for display", () => {
    expect(
      categoryDisplayLabel("fun-entertainment", "Fun & Entertainment"),
    ).toBe("Fun");
    expect(categoryDisplayLabel("nature-outdoors", "Nature & Outdoors")).toBe(
      "Nature",
    );
    expect(categoryDisplayLabel("learn-create", "Learn & Create")).toBe(
      "Learn",
    );
    expect(categoryDisplayLabel("wellness-active", "Wellness & Active")).toBe(
      "Wellness",
    );
  });

  it("falls back to the canonical name for categories without a short label", () => {
    expect(categoryDisplayLabel("places", "Places")).toBe("Places");
    expect(categoryDisplayLabel("adventure", "Adventure")).toBe("Adventure");
    expect(categoryDisplayLabel("food-drink", "Food & Drink")).toBe(
      "Food & Drink",
    );
  });
});
