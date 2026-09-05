"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { slugify } from "@/lib/admin/slug";
import { UUID_RE } from "@/lib/validation";
import { isExperienceSlugTaken } from "./queries";
import { readExperienceInput, validateExperienceInput } from "./validation";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

async function resolveCategoryName(
  client: AdminClient,
  categoryId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("experience_categories")
    .select("name")
    .eq("id", categoryId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return null;
  return (data?.name as string | undefined) ?? null;
}

async function syncExperienceTags(
  client: AdminClient,
  experienceId: string,
  tagIds: string[],
): Promise<boolean> {
  const { error: deleteError } = await client
    .from("experience_tag_assignments")
    .delete()
    .eq("experience_id", experienceId);

  if (deleteError) return false;
  if (tagIds.length === 0) return true;

  const { error: insertError } = await client
    .from("experience_tag_assignments")
    .insert(
      tagIds.map((tagId) => ({ experience_id: experienceId, tag_id: tagId })),
    );

  return !insertError;
}

function toRow(
  input: ReturnType<typeof readExperienceInput>,
  categoryName: string,
  categoryId: string,
) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description || null,
    category: categoryName,
    primary_category_id: categoryId,
    difficulty: input.difficulty || null,
    location_type: input.location_type,
    country_code: input.country_code || null,
    city: input.city || null,
    image_url: input.image_url || null,
    image_alt: input.image_alt || null,
    why_it_matters: input.why_it_matters || null,
    what_to_know: input.what_to_know.length > 0 ? input.what_to_know : null,
    best_time: input.best_time || null,
    duration_text: input.duration_text || null,
    location_note: input.location_note || null,
    featured: input.featured,
    is_public: input.is_public,
  };
}

function revalidateExperiencePaths(id?: string) {
  revalidatePath("/admin/experiences");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/experiences/${id}`);
}

export async function createExperience(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readExperienceInput(formData);
  input.slug = slugify(input.slug || input.title);

  const validationError = validateExperienceInput(input);
  if (validationError) return { success: false, error: validationError };

  if (await isExperienceSlugTaken(input.slug)) {
    return { success: false, error: "That slug is already in use." };
  }

  const client = createAdminClient();

  const categoryName = await resolveCategoryName(
    client,
    input.primary_category_id ?? "",
  );
  if (!categoryName)
    return { success: false, error: "Choose a valid category." };

  const { data, error } = await client
    .from("experiences")
    .insert(toRow(input, categoryName, input.primary_category_id ?? ""))
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { success: false, error: "That slug is already in use." };
    return { success: false, error: "Could not create the experience." };
  }

  if (!(await syncExperienceTags(client, data.id, input.tag_ids ?? []))) {
    return { success: false, error: "Could not save the selected tags." };
  }

  revalidateExperiencePaths(data.id);
  return { success: true, id: data.id };
}

export async function updateExperience(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(id))
    return { success: false, error: "Invalid experience." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readExperienceInput(formData);
  input.slug = slugify(input.slug || input.title);

  const validationError = validateExperienceInput(input);
  if (validationError) return { success: false, error: validationError };

  if (await isExperienceSlugTaken(input.slug, id)) {
    return { success: false, error: "That slug is already in use." };
  }

  const client = createAdminClient();

  const categoryName = await resolveCategoryName(
    client,
    input.primary_category_id ?? "",
  );
  if (!categoryName)
    return { success: false, error: "Choose a valid category." };

  const { error } = await client
    .from("experiences")
    .update(toRow(input, categoryName, input.primary_category_id ?? ""))
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { success: false, error: "That slug is already in use." };
    return { success: false, error: "Could not update the experience." };
  }

  if (!(await syncExperienceTags(client, id, input.tag_ids ?? []))) {
    return { success: false, error: "Could not save the selected tags." };
  }

  revalidateExperiencePaths(id);
  return { success: true, id };
}

export async function setExperienceVisibility(
  id: string,
  isPublic: boolean,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(id))
    return { success: false, error: "Invalid experience." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const client = createAdminClient();
  const { error } = await client
    .from("experiences")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) return { success: false, error: "Could not update visibility." };

  revalidateExperiencePaths(id);
  return { success: true, id };
}
