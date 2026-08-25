"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveGuide, unsaveGuide } from "@/lib/guides/saved";
import { UUID_RE } from "@/lib/validation";

export async function saveGuideAction(guideId: string) {
  if (!UUID_RE.test(guideId)) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await saveGuide(supabase, user.id, guideId);

  revalidatePath("/guides");
}

export async function unsaveGuideAction(guideId: string) {
  if (!UUID_RE.test(guideId)) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await unsaveGuide(supabase, user.id, guideId);

  revalidatePath("/guides");
}
