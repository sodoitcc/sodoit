import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";

const ADMIN_LIST_COLUMNS =
  "id, title, slug, category, difficulty, location_type, country_code, city, featured, is_public, image_url, image_alt, description, created_at";

export const EXPERIENCES_PAGE_SIZE = 20;

export type AdminExperienceListItem = Pick<
  Experience,
  | "id"
  | "title"
  | "slug"
  | "category"
  | "difficulty"
  | "location_type"
  | "country_code"
  | "city"
  | "featured"
  | "is_public"
  | "image_url"
  | "image_alt"
  | "description"
> & { created_at: string };

export interface AdminExperienceFilters {
  q: string;
  category: string;
  difficulty: string;
  visibility: "all" | "public" | "hidden";
  featured: "all" | "true" | "false";
  page: number;
}

export interface AdminExperienceListResult {
  experiences: AdminExperienceListItem[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listExperiencesAdmin(
  filters: AdminExperienceFilters,
): Promise<AdminExperienceListResult> {
  const client = createAdminClient();
  const page = Math.max(1, filters.page);
  const from = (page - 1) * EXPERIENCES_PAGE_SIZE;
  const to = from + EXPERIENCES_PAGE_SIZE - 1;

  let query = client
    .from("experiences")
    .select(ADMIN_LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.visibility === "public") query = query.eq("is_public", true);
  if (filters.visibility === "hidden") query = query.eq("is_public", false);
  if (filters.featured === "true") query = query.eq("featured", true);
  if (filters.featured === "false") query = query.eq("featured", false);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;

  return {
    experiences: (data ?? []) as AdminExperienceListItem[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / EXPERIENCES_PAGE_SIZE)),
  };
}

export async function getExperienceAdmin(
  id: string,
): Promise<Experience | null> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experiences")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Experience | null;
}

const EXPORT_COLUMNS =
  "id, title, slug, description, category, difficulty, location_type, country_code, city, image_url, image_alt, why_it_matters, what_to_know, best_time, duration_text, location_note, featured, is_public";
const EXPORT_ROW_LIMIT = 10_000;

export type ExperienceExportItem = Pick<
  Experience,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "category"
  | "difficulty"
  | "location_type"
  | "country_code"
  | "city"
  | "image_url"
  | "image_alt"
  | "why_it_matters"
  | "what_to_know"
  | "best_time"
  | "duration_text"
  | "location_note"
  | "featured"
  | "is_public"
>;

export async function listExperiencesForExport(): Promise<
  ExperienceExportItem[]
> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experiences")
    .select(EXPORT_COLUMNS)
    .order("title")
    .range(0, EXPORT_ROW_LIMIT - 1);

  if (error) throw error;
  return (data ?? []) as ExperienceExportItem[];
}

export async function getExperienceTagIds(id: string): Promise<string[]> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_tag_assignments")
    .select("tag_id")
    .eq("experience_id", id);

  if (error) throw error;
  return (data ?? []).map((row) => row.tag_id as string);
}

export async function isExperienceSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const client = createAdminClient();
  let query = client.from("experiences").select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
