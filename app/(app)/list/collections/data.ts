import { createClient } from "@/lib/supabase/server";
import type { Experience } from "@/app/(app)/browse/types";
import type { Collection, Visibility } from "./types";

interface CollectionRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  collection_items: { count: number }[];
}

interface CoverImageRow {
  collection_id: string;
  position: number;
  experiences:
    { image_url: string | null } | { image_url: string | null }[] | null;
}

async function loadCollectionCoverImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  collectionIds: string[],
): Promise<Map<string, string[]>> {
  if (collectionIds.length === 0) return new Map();

  const { data } = await supabase
    .from("collection_items")
    .select("collection_id, position, experiences(image_url)")
    .in("collection_id", collectionIds)
    .order("position", { ascending: true });

  const map = new Map<string, string[]>();

  for (const row of (data ?? []) as CoverImageRow[]) {
    const experience = Array.isArray(row.experiences)
      ? (row.experiences[0] ?? null)
      : row.experiences;
    const imageUrl = experience?.image_url;
    if (!imageUrl) continue;

    const current = map.get(row.collection_id) ?? [];
    if (current.length >= 4) continue;

    current.push(imageUrl);
    map.set(row.collection_id, current);
  }

  return map;
}

export async function loadCollections(userId: string): Promise<Collection[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("collections")
    .select("id, slug, name, description, visibility, collection_items(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as CollectionRow[];
  const coverImages = await loadCollectionCoverImages(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    itemCount: row.collection_items[0]?.count ?? 0,
    coverImages: coverImages.get(row.id) ?? [],
  }));
}

export async function loadPublicCollections(
  userId: string,
): Promise<Collection[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("collections")
    .select("id, slug, name, description, visibility, collection_items(count)")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  return ((data ?? []) as CollectionRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    itemCount: row.collection_items[0]?.count ?? 0,
  }));
}

export async function loadCollectionSlugs(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("collections")
    .select("slug")
    .eq("user_id", userId);

  return (data ?? []).map((row) => row.slug as string);
}

interface CollectionItemRow {
  experiences: Experience | Experience[] | null;
}

function toExperience(
  value: Experience | Experience[] | null,
): Experience | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const EXPERIENCE_COLUMNS =
  "id, title, slug, description, category, difficulty, location_type, country_code, city, featured, is_public, image_url, image_alt, saved_count, completed_count";

export async function loadCollectionBySlug(
  ownerId: string,
  slug: string,
): Promise<{ collection: Collection; experiences: Experience[] } | null> {
  const supabase = await createClient();

  const { data: collectionRow } = await supabase
    .from("collections")
    .select(`id, slug, name, description, visibility, collection_items(count)`)
    .eq("user_id", ownerId)
    .eq("slug", slug)
    .maybeSingle<CollectionRow>();

  if (!collectionRow) return null;

  const { data: itemRows } = await supabase
    .from("collection_items")
    .select(`experiences(${EXPERIENCE_COLUMNS})`)
    .eq("collection_id", collectionRow.id)
    .order("added_at", { ascending: false });

  const experiences = ((itemRows ?? []) as CollectionItemRow[])
    .map((row) => toExperience(row.experiences))
    .filter((experience): experience is Experience => experience !== null);

  return {
    collection: {
      id: collectionRow.id,
      slug: collectionRow.slug,
      name: collectionRow.name,
      description: collectionRow.description,
      visibility: collectionRow.visibility,
      itemCount: collectionRow.collection_items[0]?.count ?? 0,
    },
    experiences,
  };
}

export async function loadCollectionMembership(
  userId: string,
  experienceIds: string[],
): Promise<Map<string, Set<string>>> {
  if (experienceIds.length === 0) return new Map();

  const supabase = await createClient();

  const { data } = await supabase
    .from("collection_items")
    .select("collection_id, experience_id, collections!inner(user_id)")
    .eq("collections.user_id", userId)
    .in("experience_id", experienceIds);

  const membership = new Map<string, Set<string>>();

  for (const row of (data ?? []) as {
    collection_id: string;
    experience_id: string;
  }[]) {
    const set = membership.get(row.experience_id) ?? new Set<string>();
    set.add(row.collection_id);
    membership.set(row.experience_id, set);
  }

  return membership;
}

export async function loadListVisibility(userId: string): Promise<Visibility> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_list_settings")
    .select("visibility")
    .eq("user_id", userId)
    .maybeSingle<{ visibility: Visibility }>();

  return data?.visibility ?? "private";
}

interface PublicListProfile {
  id: string;
  username: string;
}

export async function loadPublicList(username: string): Promise<{
  profile: PublicListProfile;
  visibility: Visibility;
  saved: Experience[];
  completed: Experience[];
} | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle<PublicListProfile>();

  if (!profile) return null;

  const visibility = await loadListVisibility(profile.id);

  if (visibility !== "public") {
    return { profile, visibility, saved: [], completed: [] };
  }

  const { data: rows } = await supabase
    .from("user_lists")
    .select(`status, experiences(${EXPERIENCE_COLUMNS})`)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const saved: Experience[] = [];
  const completed: Experience[] = [];

  for (const row of (rows ?? []) as {
    status: "saved" | "completed";
    experiences: Experience | Experience[] | null;
  }[]) {
    const experience = toExperience(row.experiences);
    if (!experience) continue;
    if (row.status === "saved") saved.push(experience);
    else completed.push(experience);
  }

  return { profile, visibility, saved, completed };
}
