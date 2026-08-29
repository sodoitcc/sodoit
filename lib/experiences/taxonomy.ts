export const EXPERIENCE_TYPES = [
  "place",
  "activity",
  "event",
  "skill",
  "challenge",
] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export const LOCATION_SCOPES = [
  "anywhere",
  "country",
  "city",
  "specific_place",
] as const;

export type LocationScope = (typeof LOCATION_SCOPES)[number];

export interface ExperienceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ExperienceTag {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  sort_order: number | null;
}

export const EXPERIENCE_CATEGORY_SEED: readonly Pick<
  ExperienceCategory,
  "slug" | "name" | "sort_order"
>[] = [
  { slug: "places", name: "Places", sort_order: 1 },
  { slug: "adventure", name: "Adventure", sort_order: 2 },
  { slug: "fun-entertainment", name: "Fun & Entertainment", sort_order: 3 },
  { slug: "food-drink", name: "Food & Drink", sort_order: 4 },
  { slug: "nature-outdoors", name: "Nature & Outdoors", sort_order: 5 },
  { slug: "learn-create", name: "Learn & Create", sort_order: 6 },
  { slug: "wellness-active", name: "Wellness & Active", sort_order: 7 },
];
