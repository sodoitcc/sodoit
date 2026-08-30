import { createClient } from "@/lib/supabase/server";
import type { ExperienceCategory } from "@/lib/experiences/taxonomy";

export type BrowseCategory = Pick<
  ExperienceCategory,
  "id" | "slug" | "name" | "sort_order"
>;

export async function loadActiveBrowseCategories(): Promise<BrowseCategory[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("experience_categories")
    .select("id, slug, name, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []) as BrowseCategory[];
}

export function resolveCategoryId(
  categories: readonly BrowseCategory[],
  slug: string | null,
): string | null {
  if (!slug) return null;
  return categories.find((category) => category.slug === slug)?.id ?? null;
}
