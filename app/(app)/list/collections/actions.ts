"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/validation";
import { slugify, nextSlugCandidate } from "./slug";
import { loadCollectionSlugs } from "./data";
import {
  COLLECTION_DESCRIPTION_MAX_LENGTH,
  COLLECTION_NAME_MAX_LENGTH,
} from "./types";
import type { Visibility } from "./types";

const MAX_SLUG_ATTEMPTS = 8;

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function revalidateOwnerPaths(userId: string) {
  revalidatePath("/list");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle<{ username: string | null }>();

  if (profile?.username) {
    revalidatePath(`/u/${profile.username}/list`);
    revalidatePath(`/u/${profile.username}/collections/[slug]`, "page");
  }
}

function isValidName(name: string): boolean {
  return (
    name.trim().length > 0 && name.trim().length <= COLLECTION_NAME_MAX_LENGTH
  );
}

function isValidDescription(description: string | null): boolean {
  if (description === null) return true;
  return description.length <= COLLECTION_DESCRIPTION_MAX_LENGTH;
}

export async function createCollection(
  name: string,
): Promise<{ id: string; slug: string } | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const trimmedName = name.trim();
  if (!isValidName(trimmedName)) return null;

  const supabase = await createClient();
  const existingSlugs = new Set(await loadCollectionSlugs(userId));

  const base = slugify(trimmedName) || "collection";
  let slug = base;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    slug = nextSlugCandidate(base, attempt);
    if (!existingSlugs.has(slug)) break;
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, name: trimmedName, slug })
    .select("id, slug")
    .single();

  if (error || !data) return null;

  await revalidateOwnerPaths(userId);

  return data;
}

export interface ForkCollectionResult {
  id: string;
  slug: string;
  username: string;
}

export async function forkCollection(
  sourceCollectionId: string,
  name?: string,
): Promise<ForkCollectionResult | null> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(sourceCollectionId)) return null;

  const supabase = await createClient();

  const { data: source } = await supabase
    .from("collections")
    .select("id, user_id, name, visibility")
    .eq("id", sourceCollectionId)
    .maybeSingle();

  if (!source || source.visibility !== "public") return null;
  if (source.user_id === userId) return null;

  const trimmedName = name?.trim();
  const nameOverride =
    trimmedName && isValidName(trimmedName) ? trimmedName : null;

  const existingSlugs = new Set(await loadCollectionSlugs(userId));
  const base = slugify(nameOverride ?? source.name) || "collection";
  let slug = base;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    slug = nextSlugCandidate(base, attempt);
    if (!existingSlugs.has(slug)) break;
  }

  const { data, error } = await supabase.rpc("fork_collection", {
    p_source_collection_id: sourceCollectionId,
    p_slug: slug,
    p_name: nameOverride,
  });

  if (error || !data || data.length === 0) return null;

  await revalidateOwnerPaths(userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle<{ username: string | null }>();

  if (!profile?.username) return null;

  return { ...data[0], username: profile.username };
}

export async function renameCollection(
  collectionId: string,
  name: string,
): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(collectionId)) return;

  const trimmedName = name.trim();
  if (!isValidName(trimmedName)) return;

  const supabase = await createClient();

  await supabase
    .from("collections")
    .update({ name: trimmedName, updated_at: new Date().toISOString() })
    .eq("id", collectionId)
    .eq("user_id", userId);

  await revalidateOwnerPaths(userId);
}

export async function updateCollectionDescription(
  collectionId: string,
  description: string | null,
): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(collectionId)) return;

  const trimmed = description?.trim() || null;
  if (!isValidDescription(trimmed)) return;

  const supabase = await createClient();

  await supabase
    .from("collections")
    .update({ description: trimmed, updated_at: new Date().toISOString() })
    .eq("id", collectionId)
    .eq("user_id", userId);

  await revalidateOwnerPaths(userId);
}

export async function setCollectionVisibility(
  collectionId: string,
  visibility: Visibility,
): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(collectionId)) return;
  if (visibility !== "private" && visibility !== "public") return;

  const supabase = await createClient();

  await supabase
    .from("collections")
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq("id", collectionId)
    .eq("user_id", userId);

  await revalidateOwnerPaths(userId);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(collectionId)) return;

  const supabase = await createClient();

  await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  await revalidateOwnerPaths(userId);
}

export async function addExperienceToCollection(
  collectionId: string,
  experienceId: string,
): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(collectionId) || !UUID_RE.test(experienceId)) {
    return false;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("collection_items")
    .upsert(
      { collection_id: collectionId, experience_id: experienceId },
      { onConflict: "collection_id,experience_id", ignoreDuplicates: true },
    );

  if (error) return false;

  await revalidateOwnerPaths(userId);
  return true;
}

export async function removeExperienceFromCollection(
  collectionId: string,
  experienceId: string,
): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !UUID_RE.test(collectionId) || !UUID_RE.test(experienceId)) {
    return;
  }

  const supabase = await createClient();

  await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("experience_id", experienceId);

  await revalidateOwnerPaths(userId);
}

export async function setListVisibility(visibility: Visibility): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  if (visibility !== "private" && visibility !== "public") return;

  const supabase = await createClient();

  await supabase.from("user_list_settings").upsert(
    {
      user_id: userId,
      visibility,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  await revalidateOwnerPaths(userId);
}
