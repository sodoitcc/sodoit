"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { UUID_RE } from "@/lib/validation";
import { isTagSlugTaken } from "./queries";
import { readTagInput, validateTagInput } from "./validation";

export interface AdminActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function revalidateTagPaths(id?: string) {
  revalidatePath("/admin/tags");
  if (id) revalidatePath(`/admin/tags/${id}`);
}

export async function createExperienceTag(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readTagInput(formData);

  const validationError = validateTagInput(input);
  if (validationError) return { success: false, error: validationError };

  if (await isTagSlugTaken(input.slug)) {
    return { success: false, error: "That slug is already in use." };
  }

  const client = createAdminClient();
  const { data, error } = await client
    .from("experience_tags")
    .insert({
      slug: input.slug,
      name: input.name,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { success: false, error: "That slug is already in use." };
    return { success: false, error: "Could not create the tag." };
  }

  revalidateTagPaths(data.id);
  return { success: true, id: data.id };
}

export async function updateExperienceTag(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: "Invalid tag." };

  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const input = readTagInput(formData);

  const validationError = validateTagInput(input);
  if (validationError) return { success: false, error: validationError };

  const client = createAdminClient();
  const { error } = await client
    .from("experience_tags")
    .update({
      name: input.name,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq("id", id);

  if (error) return { success: false, error: "Could not update the tag." };

  revalidateTagPaths(id);
  return { success: true, id };
}
