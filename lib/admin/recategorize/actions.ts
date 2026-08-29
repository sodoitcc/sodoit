"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  validateRecategorizeUpdate,
  type RecategorizeUpdateInput,
} from "./validation";

export interface ApplyRecategorizationResult {
  success: boolean;
  error?: string;
  updatedCount?: number;
}

const MAX_BATCH_SIZE = 500;

export async function applyExperienceRecategorization(
  updates: RecategorizeUpdateInput[],
): Promise<ApplyRecategorizationResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  if (!Array.isArray(updates) || updates.length === 0) {
    return { success: false, error: "No rows selected to apply." };
  }

  if (updates.length > MAX_BATCH_SIZE) {
    return {
      success: false,
      error: `Select ${MAX_BATCH_SIZE} rows or fewer per apply.`,
    };
  }

  for (const update of updates) {
    const validationError = validateRecategorizeUpdate(update);
    if (validationError) return { success: false, error: validationError };
  }

  const client = createAdminClient();
  const { data, error } = await client.rpc(
    "apply_experience_recategorization",
    { updates },
  );

  if (error) {
    return { success: false, error: "Could not apply the changes." };
  }

  revalidatePath("/admin/experiences/recategorize");
  revalidatePath("/admin/experiences");

  return { success: true, updatedCount: data?.updated_count ?? updates.length };
}
