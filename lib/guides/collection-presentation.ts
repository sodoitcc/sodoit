import { resolveGuideType, type GuideType } from "./types";

export interface CollectionPresentation {
  label: string;
  sectionHeading: string;
}

const COLLECTION_PRESENTATION: Record<
  "hidden_gems" | "food_drink" | "local_favorites",
  CollectionPresentation
> = {
  hidden_gems: {
    label: "Hidden Gems",
    sectionHeading: "Spots worth finding",
  },
  food_drink: {
    label: "Food & Drink",
    sectionHeading: "Spots worth trying",
  },
  local_favorites: {
    label: "Local Favorites",
    sectionHeading: "Local spots",
  },
};

const DEFAULT_PRESENTATION: CollectionPresentation = {
  label: "Collection",
  sectionHeading: "Spots to explore",
};

export function getCollectionPresentation(
  type: unknown,
): CollectionPresentation {
  const resolved: GuideType = resolveGuideType(type);

  if (
    resolved === "hidden_gems" ||
    resolved === "food_drink" ||
    resolved === "local_favorites"
  ) {
    return COLLECTION_PRESENTATION[resolved];
  }

  return DEFAULT_PRESENTATION;
}
