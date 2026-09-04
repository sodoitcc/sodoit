import { describe, expect, it } from "vitest";
import { getCollectionPresentation } from "@/lib/guides/collection-presentation";

describe("getCollectionPresentation", () => {
  it("returns hidden_gems presentation", () => {
    expect(getCollectionPresentation("hidden_gems")).toMatchObject({
      label: "Hidden Gems",
      sectionHeading: "Spots worth finding",
    });
  });

  it("returns food_drink presentation", () => {
    expect(getCollectionPresentation("food_drink")).toMatchObject({
      label: "Food & Drink",
      sectionHeading: "Spots worth trying",
    });
  });

  it("returns local_favorites presentation", () => {
    expect(getCollectionPresentation("local_favorites")).toMatchObject({
      label: "Local Favorites",
      sectionHeading: "Local spots",
    });
  });

  it("falls back to a default presentation for non-collection types", () => {
    expect(getCollectionPresentation("itinerary")).toMatchObject({
      label: "Collection",
    });
    expect(getCollectionPresentation("worth_it_or_skip_it")).toMatchObject({
      label: "Collection",
    });
    expect(getCollectionPresentation(undefined)).toMatchObject({
      label: "Collection",
    });
  });
});
