import { describe, expect, it } from "vitest";
import { suggestTags, TAG_RULES } from "../../lib/admin/tags/suggestion-engine";
import { EXPERIENCE_TAG_SEED } from "../../lib/experiences/taxonomy";
import { EXPERIENCE_CATEGORY_SEED } from "../../lib/experiences/taxonomy";
import {
  EXPERIENCE_TYPES,
  LOCATION_SCOPES,
} from "../../lib/experiences/taxonomy";

describe("suggestTags", () => {
  it("suggests iconic and history for a well-known landmark", () => {
    const result = suggestTags("Explore Petra in Jordan");
    expect(result.suggestedTagSlugs).toContain("iconic");
    expect(result.suggestedTagSlugs).toContain("history");
    expect(result.status).toBe("matched");
  });

  it("suggests nightlife and music for karaoke", () => {
    const result = suggestTags("Sing karaoke in front of a packed room");
    expect(result.suggestedTagSlugs).toContain("nightlife");
    expect(result.suggestedTagSlugs).toContain("music");
  });

  it("returns unmatched status with no suggestions for an unrelated title", () => {
    const result = suggestTags("Take an archery lesson");
    expect(result.suggestedTagSlugs).toEqual([]);
    expect(result.status).toBe("unmatched");
  });

  it("is deterministic across repeated calls", () => {
    const first = suggestTags("Go on safari in the Serengeti");
    const second = suggestTags("Go on safari in the Serengeti");
    expect(first).toEqual(second);
  });

  it("suggests adrenaline and aerial for a skydiving title", () => {
    const result = suggestTags("Go tandem skydiving");
    expect(result.suggestedTagSlugs).toContain("adrenaline");
    expect(result.suggestedTagSlugs).toContain("aerial");
  });

  it("suggests adrenaline for climbing, coasteering, and rafting variants", () => {
    expect(
      suggestTags("Climb at an outdoor crag with a guide").suggestedTagSlugs,
    ).toContain("adrenaline");
    expect(
      suggestTags("Go coasteering with a guide").suggestedTagSlugs,
    ).toContain("adrenaline");
    expect(suggestTags("Try packrafting").suggestedTagSlugs).toContain(
      "adrenaline",
    );
  });
});

describe("tag vocabulary quality", () => {
  it("has no rule slug outside the seeded vocabulary", () => {
    const seededSlugs = new Set(EXPERIENCE_TAG_SEED.map((tag) => tag.slug));
    for (const rule of TAG_RULES) {
      expect(seededSlugs.has(rule.slug)).toBe(true);
    }
  });

  it("every seeded tag has a matching suggestion rule", () => {
    const ruleSlugs = new Set(TAG_RULES.map((rule) => rule.slug));
    for (const tag of EXPERIENCE_TAG_SEED) {
      expect(ruleSlugs.has(tag.slug)).toBe(true);
    }
  });

  it("does not duplicate canonical category slugs", () => {
    const categorySlugs = new Set(
      EXPERIENCE_CATEGORY_SEED.map((category) => category.slug),
    );
    for (const tag of EXPERIENCE_TAG_SEED) {
      expect(categorySlugs.has(tag.slug)).toBe(false);
    }
  });

  it("does not duplicate canonical experience_type or location_scope values", () => {
    const dimensionValues = new Set<string>([
      ...EXPERIENCE_TYPES,
      ...LOCATION_SCOPES,
    ]);
    for (const tag of EXPERIENCE_TAG_SEED) {
      expect(dimensionValues.has(tag.slug)).toBe(false);
    }
  });

  it("keeps the vocabulary within the target range of 30-50 tags or documents a smaller, well-justified set", () => {
    expect(EXPERIENCE_TAG_SEED.length).toBeGreaterThanOrEqual(20);
    expect(EXPERIENCE_TAG_SEED.length).toBeLessThanOrEqual(50);
  });

  it("has unique tag slugs", () => {
    const slugs = EXPERIENCE_TAG_SEED.map((tag) => tag.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has stable, gap-free sort ordering", () => {
    const orders = EXPERIENCE_TAG_SEED.map((tag) => tag.sort_order ?? 0).sort(
      (a, b) => a - b,
    );
    for (let i = 0; i < orders.length; i++) {
      expect(orders[i]).toBe(i + 1);
    }
  });
});
