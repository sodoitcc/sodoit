"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadCompletedIds, loadExperiences } from "./data";
import {
  parseDifficultyFilter,
  parseExperienceType,
  parseLocationScope,
} from "./browse-filters";
import {
  loadActiveBrowseCategories,
  resolveCategoryId,
} from "./taxonomy-loader";
import { BROWSE_SORTS, type BrowseSort, type ListStatus } from "./types";
import type { BrowseResult } from "./data";
import { UUID_RE } from "@/lib/validation";
import { isEmailVerified } from "@/lib/auth/require-verified-user";

const STATUS_VALUES = ["all", "completed", "uncompleted"] as const;

export async function loadMoreExperiences(params: {
  q: string;
  category: string | null;
  type: string | null;
  difficulty: string | null;
  locationScope: string | null;
  status: string;
  sort: string;
  cursor: string | null;
}): Promise<BrowseResult> {
  const supabase = await createClient();

  const [
    categories,
    {
      data: { user },
    },
  ] = await Promise.all([
    loadActiveBrowseCategories(),
    supabase.auth.getUser(),
  ]);

  const categoryId = resolveCategoryId(categories, params.category);

  const type = parseExperienceType(params.type ?? undefined);
  const difficulty = parseDifficultyFilter(params.difficulty ?? undefined);
  const locationScope = parseLocationScope(params.locationScope ?? undefined);

  const status = STATUS_VALUES.includes(
    params.status as (typeof STATUS_VALUES)[number],
  )
    ? (params.status as (typeof STATUS_VALUES)[number])
    : "all";

  const sort: BrowseSort = BROWSE_SORTS.includes(params.sort as BrowseSort)
    ? (params.sort as BrowseSort)
    : "recommended";

  const completedIds = user ? await loadCompletedIds(user.id) : [];

  return loadExperiences(
    {
      q: params.q.trim().slice(0, 200),
      categoryId,
      type,
      difficulty,
      locationScope,
      status: user ? status : "all",
      sort,
      cursor: params.cursor,
    },
    completedIds,
  );
}

function revalidateListPaths(experienceId: string) {
  revalidatePath("/");
  revalidatePath("/list");
  revalidatePath(`/tasks/${experienceId}`);
  revalidatePath("/experiences/[slug]", "page");
  revalidatePath("/u/[username]", "page");
}

export async function setListStatus(experienceId: string, status: ListStatus) {
  if (
    !UUID_RE.test(experienceId) ||
    (status !== "saved" && status !== "completed")
  ) {
    return;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isEmailVerified(user)) return;

  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const existing = await supabase
    .from("user_lists")
    .select("experience_id")
    .eq("user_id", user.id)
    .eq("experience_id", experienceId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    const { error } = await supabase
      .from("user_lists")
      .update({ status, completed_at: completedAt })
      .eq("user_id", user.id)
      .eq("experience_id", experienceId);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("user_lists").insert({
      user_id: user.id,
      experience_id: experienceId,
      status,
      completed_at: completedAt,
    });

    if (error) throw new Error(error.message);
  }

  revalidateListPaths(experienceId);
}

export async function toggleCompletion(
  experienceId: string,
  currentlyCompleted: boolean,
) {
  if (currentlyCompleted) {
    await setListStatus(experienceId, "saved");
  } else {
    await setListStatus(experienceId, "completed");
  }
}

export async function removeFromMyList(experienceId: string) {
  if (!UUID_RE.test(experienceId)) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("user_lists")
    .delete()
    .eq("user_id", user.id)
    .eq("experience_id", experienceId);

  if (error) throw new Error(error.message);

  revalidateListPaths(experienceId);
}
