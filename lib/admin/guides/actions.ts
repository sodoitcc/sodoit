"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { slugify } from "@/lib/admin/slug";
import { UUID_RE } from "@/lib/validation";
import { isGuideSlugTaken } from "./queries";
import {
  readGuideInput,
  readGuideItemInput,
  readGuideComparisonInput,
  validateGuideInput,
  validateGuideItemInput,
  validateGuideComparisonInput,
  parseTags,
} from "./validation";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function toGuideRow(input: ReturnType<typeof readGuideInput>) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description || null,
    type: input.type,
    city: input.city,
    country_code: input.country_code,
    city_slug: input.city_slug || null,
    cover_image_url: input.cover_image_url || null,
    cover_image_alt: input.cover_image_alt || null,
    duration_label: input.duration_label || null,
    editorial_attribution: input.editorial_attribution || null,
    best_time: input.best_time || null,
    local_tip: input.local_tip || null,
    route_mode: input.route_mode || null,
    sort_order: input.sort_order,
    featured: input.featured,
    is_public: input.is_public,
  };
}

function revalidateGuidePaths(id?: string) {
  revalidatePath("/admin/guides");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/guides/${id}`);
}

function mapDbError(
  error: { code?: string; message: string },
  fallback: string,
) {
  if (error.code === "23505") return "That slug is already in use.";
  if (error.code === "23503") return "That city reference does not exist.";
  return fallback;
}

export async function createGuide(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readGuideInput(formData);
  input.slug = slugify(input.slug || input.title);

  const validationError = validateGuideInput(input);
  if (validationError) return { success: false, error: validationError };

  if (await isGuideSlugTaken(input.slug)) {
    return { success: false, error: "That slug is already in use." };
  }

  const client = createAdminClient();
  const { data, error } = await client
    .from("guides")
    .insert(toGuideRow(input))
    .select("id")
    .single();

  if (error)
    return {
      success: false,
      error: mapDbError(error, "Could not create the guide."),
    };

  revalidateGuidePaths(data.id);
  return { success: true, id: data.id };
}

export async function updateGuide(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid guide." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readGuideInput(formData);
  input.slug = slugify(input.slug || input.title);

  const validationError = validateGuideInput(input);
  if (validationError) return { success: false, error: validationError };

  if (await isGuideSlugTaken(input.slug, id)) {
    return { success: false, error: "That slug is already in use." };
  }

  const client = createAdminClient();
  const { error } = await client
    .from("guides")
    .update(toGuideRow(input))
    .eq("id", id);

  if (error)
    return {
      success: false,
      error: mapDbError(error, "Could not update the guide."),
    };

  revalidateGuidePaths(id);
  return { success: true, id };
}

export async function setGuideVisibility(
  id: string,
  isPublic: boolean,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid guide." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const client = createAdminClient();
  const { error } = await client
    .from("guides")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) return { success: false, error: "Could not update visibility." };

  revalidateGuidePaths(id);
  return { success: true, id };
}

export async function addGuideItem(
  guideId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId))
    return { success: false, error: "Invalid guide." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readGuideItemInput(formData);
  const validationError = validateGuideItemInput(input);
  if (validationError) return { success: false, error: validationError };

  const client = createAdminClient();
  const existing = await client
    .from("guide_items")
    .select("position")
    .eq("guide_id", guideId)
    .order("position", { ascending: false })
    .limit(1);

  if (existing.error)
    return { success: false, error: "Could not add the item." };

  const nextPosition = (existing.data?.[0]?.position ?? -1) + 1;

  const { error } = await client.from("guide_items").insert({
    guide_id: guideId,
    position: nextPosition,
    title: input.title,
    description: input.description || null,
    place_name: input.place_name || null,
    image_url: input.image_url || null,
    image_alt: input.image_alt || null,
    external_url: input.external_url || null,
    neighborhood: input.neighborhood || null,
    address: input.address || null,
    latitude: input.latitude ? Number(input.latitude) : null,
    longitude: input.longitude ? Number(input.longitude) : null,
    google_maps_url: input.google_maps_url || null,
    tags: parseTags(input.tags),
  });

  if (error) return { success: false, error: "Could not add the item." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

export async function updateGuideItem(
  guideId: string,
  itemId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId) || !UUID_RE.test(itemId))
    return { success: false, error: "Invalid guide item." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readGuideItemInput(formData);
  const validationError = validateGuideItemInput(input);
  if (validationError) return { success: false, error: validationError };

  const client = createAdminClient();
  const { error } = await client
    .from("guide_items")
    .update({
      title: input.title,
      description: input.description || null,
      place_name: input.place_name || null,
      image_url: input.image_url || null,
      image_alt: input.image_alt || null,
      external_url: input.external_url || null,
      neighborhood: input.neighborhood || null,
      address: input.address || null,
      latitude: input.latitude ? Number(input.latitude) : null,
      longitude: input.longitude ? Number(input.longitude) : null,
      google_maps_url: input.google_maps_url || null,
      tags: parseTags(input.tags),
    })
    .eq("id", itemId)
    .eq("guide_id", guideId);

  if (error) return { success: false, error: "Could not update the item." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

export async function deleteGuideItem(
  guideId: string,
  itemId: string,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId) || !UUID_RE.test(itemId))
    return { success: false, error: "Invalid guide item." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const client = createAdminClient();
  const { error } = await client
    .from("guide_items")
    .delete()
    .eq("id", itemId)
    .eq("guide_id", guideId);

  if (error) return { success: false, error: "Could not remove the item." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

export async function moveGuideItem(
  guideId: string,
  itemId: string,
  direction: "up" | "down",
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId) || !UUID_RE.test(itemId))
    return { success: false, error: "Invalid guide item." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const client = createAdminClient();
  const items = await client
    .from("guide_items")
    .select("id, position")
    .eq("guide_id", guideId)
    .order("position");

  if (items.error) return { success: false, error: "Could not reorder items." };

  const ordered = items.data ?? [];
  const index = ordered.findIndex((item) => item.id === itemId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= ordered.length) {
    return { success: true, id: guideId };
  }

  const current = ordered[index];
  const swap = ordered[swapIndex];
  const tempPosition = Math.max(...ordered.map((item) => item.position)) + 1;

  const step1 = await client
    .from("guide_items")
    .update({ position: tempPosition })
    .eq("id", current.id);
  if (step1.error) return { success: false, error: "Could not reorder items." };

  const step2 = await client
    .from("guide_items")
    .update({ position: current.position })
    .eq("id", swap.id);
  if (step2.error) return { success: false, error: "Could not reorder items." };

  const step3 = await client
    .from("guide_items")
    .update({ position: swap.position })
    .eq("id", current.id);
  if (step3.error) return { success: false, error: "Could not reorder items." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

function toComparisonRow(input: ReturnType<typeof readGuideComparisonInput>) {
  return {
    skip_title: input.skip_title,
    skip_description: input.skip_description || null,
    skip_neighborhood: input.skip_neighborhood || null,
    skip_address: input.skip_address || null,
    skip_latitude: input.skip_latitude ? Number(input.skip_latitude) : null,
    skip_longitude: input.skip_longitude ? Number(input.skip_longitude) : null,
    skip_google_maps_url: input.skip_google_maps_url || null,
    skip_external_url: input.skip_external_url || null,
    skip_tags: parseTags(input.skip_tags),
    go_instead_title: input.go_instead_title,
    go_instead_description: input.go_instead_description || null,
    go_instead_neighborhood: input.go_instead_neighborhood || null,
    go_instead_address: input.go_instead_address || null,
    go_instead_latitude: input.go_instead_latitude
      ? Number(input.go_instead_latitude)
      : null,
    go_instead_longitude: input.go_instead_longitude
      ? Number(input.go_instead_longitude)
      : null,
    go_instead_google_maps_url: input.go_instead_google_maps_url || null,
    go_instead_external_url: input.go_instead_external_url || null,
    go_instead_tags: parseTags(input.go_instead_tags),
    reason: input.reason || null,
  };
}

export async function addGuideComparison(
  guideId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId))
    return { success: false, error: "Invalid guide." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readGuideComparisonInput(formData);
  const validationError = validateGuideComparisonInput(input);
  if (validationError) return { success: false, error: validationError };

  const client = createAdminClient();
  const existing = await client
    .from("guide_comparisons")
    .select("position")
    .eq("guide_id", guideId)
    .order("position", { ascending: false })
    .limit(1);

  if (existing.error)
    return { success: false, error: "Could not add the comparison." };

  const nextPosition = (existing.data?.[0]?.position ?? -1) + 1;

  const { error } = await client.from("guide_comparisons").insert({
    guide_id: guideId,
    position: nextPosition,
    ...toComparisonRow(input),
  });

  if (error) return { success: false, error: "Could not add the comparison." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

export async function updateGuideComparison(
  guideId: string,
  comparisonId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId) || !UUID_RE.test(comparisonId))
    return { success: false, error: "Invalid comparison." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readGuideComparisonInput(formData);
  const validationError = validateGuideComparisonInput(input);
  if (validationError) return { success: false, error: validationError };

  const client = createAdminClient();
  const { error } = await client
    .from("guide_comparisons")
    .update(toComparisonRow(input))
    .eq("id", comparisonId)
    .eq("guide_id", guideId);

  if (error)
    return { success: false, error: "Could not update the comparison." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

export async function deleteGuideComparison(
  guideId: string,
  comparisonId: string,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId) || !UUID_RE.test(comparisonId))
    return { success: false, error: "Invalid comparison." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const client = createAdminClient();
  const { error } = await client
    .from("guide_comparisons")
    .delete()
    .eq("id", comparisonId)
    .eq("guide_id", guideId);

  if (error)
    return { success: false, error: "Could not remove the comparison." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}

export async function moveGuideComparison(
  guideId: string,
  comparisonId: string,
  direction: "up" | "down",
): Promise<AdminActionResult> {
  if (!UUID_RE.test(guideId) || !UUID_RE.test(comparisonId))
    return { success: false, error: "Invalid comparison." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const client = createAdminClient();
  const comparisons = await client
    .from("guide_comparisons")
    .select("id, position")
    .eq("guide_id", guideId)
    .order("position");

  if (comparisons.error)
    return { success: false, error: "Could not reorder comparisons." };

  const ordered = comparisons.data ?? [];
  const index = ordered.findIndex((row) => row.id === comparisonId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= ordered.length) {
    return { success: true, id: guideId };
  }

  const current = ordered[index];
  const swap = ordered[swapIndex];
  const tempPosition = Math.max(...ordered.map((row) => row.position)) + 1;

  const step1 = await client
    .from("guide_comparisons")
    .update({ position: tempPosition })
    .eq("id", current.id);
  if (step1.error)
    return { success: false, error: "Could not reorder comparisons." };

  const step2 = await client
    .from("guide_comparisons")
    .update({ position: current.position })
    .eq("id", swap.id);
  if (step2.error)
    return { success: false, error: "Could not reorder comparisons." };

  const step3 = await client
    .from("guide_comparisons")
    .update({ position: swap.position })
    .eq("id", current.id);
  if (step3.error)
    return { success: false, error: "Could not reorder comparisons." };

  revalidateGuidePaths(guideId);
  return { success: true, id: guideId };
}
