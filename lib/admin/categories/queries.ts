import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExperienceCategory } from "@/lib/experiences/taxonomy";

export type AdminExperienceCategory = ExperienceCategory & {
  experience_count: number;
};

async function loadCategoryExperienceCounts(): Promise<Map<string, number>> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experiences")
    .select("primary_category_id")
    .not("primary_category_id", "is", null);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.primary_category_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export async function listCategoriesAdmin(): Promise<
  AdminExperienceCategory[]
> {
  const client = createAdminClient();
  const [{ data, error }, counts] = await Promise.all([
    client
      .from("experience_categories")
      .select("id, slug, name, description, icon, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    loadCategoryExperienceCounts(),
  ]);

  if (error) throw error;

  return (data ?? []).map((category) => ({
    ...category,
    experience_count: counts.get(category.id) ?? 0,
  })) as AdminExperienceCategory[];
}

export async function getCategoryAdmin(
  id: string,
): Promise<ExperienceCategory | null> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_categories")
    .select("id, slug, name, description, icon, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ExperienceCategory | null;
}

export async function isCategorySlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const client = createAdminClient();
  let query = client
    .from("experience_categories")
    .select("id")
    .eq("slug", slug)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
