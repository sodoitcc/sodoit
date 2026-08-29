import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_CATEGORY_SEED,
  EXPERIENCE_TYPES,
  LOCATION_SCOPES,
} from "../../lib/experiences/taxonomy";

describe("EXPERIENCE_CATEGORY_SEED", () => {
  it("has exactly the seven categories in stable slug/order", () => {
    expect(EXPERIENCE_CATEGORY_SEED.map((c) => c.slug)).toEqual([
      "places",
      "adventure",
      "fun-entertainment",
      "food-drink",
      "nature-outdoors",
      "learn-create",
      "wellness-active",
    ]);
  });

  it("sort_order is sequential starting at 1", () => {
    expect(EXPERIENCE_CATEGORY_SEED.map((c) => c.sort_order)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("every slug is unique", () => {
    const slugs = EXPERIENCE_CATEGORY_SEED.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("EXPERIENCE_TYPES / LOCATION_SCOPES", () => {
  it("has the five controlled experience types", () => {
    expect(EXPERIENCE_TYPES).toEqual([
      "place",
      "activity",
      "event",
      "skill",
      "challenge",
    ]);
  });

  it("has the four controlled location scopes", () => {
    expect(LOCATION_SCOPES).toEqual([
      "anywhere",
      "country",
      "city",
      "specific_place",
    ]);
  });
});
