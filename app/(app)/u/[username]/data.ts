import { createClient } from "@/lib/supabase/server";
import type { AchievementStats } from "@/app/(app)/achievements/data";
import { loadAchievementDefinitions } from "@/app/(app)/achievements/queries";
import type { ProfileViewModel } from "./types";

interface ProfileRow {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ExperienceRow {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  image_alt: string | null;
}

interface CompletedRow {
  status: "saved" | "completed";
  experiences: ExperienceRow | ExperienceRow[] | null;
}

interface AchievementRow {
  achievement_id: string;
}

function toSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadProfile(
  username: string,
): Promise<ProfileViewModel | null> {
  const supabase = await createClient();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, created_at")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw new Error("Could not load profile.");
  if (!profileData) return null;

  const profile = profileData as ProfileRow;

  const [listResult, achievementsResult, definitions] = await Promise.all([
    supabase
      .from("user_lists")
      .select("status, experiences(id, title, category, image_url, image_alt)")
      .eq("user_id", profile.id),

    supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", profile.id),

    loadAchievementDefinitions(),
  ]);

  if (listResult.error || achievementsResult.error) {
    throw new Error("Could not load profile.");
  }

  const listRows = (listResult.data ?? []) as CompletedRow[];
  const achievementRows = (achievementsResult.data ?? []) as AchievementRow[];

  const savedCount = listRows.filter((row) => row.status === "saved").length;

  const completedExperiences = listRows
    .filter((row) => row.status === "completed")
    .map((row) => toSingle(row.experiences))
    .filter((experience): experience is ExperienceRow => experience !== null);

  const completedByCategory = new Map<string, number>();
  const categoriesCompleted = new Set<string>();

  for (const experience of completedExperiences) {
    if (!experience.category) continue;
    categoriesCompleted.add(experience.category);
    completedByCategory.set(
      experience.category,
      (completedByCategory.get(experience.category) ?? 0) + 1,
    );
  }

  const stats: AchievementStats = {
    totalCompleted: completedExperiences.length,
    categoriesCompleted,
    completedByCategory,
  };

  const earnedMilestoneIds = achievementRows.map((row) => row.achievement_id);
  const earnedAchievements = definitions.filter((definition) =>
    earnedMilestoneIds.includes(definition.id),
  );

  return {
    id: profile.id,
    username: profile.username ?? "User",
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    joinedAt: profile.created_at,
    completedCount: completedExperiences.length,
    savedCount,
    categoryCount: categoriesCompleted.size,
    achievementCount: earnedAchievements.length,
    recentCompleted: completedExperiences.slice(0, 5).map((experience) => ({
      id: experience.id,
      title: experience.title,
      category: experience.category,
      image_url: experience.image_url,
      image_alt: experience.image_alt,
    })),
    earnedMilestoneIds,
    earnedAchievements,
    achievementDefinitions: definitions,
    stats,
  };
}
