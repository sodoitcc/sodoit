import { EXPERIENCE_DIFFICULTIES } from "@/lib/experiences/difficulty.mjs";
import type { Experience } from "@/lib/experiences/types";

export type { Experience } from "@/lib/experiences/types";

export type ExperienceCardData = Pick<
  Experience,
  | "id"
  | "slug"
  | "title"
  | "image_url"
  | "image_alt"
  | "difficulty"
  | "category"
  | "saved_count"
  | "location_type"
  | "city"
  | "country_code"
>;
export {
  EXPERIENCE_DIFFICULTIES,
  getDifficultyPresentation,
} from "@/lib/experiences/difficulty.mjs";
export type StatusFilter = "all" | "completed" | "uncompleted";
export type ListStatus = "saved" | "completed";
export type BrowseView = "grid" | "list";
export type BrowseSort = "recommended" | "newest" | "easy";

export const BROWSE_VIEWS: readonly BrowseView[] = ["grid", "list"];
export const BROWSE_SORTS: readonly BrowseSort[] = ["recommended", "newest"];
export const SORT_LABELS: Record<BrowseSort, string> = {
  recommended: "Recommended",
  newest: "Newest",
  easy: "Easy first",
};

export const BATCH_SIZE = 24;

export const CATEGORIES = [
  "Adventure",
  "Culture",
  "Fitness",
  "Food",
  "Lifestyle",
  "Mind",
  "Nature",
  "Skills",
  "Social",
  "Travel",
] as const;

export function hashString(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

export const DIFFICULTIES = EXPERIENCE_DIFFICULTIES.map((label) => ({
  label,
}));

export const THUMBNAIL_HUES = [
  "#FED7AA",
  "#BAE6FD",
  "#BBF7D0",
  "#E9D5FF",
  "#FECACA",
] as const;

export interface TaskMeta {
  difficulty: (typeof DIFFICULTIES)[number];
  thumbnail: (typeof THUMBNAIL_HUES)[number];
}

export function getTaskMeta(id: string): TaskMeta {
  const hash = hashString(id);
  const difficulty = DIFFICULTIES[hash % DIFFICULTIES.length];
  const thumbnail = THUMBNAIL_HUES[hash % THUMBNAIL_HUES.length];
  return { difficulty, thumbnail };
}

export function getDifficulty(
  id: string,
  stored?: string | null,
): (typeof DIFFICULTIES)[number] {
  if (stored) {
    const matched = DIFFICULTIES.find(
      (difficulty) => difficulty.label.toLowerCase() === stored.toLowerCase(),
    );

    if (matched) {
      return matched;
    }
  }

  return getTaskMeta(id).difficulty;
}
