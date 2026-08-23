import { CATEGORIES } from "@/app/(app)/browse/types";
import { EXPERIENCE_DIFFICULTIES } from "@/lib/experiences/difficulty.mjs";
import { SLUG_RE } from "@/lib/admin/slug";

export const EXPERIENCE_TITLE_MAX = 120;
export const EXPERIENCE_DESCRIPTION_MAX = 2000;
export const EXPERIENCE_WHY_IT_MATTERS_MAX = 600;
export const DIFFICULTY_VALUES = EXPERIENCE_DIFFICULTIES;
export const LOCATION_TYPES = ["global", "country", "city"] as const;

export interface ExperienceInput {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  location_type: string;
  country_code: string;
  city: string;
  image_url: string;
  image_alt: string;
  featured: boolean;
  is_public: boolean;
  why_it_matters: string;
  what_to_know: string[];
  best_time: string;
  duration_text: string;
  location_note: string;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validateExperienceInput(input: ExperienceInput): string | null {
  if (!input.title) return "Title is required.";
  if (input.title.length > EXPERIENCE_TITLE_MAX)
    return `Title must be ${EXPERIENCE_TITLE_MAX} characters or fewer.`;

  if (!SLUG_RE.test(input.slug))
    return "Slug must be lowercase letters, numbers, and hyphens.";

  if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number]))
    return "Choose a valid category.";

  if (
    input.difficulty &&
    !DIFFICULTY_VALUES.includes(
      input.difficulty as (typeof DIFFICULTY_VALUES)[number],
    )
  )
    return "Choose a valid difficulty.";

  if (
    !LOCATION_TYPES.includes(
      input.location_type as (typeof LOCATION_TYPES)[number],
    )
  )
    return "Choose a valid location type.";

  if (input.location_type !== "global" && !input.country_code)
    return "Country is required for this location type.";

  if (input.country_code && !/^[A-Z]{2}$/.test(input.country_code))
    return "Country code must be 2 uppercase letters.";

  if (input.description.length > EXPERIENCE_DESCRIPTION_MAX)
    return `Description must be ${EXPERIENCE_DESCRIPTION_MAX} characters or fewer.`;

  if (input.image_url && !isValidUrl(input.image_url))
    return "Image URL must be a valid URL.";

  if (input.why_it_matters.length > EXPERIENCE_WHY_IT_MATTERS_MAX)
    return `Why it matters must be ${EXPERIENCE_WHY_IT_MATTERS_MAX} characters or fewer.`;

  return null;
}

function readLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function readExperienceInput(formData: FormData): ExperienceInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    difficulty: String(formData.get("difficulty") ?? ""),
    location_type: String(formData.get("location_type") ?? "global"),
    country_code: String(formData.get("country_code") ?? "")
      .trim()
      .toUpperCase(),
    city: String(formData.get("city") ?? "").trim(),
    image_url: String(formData.get("image_url") ?? "").trim(),
    image_alt: String(formData.get("image_alt") ?? "").trim(),
    featured: formData.get("featured") === "on",
    is_public: formData.get("is_public") === "on",
    why_it_matters: String(formData.get("why_it_matters") ?? "").trim(),
    what_to_know: readLines(formData.get("what_to_know")),
    best_time: String(formData.get("best_time") ?? "").trim(),
    duration_text: String(formData.get("duration_text") ?? "").trim(),
    location_note: String(formData.get("location_note") ?? "").trim(),
  };
}
