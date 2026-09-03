export const GUIDE_TYPES = [
  "itinerary",
  "hidden_gems",
  "food_drink",
  "local_favorites",
  "worth_it_or_skip_it",
] as const;

export type GuideType = (typeof GUIDE_TYPES)[number];

export const GUIDE_ROUTE_MODES = [
  "walking",
  "driving",
  "bicycling",
  "transit",
] as const;

export type GuideRouteMode = (typeof GUIDE_ROUTE_MODES)[number];

export type GuideRenderer = "itinerary" | "collection" | "comparison";

const GUIDE_TYPE_RENDERERS: Record<GuideType, GuideRenderer> = {
  itinerary: "itinerary",
  hidden_gems: "collection",
  food_drink: "collection",
  local_favorites: "collection",
  worth_it_or_skip_it: "comparison",
};

export const GUIDE_TYPE_LABELS: Record<GuideType, string> = {
  itinerary: "Itinerary",
  hidden_gems: "Hidden gems",
  food_drink: "Food & drink",
  local_favorites: "Local favorites",
  worth_it_or_skip_it: "Worth it or skip it",
};

export function isGuideType(value: unknown): value is GuideType {
  return (
    typeof value === "string" &&
    (GUIDE_TYPES as readonly string[]).includes(value)
  );
}

export function resolveGuideType(value: unknown): GuideType {
  return isGuideType(value) ? value : "itinerary";
}

export function getGuideRenderer(type: unknown): GuideRenderer {
  return GUIDE_TYPE_RENDERERS[resolveGuideType(type)];
}

export function isGuideRouteMode(value: unknown): value is GuideRouteMode {
  return (
    typeof value === "string" &&
    (GUIDE_ROUTE_MODES as readonly string[]).includes(value)
  );
}

export function resolveGuideRouteMode(value: unknown): GuideRouteMode | null {
  return isGuideRouteMode(value) ? value : null;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  city: string;
  country_code: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  duration_label: string | null;
  is_public: boolean;
  featured: boolean;
  type?: GuideType;
  city_slug?: string | null;
  sort_order?: number;
  editorial_attribution?: string | null;
  best_time?: string | null;
  local_tip?: string | null;
  route_mode?: GuideRouteMode | null;
  created_at: string;
  updated_at: string;
}

export interface GuideCity {
  slug: string;
  city: string;
  country_code: string;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  eyebrow: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface GuideItem {
  id: string;
  guide_id: string;
  position: number;
  title: string;
  description: string | null;
  place_name: string | null;
  image_url: string | null;
  image_alt: string | null;
  external_url: string | null;
  place_id: string | null;
  neighborhood?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface GuideComparisonPair {
  id: string;
  guide_id: string;
  position: number;
  skip_title: string;
  skip_description: string | null;
  go_instead_title: string;
  go_instead_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuideWithItems extends Guide {
  items: GuideItem[];
  comparisons?: GuideComparisonPair[];
}
