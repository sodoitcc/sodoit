import type { ExperienceLocationType } from "@/lib/experiences/types";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";

export type CategorySlug =
  | "places"
  | "adventure"
  | "fun-entertainment"
  | "food-drink"
  | "nature-outdoors"
  | "learn-create"
  | "wellness-active";

export type ProposalStatus = "high" | "medium" | "review";

export interface ProposalInput {
  title: string;
  category: string | null;
  locationType: ExperienceLocationType;
}

export interface Proposal {
  categorySlug: CategorySlug | null;
  experienceType: ExperienceType | null;
  locationScope: LocationScope | null;
  status: ProposalStatus;
}

interface KeywordRule {
  slug: CategorySlug;
  pattern: RegExp;
  experienceType: ExperienceType;
}

const KEYWORD_RULES: readonly KeywordRule[] = [
  {
    slug: "learn-create",
    pattern:
      /\b(class|lesson|workshop|course|pottery|painting|learn(ing)?|make|making)\b/i,
    experienceType: "skill",
  },
  {
    slug: "wellness-active",
    pattern:
      /\b(yoga|meditat\w*|run(ning)?|marathon|fitness|gym|workout|pilates|wellness|spa)\b/i,
    experienceType: "activity",
  },
  {
    slug: "adventure",
    pattern:
      /\b(skydiv\w*|bungee|raft(ing)?|safari|climb\w*|scuba|surf(ing)?|zipline|paraglid\w*|kayak\w*|hik(e|ing))\b/i,
    experienceType: "activity",
  },
  {
    slug: "fun-entertainment",
    pattern:
      /\b(karaoke|rodeo|casino|nightlife|concert|comedy|festival|arcade|show)\b/i,
    experienceType: "event",
  },
  {
    slug: "food-drink",
    pattern:
      /\b(food|tasting|restaurant|dinner|brunch|wine|beer|coffee|cuisine|dining|cook\w*)\b/i,
    experienceType: "activity",
  },
  {
    slug: "nature-outdoors",
    pattern:
      /\b(waterfall\w*|aurora|wildlife|mountain\w*|forest|volcano|glacier|stargaz\w*)\b/i,
    experienceType: "activity",
  },
];

const PLACE_NOUN_PATTERN =
  /\b(temple|tower|bridge|palace|castle|crossing|square|wall|pyramid|ruins|cathedral|museum|monument)\b/i;
const PLACE_VERB_PROPER_NOUN_PATTERN =
  /\b(?:[Vv]isit|[Cc]ross|[Ee]xplore|[Ss]ee)\s+[A-Z]/;

const LEGACY_CATEGORY_FALLBACK: Partial<Record<string, CategorySlug>> = {
  Adventure: "adventure",
  Fitness: "wellness-active",
  Food: "food-drink",
  Nature: "nature-outdoors",
  Skills: "learn-create",
  Travel: "places",
};

const LEGACY_CATEGORY_TYPE: Partial<Record<CategorySlug, ExperienceType>> = {
  places: "place",
  adventure: "activity",
  "fun-entertainment": "event",
  "food-drink": "activity",
  "nature-outdoors": "activity",
  "learn-create": "skill",
  "wellness-active": "activity",
};

function matchPlacesRule(title: string): KeywordRule | null {
  if (PLACE_VERB_PROPER_NOUN_PATTERN.test(title) || PLACE_NOUN_PATTERN.test(title)) {
    return { slug: "places", pattern: PLACE_NOUN_PATTERN, experienceType: "place" };
  }
  return null;
}

function matchKeywordRules(title: string): KeywordRule[] {
  const matches: KeywordRule[] = [];
  const placesMatch = matchPlacesRule(title);
  if (placesMatch) matches.push(placesMatch);

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(title)) matches.push(rule);
  }

  return matches;
}

function inferLocationScope(
  slug: CategorySlug,
  locationType: ExperienceLocationType,
  strictPlaceMatch: boolean,
): LocationScope {
  if (slug === "places" && strictPlaceMatch) return "specific_place";
  if (locationType === "city") return "city";
  if (locationType === "country") return "country";
  if (slug === "places") return "specific_place";
  return "anywhere";
}

export function generateProposal(input: ProposalInput): Proposal {
  const matches = matchKeywordRules(input.title);
  const distinctSlugs = new Set(matches.map((match) => match.slug));

  if (distinctSlugs.size > 1) {
    const first = matches[0];
    return {
      categorySlug: first.slug,
      experienceType: first.experienceType,
      locationScope: inferLocationScope(
        first.slug,
        input.locationType,
        first.slug === "places",
      ),
      status: "review",
    };
  }

  if (matches.length === 1) {
    const match = matches[0];
    return {
      categorySlug: match.slug,
      experienceType: match.experienceType,
      locationScope: inferLocationScope(
        match.slug,
        input.locationType,
        match.slug === "places",
      ),
      status: "high",
    };
  }

  const legacySlug = input.category
    ? LEGACY_CATEGORY_FALLBACK[input.category]
    : undefined;

  if (legacySlug) {
    return {
      categorySlug: legacySlug,
      experienceType: LEGACY_CATEGORY_TYPE[legacySlug] ?? null,
      locationScope: inferLocationScope(legacySlug, input.locationType, false),
      status: "medium",
    };
  }

  return {
    categorySlug: null,
    experienceType: null,
    locationScope: null,
    status: "review",
  };
}

export interface TaxonomyState {
  primaryCategoryId: string | null;
  experienceType: string | null;
  locationScope: string | null;
}

export function hasProposedChange(
  current: TaxonomyState,
  proposed: TaxonomyState,
): boolean {
  return (
    current.primaryCategoryId !== proposed.primaryCategoryId ||
    current.experienceType !== proposed.experienceType ||
    current.locationScope !== proposed.locationScope
  );
}

export function defaultSelected(
  status: ProposalStatus,
  hasChange: boolean,
): boolean {
  return hasChange && status === "high";
}
