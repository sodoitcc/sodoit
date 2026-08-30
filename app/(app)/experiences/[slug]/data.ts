import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ExperienceLocationType } from "@/lib/experiences/types";

export interface ExperienceDetail {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  difficulty: string | null;
  image_url: string | null;
  image_alt: string | null;
  location_type: ExperienceLocationType;
  city: string | null;
  country_code: string | null;
  saved_count: number;
  why_it_matters: string | null;
  what_to_know: string[] | null;
  best_time: string | null;
  duration_text: string | null;
  location_note: string | null;
}

const COLUMNS = [
  "id",
  "slug",
  "title",
  "category",
  "description",
  "difficulty",
  "image_url",
  "image_alt",
  "location_type",
  "city",
  "country_code",
  "saved_count",
  "why_it_matters",
  "what_to_know",
  "best_time",
  "duration_text",
  "location_note",
].join(", ");

export const loadExperienceBySlug = cache(
  async (slug: string): Promise<ExperienceDetail | null> => {
    if (!slug) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("experiences")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle<ExperienceDetail>();

    return data ?? null;
  },
);
