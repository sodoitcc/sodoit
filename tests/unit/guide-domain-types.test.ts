import { describe, expect, it } from "vitest";
import {
  GUIDE_TYPES,
  GUIDE_ROUTE_MODES,
  getGuideRenderer,
  isGuideRouteMode,
  isGuideType,
  resolveGuideRouteMode,
  resolveGuideType,
} from "@/lib/guides/types";

describe("guide type validation", () => {
  it("accepts every declared guide type", () => {
    for (const type of GUIDE_TYPES) {
      expect(isGuideType(type)).toBe(true);
    }
  });

  it("rejects legacy and unknown values", () => {
    expect(isGuideType("collection")).toBe(false);
    expect(isGuideType("not-a-type")).toBe(false);
    expect(isGuideType(undefined)).toBe(false);
    expect(isGuideType(null)).toBe(false);
  });

  it("falls back legacy/missing values to itinerary", () => {
    expect(resolveGuideType("collection")).toBe("itinerary");
    expect(resolveGuideType(undefined)).toBe("itinerary");
    expect(resolveGuideType(null)).toBe("itinerary");
    expect(resolveGuideType("garbage")).toBe("itinerary");
  });

  it("preserves a valid explicit type", () => {
    expect(resolveGuideType("worth_it_or_skip_it")).toBe("worth_it_or_skip_it");
  });
});

describe("guide renderer mapping", () => {
  it("maps itinerary to the itinerary renderer", () => {
    expect(getGuideRenderer("itinerary")).toBe("itinerary");
  });

  it("maps every collection-family type to the collection renderer", () => {
    expect(getGuideRenderer("hidden_gems")).toBe("collection");
    expect(getGuideRenderer("food_drink")).toBe("collection");
    expect(getGuideRenderer("local_favorites")).toBe("collection");
  });

  it("maps worth_it_or_skip_it to the comparison renderer", () => {
    expect(getGuideRenderer("worth_it_or_skip_it")).toBe("comparison");
  });

  it("maps an unresolvable value to the itinerary renderer via the default fallback", () => {
    expect(getGuideRenderer(undefined)).toBe("itinerary");
    expect(getGuideRenderer("collection")).toBe("itinerary");
  });
});

describe("guide route mode validation", () => {
  it("accepts every declared route mode", () => {
    for (const mode of GUIDE_ROUTE_MODES) {
      expect(isGuideRouteMode(mode)).toBe(true);
    }
  });

  it("rejects unknown route modes", () => {
    expect(isGuideRouteMode("flying")).toBe(false);
    expect(isGuideRouteMode(null)).toBe(false);
    expect(isGuideRouteMode(undefined)).toBe(false);
  });

  it("resolves an invalid or missing route mode to null, not a fabricated default", () => {
    expect(resolveGuideRouteMode("flying")).toBeNull();
    expect(resolveGuideRouteMode(undefined)).toBeNull();
    expect(resolveGuideRouteMode(null)).toBeNull();
  });

  it("resolves a valid route mode as-is", () => {
    expect(resolveGuideRouteMode("bicycling")).toBe("bicycling");
  });
});
