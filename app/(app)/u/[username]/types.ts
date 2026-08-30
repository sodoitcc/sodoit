import type {
  AchievementDefinition,
  AchievementStats,
} from "@/app/(app)/achievements/data";

export interface CompletedExperience {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  image_url: string | null;
  image_alt: string | null;
}

export interface ProfileViewModel {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  completedCount: number;
  savedCount: number;
  categoryCount: number;
  achievementCount: number;
  recentCompleted: CompletedExperience[];
  earnedMilestoneIds: string[];
  earnedAchievements: AchievementDefinition[];
  achievementDefinitions: AchievementDefinition[];
  stats: AchievementStats;
}
