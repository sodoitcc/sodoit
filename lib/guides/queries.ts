import "server-only";

import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/validation";
import type { Guide, GuideCity, GuideItem, GuideWithItems } from "./types";

const GUIDE_COLUMNS =
  "id, slug, title, description, city, country_code, cover_image_url, cover_image_alt, duration_label, is_public, featured, created_at, updated_at";
const ITEM_COLUMNS =
  "id, guide_id, position, title, description, place_name, image_url, image_alt, external_url, place_id, created_at, updated_at";
const CITY_COLUMNS =
  "slug, city, country_code, hero_image_url, hero_image_alt, eyebrow, title, description, created_at, updated_at";

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

  const items = await supabase
    .from("guide_items")
    .select(ITEM_COLUMNS)
    .eq("guide_id", guide.data.id)
    .order("position");
  if (items.error) throw items.error;

  return {
    ...(guide.data as Guide),
    items: (items.data ?? []) as GuideItem[],
  };
}

export interface GuideResolvedImage {
  url: string;
  alt: string | null;
  source: "guide" | "guide_item";
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

  // Dev-preview guides use synthetic ids (e.g. "preview-slug") that aren't
  // valid uuids — querying guide_items with those would 400. They resolve
  // to null (falls back to the placeholder cover) instead of crashing.
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

  for (const id of unresolvedIds) {
    result[id] ??= null;
  }

  return result;
}
