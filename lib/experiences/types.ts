import type { EXPERIENCE_DIFFICULTIES } from "./difficulty.mjs";

export type ExperienceLocationType = "global" | "country" | "city";

export type ExperienceDifficulty =
  (typeof EXPERIENCE_DIFFICULTIES)[number] | null;

export interface Experience {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  difficulty: ExperienceDifficulty;
  location_type: ExperienceLocationType;
  country_code: string | null;
  city: string | null;
  featured: boolean;
  is_public: boolean;
  image_url: string | null;
  image_alt: string | null;
  saved_count: number;
  completed_count: number;
  why_it_matters: string | null;
  what_to_know: string[] | null;
  best_time: string | null;
  duration_text: string | null;
  location_note: string | null;
}
