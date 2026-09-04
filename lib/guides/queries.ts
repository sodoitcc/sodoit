import "server-only";

import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/validation";
import { getGuideRenderer } from "./types";
import type {
  Guide,
  GuideCity,
  GuideComparisonPair,
  GuideItem,
  GuideWithItems,
} from "./types";

const GUIDE_COLUMNS =
  "id, slug, title, description, city, country_code, cover_image_url, cover_image_alt, duration_label, is_public, featured, type, best_time, local_tip, route_mode, created_at, updated_at";
const ITEM_COLUMNS =
  "id, guide_id, position, title, description, place_name, image_url, image_alt, external_url, place_id, neighborhood, address, latitude, longitude, google_maps_url, tags, created_at, updated_at";
const CITY_COLUMNS =
  "slug, city, country_code, hero_image_url, hero_image_alt, eyebrow, title, description, created_at, updated_at";
const COMPARISON_COLUMNS =
  "id, guide_id, position, skip_title, skip_description, skip_neighborhood, skip_address, skip_latitude, skip_longitude, skip_google_maps_url, skip_external_url, skip_tags, go_instead_title, go_instead_description, go_instead_neighborhood, go_instead_address, go_instead_latitude, go_instead_longitude, go_instead_google_maps_url, go_instead_external_url, go_instead_tags, reason, created_at, updated_at";

export async function getPublicGuides(): Promise<Guide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guides")
    .select(GUIDE_COLUMNS)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .order("slug");
  if (error) throw error;
  return (data ?? []) as Guide[];
}

export async function getGuideCities(): Promise<GuideCity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guide_cities")
    .select(CITY_COLUMNS)
    .order("city");
  if (error) throw error;
  return (data ?? []) as GuideCity[];
}

export async function getGuideItemCounts(
  guideIds: string[],
): Promise<Record<string, number>> {
  if (guideIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guide_items")
    .select("guide_id")
    .in("guide_id", guideIds);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.guide_id] = (counts[row.guide_id] ?? 0) + 1;
  }
  return counts;
}

export async function getGuideBySlug(
  slug: string,
): Promise<GuideWithItems | null> {
  const supabase = await createClient();
  const guide = await supabase
    .from("guides")
    .select(GUIDE_COLUMNS)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (guide.error) throw guide.error;
  if (!guide.data) return null;

  const guideRow = guide.data as Guide;

  const [items, comparisons] = await Promise.all([
    supabase
      .from("guide_items")
      .select(ITEM_COLUMNS)
      .eq("guide_id", guideRow.id)
      .order("position"),
    getGuideRenderer(guideRow.type) === "comparison"
      ? supabase
          .from("guide_comparisons")
          .select(COMPARISON_COLUMNS)
          .eq("guide_id", guideRow.id)
          .order("position")
      : Promise.resolve({ data: [] as GuideComparisonPair[], error: null }),
  ]);

  if (items.error) throw items.error;
  if (comparisons.error) throw comparisons.error;

  return {
    ...guideRow,
    items: (items.data ?? []) as GuideItem[],
    comparisons: (comparisons.data ?? []) as GuideComparisonPair[],
  };
}

export interface GuideResolvedImage {
  url: string;
  alt: string | null;
  source: "guide" | "guide_item" | "place";
}

export async function getGuideResolvedImages(
  guides: Guide[],
): Promise<Record<string, GuideResolvedImage | null>> {
  if (guides.length === 0) return {};

  const result: Record<string, GuideResolvedImage | null> = {};

  const unresolvedIds: string[] = [];

  for (const guide of guides) {
    if (guide.cover_image_url) {
      result[guide.id] = {
        url: guide.cover_image_url,
        alt: guide.cover_image_alt,
        source: "guide",
      };
    } else {
      unresolvedIds.push(guide.id);
    }
  }

  const queryableIds = unresolvedIds.filter((id) => UUID_RE.test(id));

  if (queryableIds.length === 0) {
    for (const id of unresolvedIds) {
      result[id] ??= null;
    }
    return result;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guide_items")
    .select("guide_id, position, image_url, image_alt")
    .in("guide_id", queryableIds)
    .not("image_url", "is", null)
    .order("position");

  if (error) throw error;

  for (const item of data ?? []) {
    if (result[item.guide_id]) continue;

    result[item.guide_id] = {
      url: item.image_url,
      alt: item.image_alt,
      source: "guide_item",
    };
  }

  const stillUnresolvedIds = queryableIds.filter((id) => !result[id]);

  if (stillUnresolvedIds.length > 0) {
    await resolveFromPlaces(supabase, stillUnresolvedIds, result);
  }

  for (const id of unresolvedIds) {
    result[id] ??= null;
  }

  return result;
}

async function resolveFromPlaces(
  supabase: Awaited<ReturnType<typeof createClient>>,
  guideIds: string[],
  result: Record<string, GuideResolvedImage | null>,
): Promise<void> {
  const { data: items, error: itemsError } = await supabase
    .from("guide_items")
    .select("guide_id, position, place_id, place_name")
    .in("guide_id", guideIds)
    .not("place_id", "is", null)
    .order("position");

  if (itemsError) throw itemsError;

  const placeIdByGuide = new Map<string, string>();
  const itemByGuide = new Map<string, { place_name: string | null }>();

  for (const item of items ?? []) {
    if (placeIdByGuide.has(item.guide_id) || !item.place_id) continue;
    placeIdByGuide.set(item.guide_id, item.place_id);
    itemByGuide.set(item.guide_id, { place_name: item.place_name });
  }

  const placeIds = [...new Set(placeIdByGuide.values())];
  if (placeIds.length === 0) return;

  const { data: places, error: placesError } = await supabase
    .from("places")
    .select("id, name, primary_photo_url, primary_photo_alt")
    .in("id", placeIds)
    .eq("is_public", true)
    .not("primary_photo_url", "is", null);

  if (placesError) throw placesError;

  const placeById = new Map((places ?? []).map((place) => [place.id, place]));

  for (const [guideId, placeId] of placeIdByGuide) {
    const place = placeById.get(placeId);
    if (!place?.primary_photo_url) continue;

    result[guideId] = {
      url: place.primary_photo_url,
      alt:
        place.primary_photo_alt ??
        itemByGuide.get(guideId)?.place_name ??
        place.name,
      source: "place",
    };
  }
}
