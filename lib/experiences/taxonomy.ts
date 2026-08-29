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

export const EXPERIENCE_TAG_SEED: readonly Pick<
  ExperienceTag,
  "slug" | "name" | "sort_order"
>[] = [
  { slug: "history", name: "History", sort_order: 1 },
  { slug: "architecture", name: "Architecture", sort_order: 2 },
  { slug: "iconic", name: "Iconic", sort_order: 3 },
  { slug: "nightlife", name: "Nightlife", sort_order: 4 },
  { slug: "music", name: "Music", sort_order: 5 },
  { slug: "live-performance", name: "Live Performance", sort_order: 6 },
  { slug: "dance", name: "Dance", sort_order: 7 },
  { slug: "festivals", name: "Festivals", sort_order: 8 },
  { slug: "wildlife", name: "Wildlife", sort_order: 9 },
  { slug: "ocean", name: "Ocean", sort_order: 10 },
  { slug: "beaches", name: "Beaches", sort_order: 11 },
  { slug: "mountains", name: "Mountains", sort_order: 12 },
  { slug: "winter", name: "Winter", sort_order: 13 },
  { slug: "scenic", name: "Scenic", sort_order: 14 },
  { slug: "journey", name: "Journey", sort_order: 15 },
  { slug: "food-tasting", name: "Food Tasting", sort_order: 16 },
  { slug: "creative", name: "Creative", sort_order: 17 },
  { slug: "culture", name: "Culture", sort_order: 18 },
  { slug: "relaxation", name: "Relaxation", sort_order: 19 },
  { slug: "adrenaline", name: "Adrenaline", sort_order: 20 },
  { slug: "hiking", name: "Hiking", sort_order: 21 },
  { slug: "bucket-list", name: "Bucket List", sort_order: 22 },
  { slug: "desert", name: "Desert", sort_order: 23 },
  { slug: "boating", name: "Boating", sort_order: 24 },
  { slug: "aerial", name: "Aerial", sort_order: 25 },
];
