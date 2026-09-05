import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExperienceTag } from "@/lib/experiences/taxonomy";

export type AdminExperienceTag = ExperienceTag & {
  experience_count: number;
};

async function loadTagAssignmentCounts(): Promise<Map<string, number>> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_tag_assignments")
    .select("tag_id");

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.tag_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export async function listTagsAdmin(): Promise<AdminExperienceTag[]> {
  const client = createAdminClient();
  const [{ data, error }, counts] = await Promise.all([
    client
      .from("experience_tags")
      .select("id, slug, name, is_active, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
    loadTagAssignmentCounts(),
  ]);

  if (error) throw error;

  return (data ?? []).map((tag) => ({
    ...tag,
    experience_count: counts.get(tag.id) ?? 0,
  })) as AdminExperienceTag[];
}

export async function listActiveTags(): Promise<ExperienceTag[]> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_tags")
    .select("id, slug, name, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ExperienceTag[];
}

export async function getTagAdmin(id: string): Promise<ExperienceTag | null> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_tags")
    .select("id, slug, name, is_active, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ExperienceTag | null;
}

export async function isTagSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const client = createAdminClient();
  let query = client
    .from("experience_tags")
    .select("id")
    .eq("slug", slug)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
