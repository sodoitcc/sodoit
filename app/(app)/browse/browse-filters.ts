import {
  EXPERIENCE_TYPES,
  LOCATION_SCOPES,
  type ExperienceType,
  type LocationScope,
} from "@/lib/experiences/taxonomy";
import { DIFFICULTIES } from "./types";

const DIFFICULTY_LABELS: readonly string[] = DIFFICULTIES.map((d) => d.label);

export interface TaxonomyFilters {
  categorySlug: string | null;
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
}

export function parseCategorySlug(value: string | undefined): string | null {
  return value ? value : null;
}

export function parseExperienceType(
  value: string | undefined,
): ExperienceType | null {
  if (!value) return null;
  return EXPERIENCE_TYPES.includes(value as ExperienceType)
    ? (value as ExperienceType)
    : null;
}

export function parseDifficultyFilter(
  value: string | undefined,
): string | null {
  if (!value) return null;
  return DIFFICULTY_LABELS.includes(value) ? value : null;
}

export function parseLocationScope(
  value: string | undefined,
): LocationScope | null {
  if (!value) return null;
  return LOCATION_SCOPES.includes(value as LocationScope)
    ? (value as LocationScope)
    : null;
}

export function parseTaxonomyFilters(params: {
  category?: string;
  type?: string;
  difficulty?: string;
  location?: string;
}): TaxonomyFilters {
  return {
    categorySlug: parseCategorySlug(params.category),
    type: parseExperienceType(params.type),
    difficulty: parseDifficultyFilter(params.difficulty),
    locationScope: parseLocationScope(params.location),
  };
}

export function countActiveTaxonomyFilters(filters: {
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
}): number {
  return [filters.type, filters.difficulty, filters.locationScope].filter(
    (value) => value !== null,
  ).length;
}

export const TYPE_LABELS: Record<ExperienceType, string> = {
  place: "Place",
  activity: "Activity",
  event: "Event",
  skill: "Skill",
  challenge: "Challenge",
};

export const LOCATION_LABELS: Record<LocationScope, string> = {
  anywhere: "Anywhere",
  country: "Country",
  city: "City",
  specific_place: "Specific place",
};

export const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  "fun-entertainment": "Fun",
  "nature-outdoors": "Nature",
  "learn-create": "Learn",
  "wellness-active": "Wellness",
};

export function categoryDisplayLabel(slug: string, name: string): string {
  return CATEGORY_DISPLAY_LABELS[slug] ?? name;
}
