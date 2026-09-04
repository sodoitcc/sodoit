import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuideRenderer } from "@/lib/guides/types";
import type {
  Guide,
  GuideComparisonPair,
  GuideItem,
  GuideWithItems,
} from "@/lib/guides/types";

export const ADMIN_GUIDE_COLUMNS =
  "id, slug, title, description, city, country_code, cover_image_url, cover_image_alt, duration_label, is_public, featured, created_at, updated_at, type, city_slug, sort_order, editorial_attribution, best_time, local_tip, route_mode";
export const ADMIN_ITEM_COLUMNS =
  "id, guide_id, position, title, description, place_name, image_url, image_alt, external_url, created_at, updated_at, place_id, neighborhood, address, latitude, longitude, google_maps_url, tags";
export const ADMIN_COMPARISON_COLUMNS =
  "id, guide_id, position, skip_title, skip_description, skip_neighborhood, skip_address, skip_latitude, skip_longitude, skip_google_maps_url, skip_external_url, skip_tags, go_instead_title, go_instead_description, go_instead_neighborhood, go_instead_address, go_instead_latitude, go_instead_longitude, go_instead_google_maps_url, go_instead_external_url, go_instead_tags, reason, created_at, updated_at";

export const GUIDES_PAGE_SIZE = 20;

export interface AdminGuideFilters {
  q: string;
  type: string;
  visibility: "all" | "public" | "hidden";
  page: number;
}

export interface AdminGuideListItem extends Guide {
  itemCount: number;
}

export interface AdminGuideListResult {
  guides: AdminGuideListItem[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listGuidesAdmin(
  filters: AdminGuideFilters,
): Promise<AdminGuideListResult> {
  const client = createAdminClient();
  const page = Math.max(1, filters.page);
  const from = (page - 1) * GUIDES_PAGE_SIZE;
  const to = from + GUIDES_PAGE_SIZE - 1;

  let query = client
    .from("guides")
    .select(ADMIN_GUIDE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.visibility === "public") query = query.eq("is_public", true);
  if (filters.visibility === "hidden") query = query.eq("is_public", false);

  const { data, error, count } = await query;
  if (error) throw error;

  const guides = (data ?? []) as Guide[];
  const guideIds = guides.map((guide) => guide.id);

  const itemCounts: Record<string, number> = {};
  if (guideIds.length > 0) {
    const items = await client
      .from("guide_items")
      .select("guide_id")
      .in("guide_id", guideIds);
    if (items.error) throw items.error;
    for (const row of items.data ?? []) {
      itemCounts[row.guide_id] = (itemCounts[row.guide_id] ?? 0) + 1;
    }
  }

  const total = count ?? 0;

  return {
    guides: guides.map((guide) => ({
      ...guide,
      itemCount: itemCounts[guide.id] ?? 0,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / GUIDES_PAGE_SIZE)),
  };
}

export async function getGuideAdmin(
  id: string,
): Promise<GuideWithItems | null> {
  const client = createAdminClient();
  const guide = await client
    .from("guides")
    .select(ADMIN_GUIDE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (guide.error) throw guide.error;
  if (!guide.data) return null;

  const guideRow = guide.data as Guide;

  const [items, comparisons] = await Promise.all([
    client
      .from("guide_items")
      .select(ADMIN_ITEM_COLUMNS)
      .eq("guide_id", id)
      .order("position"),
    getGuideRenderer(guideRow.type) === "comparison"
      ? client
          .from("guide_comparisons")
          .select(ADMIN_COMPARISON_COLUMNS)
          .eq("guide_id", id)
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

const EXPORT_ROW_LIMIT = 10_000;

export interface GuideExportResult {
  guides: Guide[];
  items: GuideItem[];
  comparisons: GuideComparisonPair[];
}

export async function listGuidesForExport(): Promise<GuideExportResult> {
  const client = createAdminClient();

  const guidesResult = await client
    .from("guides")
    .select(ADMIN_GUIDE_COLUMNS)
    .order("title")
    .range(0, EXPORT_ROW_LIMIT - 1);
  if (guidesResult.error) throw guidesResult.error;

  const itemsResult = await client
    .from("guide_items")
    .select(ADMIN_ITEM_COLUMNS)
    .order("guide_id")
    .order("position")
    .range(0, EXPORT_ROW_LIMIT - 1);
  if (itemsResult.error) throw itemsResult.error;

  const comparisonsResult = await client
    .from("guide_comparisons")
    .select(ADMIN_COMPARISON_COLUMNS)
    .order("guide_id")
    .order("position")
    .range(0, EXPORT_ROW_LIMIT - 1);
  if (comparisonsResult.error) throw comparisonsResult.error;

  return {
    guides: (guidesResult.data ?? []) as Guide[],
    items: (itemsResult.data ?? []) as GuideItem[],
    comparisons: (comparisonsResult.data ?? []) as GuideComparisonPair[],
  };
}

export async function isGuideSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const client = createAdminClient();
  let query = client.from("guides").select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
