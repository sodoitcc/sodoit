"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { UUID_RE } from "@/lib/validation";
import { isCategorySlugTaken } from "./queries";
import { readCategoryInput, validateCategoryInput } from "./validation";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function revalidateCategoryPaths(id?: string) {
  revalidatePath("/admin/categories");
  if (id) revalidatePath(`/admin/categories/${id}`);
}

export async function createExperienceCategory(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readCategoryInput(formData);

  const validationError = validateCategoryInput(input);
  if (validationError) return { success: false, error: validationError };

  if (await isCategorySlugTaken(input.slug)) {
    return { success: false, error: "That slug is already in use." };
  }

  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_categories")
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description || null,
      icon: input.icon || null,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { success: false, error: "That slug is already in use." };
    return { success: false, error: "Could not create the category." };
  }

  revalidateCategoryPaths(data.id);
  return { success: true, id: data.id };
}

export async function updateExperienceCategory(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid category." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readCategoryInput(formData);

  const validationError = validateCategoryInput(input);
  if (validationError) return { success: false, error: validationError };

  const client = createAdminClient();
  const { error } = await client
    .from("experience_categories")
    .update({
      name: input.name,
      description: input.description || null,
      icon: input.icon || null,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq("id", id);

  if (error) return { success: false, error: "Could not update the category." };

  revalidateCategoryPaths(id);
  return { success: true, id };
}
