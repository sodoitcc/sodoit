import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CollectionProvenance } from "./types";

interface SourceRow {
  id: string;
  slug: string;
  name: string;
  profiles: { username: string | null } | { username: string | null }[] | null;
}

function toSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadCollectionCopyCount(
  supabase: SupabaseClient,
  collectionId: string,
): Promise<number> {
  const { count } = await supabase
    .from("collections")
    .select("id", { count: "exact", head: true })
    .eq("forked_from_collection_id", collectionId);

  return count ?? 0;
}

export async function loadCollectionProvenance(
  supabase: SupabaseClient,
  forkedFromCollectionId: string | null,
): Promise<CollectionProvenance | null> {
  if (!forkedFromCollectionId) return null;

  const { data } = await supabase
    .from("collections")
    .select("id, slug, name, profiles(username)")
    .eq("id", forkedFromCollectionId)
    .maybeSingle<SourceRow>();

  if (!data) return { status: "hidden" };

  const profile = toSingle(data.profiles);
  if (!profile?.username) return { status: "hidden" };

  return {
    status: "public",
    sourceId: data.id,
    sourceSlug: data.slug,
    sourceName: data.name,
    sourceUsername: profile.username,
  };
}
