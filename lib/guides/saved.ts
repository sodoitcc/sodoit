import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { UUID_RE } from "@/lib/validation";

type Client = SupabaseClient;

export async function isGuideSaved(
  supabase: Client,
  userId: string,
  guideId: string,
): Promise<boolean> {
  if (!UUID_RE.test(guideId)) return false;

  const { data, error } = await supabase
    .from("saved_guides")
    .select("guide_id")
    .eq("user_id", userId)
    .eq("guide_id", guideId)
    .maybeSingle();

  if (error) throw error;

  return data !== null;
}

export async function loadSavedGuideIds(
  supabase: Client,
  userId: string,
  guideIds: string[],
): Promise<Set<string>> {
  const validIds = guideIds.filter((id) => UUID_RE.test(id));
  if (validIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("saved_guides")
    .select("guide_id")
    .eq("user_id", userId)
    .in("guide_id", validIds);

  if (error) throw error;

  return new Set((data ?? []).map((row) => row.guide_id));
}

export async function saveGuide(
  supabase: Client,
  userId: string,
  guideId: string,
): Promise<void> {
  if (!UUID_RE.test(guideId)) return;

  const { error } = await supabase
    .from("saved_guides")
    .upsert(
      { user_id: userId, guide_id: guideId },
      { onConflict: "user_id,guide_id", ignoreDuplicates: true },
    );

  if (error) throw error;
}

export async function unsaveGuide(
  supabase: Client,
  userId: string,
  guideId: string,
): Promise<void> {
  if (!UUID_RE.test(guideId)) return;

  const { error } = await supabase
    .from("saved_guides")
    .delete()
    .eq("user_id", userId)
    .eq("guide_id", guideId);

  if (error) throw error;
}
