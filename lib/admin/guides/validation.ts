import { SLUG_RE } from "@/lib/admin/slug";
import { GUIDE_TYPES, isGuideType, isGuideRouteMode } from "@/lib/guides/types";

export { GUIDE_TYPES };

export const GUIDE_TITLE_MAX = 120;
export const GUIDE_DESCRIPTION_MAX = 2000;

export interface GuideInput {
  title: string;
  slug: string;
  description: string;
  type: string;
  city: string;
  country_code: string;
  city_slug: string;
  cover_image_url: string;
  cover_image_alt: string;
  duration_label: string;
  editorial_attribution: string;
  best_time: string;
  local_tip: string;
  route_mode: string;
  sort_order: number;
  featured: boolean;
  is_public: boolean;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateGuideInput(input: GuideInput): string | null {
  if (!input.title) return "Title is required.";
  if (input.title.length > GUIDE_TITLE_MAX)
    return `Title must be ${GUIDE_TITLE_MAX} characters or fewer.`;

  if (!SLUG_RE.test(input.slug))
    return "Slug must be lowercase letters, numbers, and hyphens.";

  if (!isGuideType(input.type)) return "Choose a valid guide type.";

  if (input.route_mode && !isGuideRouteMode(input.route_mode))
    return "Choose a valid route mode.";

  if (!input.city) return "City is required.";

  if (!/^[A-Z]{2}$/.test(input.country_code))
    return "Country code must be 2 uppercase letters.";

  if (input.description.length > GUIDE_DESCRIPTION_MAX)
    return `Description must be ${GUIDE_DESCRIPTION_MAX} characters or fewer.`;

  if (input.cover_image_url && !isValidUrl(input.cover_image_url))
    return "Cover image URL must be a valid URL.";

  if (Number.isNaN(input.sort_order) || input.sort_order < 0)
    return "Sort order must be a non-negative number.";

  return null;
}

export function readGuideInput(formData: FormData): GuideInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    type: String(formData.get("type") ?? "itinerary"),
    city: String(formData.get("city") ?? "").trim(),
    country_code: String(formData.get("country_code") ?? "")
      .trim()
      .toUpperCase(),
    city_slug: String(formData.get("city_slug") ?? "").trim(),
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim(),
    cover_image_alt: String(formData.get("cover_image_alt") ?? "").trim(),
    duration_label: String(formData.get("duration_label") ?? "").trim(),
    editorial_attribution: String(
      formData.get("editorial_attribution") ?? "",
    ).trim(),
    best_time: String(formData.get("best_time") ?? "").trim(),
    local_tip: String(formData.get("local_tip") ?? "").trim(),
    route_mode: String(formData.get("route_mode") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    featured: formData.get("featured") === "on",
    is_public: formData.get("is_public") === "on",
  };
}

export interface GuideItemInput {
  title: string;
  description: string;
  place_name: string;
  image_url: string;
  image_alt: string;
  external_url: string;
  neighborhood: string;
  address: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  tags: string;
}

export function readGuideItemInput(formData: FormData): GuideItemInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    place_name: String(formData.get("place_name") ?? "").trim(),
    image_url: String(formData.get("image_url") ?? "").trim(),
    image_alt: String(formData.get("image_alt") ?? "").trim(),
    external_url: String(formData.get("external_url") ?? "").trim(),
    neighborhood: String(formData.get("neighborhood") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    latitude: String(formData.get("latitude") ?? "").trim(),
    longitude: String(formData.get("longitude") ?? "").trim(),
    google_maps_url: String(formData.get("google_maps_url") ?? "").trim(),
    tags: String(formData.get("tags") ?? "").trim(),
  };
}

export function validateGuideItemInput(input: GuideItemInput): string | null {
  if (!input.title) return "Title is required.";
  if (input.image_url && !isValidUrl(input.image_url))
    return "Image URL must be a valid URL.";
  if (input.external_url && !isValidUrl(input.external_url))
    return "External URL must be a valid URL.";
  if (input.google_maps_url && !isValidUrl(input.google_maps_url))
    return "Google Maps URL must be a valid URL.";
  if (input.latitude) {
    const latitude = Number(input.latitude);
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
      return "Latitude must be a number between -90 and 90.";
  }
  if (input.longitude) {
    const longitude = Number(input.longitude);
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180)
      return "Longitude must be a number between -180 and 180.";
  }
  return null;
}

export function parseTags(value: string): string[] | null {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? tags : null;
}
