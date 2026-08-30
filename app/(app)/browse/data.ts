import { createClient } from "@/lib/supabase/server";
import { BATCH_SIZE, DIFFICULTIES } from "./types";
import type { Experience, StatusFilter, BrowseSort } from "./types";
import type { ExperienceDifficulty } from "@/lib/experiences/types";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import { selectFeaturedExperienceId } from "./featured-rotation";

const EXPERIENCE_COLUMNS =
  "id, title, slug, description, category, difficulty, location_type, country_code, city, featured, is_public, image_url, image_alt, saved_count, completed_count";

const NONE_ID = "00000000-0000-0000-0000-000000000000";

export async function loadCompletedIds(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_lists")
    .select("experience_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  return (data ?? []).map((row) => row.experience_id);
}

export async function loadGrandTotal(): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true);

  return count ?? 0;
}

const DIFFICULTY_LABELS: readonly string[] = DIFFICULTIES.map((d) => d.label);

export interface BrowseQuery {
  q: string;
  categoryId: string | null;
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
  status: StatusFilter;
  sort: BrowseSort;
  cursor: string | null;
}

export interface BrowseResult {
  experiences: Experience[];
  nextCursor: string | null;
  hasMore: boolean;
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) return 0;
  const offset = Number.parseInt(cursor, 10);
  return Number.isFinite(offset) && offset >= 0 ? offset : 0;
}

export async function loadExperiences(
  {
    q,
    categoryId,
    type,
    difficulty,
    locationScope,
    status,
    sort,
    cursor,
  }: BrowseQuery,
  completedIds: string[],
): Promise<BrowseResult> {
  const supabase = await createClient();

  let query = supabase
    .from("experiences")
    .select(EXPERIENCE_COLUMNS)
    .eq("is_public", true);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (categoryId) {
    query = query.eq("primary_category_id", categoryId);
  }

  if (type) {
    query = query.eq("experience_type", type);
  }

  if (locationScope) {
    query = query.eq("location_scope", locationScope);
  }

  if (difficulty && DIFFICULTY_LABELS.includes(difficulty)) {
    query = query.eq("difficulty", difficulty as ExperienceDifficulty);
  }

  if (status === "completed") {
    query = query.in("id", completedIds.length > 0 ? completedIds : [NONE_ID]);
  } else if (status === "uncompleted" && completedIds.length > 0) {
    query = query.not("id", "in", `(${completedIds.join(",")})`);
  }

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "easy") {
    query = query
      .order("difficulty_rank", { ascending: true })
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  query = query.order("id", { ascending: false });

  const offset = decodeCursor(cursor);
  const { data } = await query.range(offset, offset + BATCH_SIZE);

  const rows = (data ?? []) as Experience[];
  const hasMore = rows.length > BATCH_SIZE;
  const experiences = hasMore ? rows.slice(0, BATCH_SIZE) : rows;

  return {
    experiences,
    nextCursor: hasMore ? String(offset + BATCH_SIZE) : null,
    hasMore,
  };
}

export async function loadExperiencesCount(
  {
    q,
    categoryId,
    type,
    difficulty,
    locationScope,
    status,
  }: Omit<BrowseQuery, "sort" | "cursor">,
  completedIds: string[],
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (categoryId) {
    query = query.eq("primary_category_id", categoryId);
  }

  if (type) {
    query = query.eq("experience_type", type);
  }

  if (locationScope) {
    query = query.eq("location_scope", locationScope);
  }

  if (difficulty && DIFFICULTY_LABELS.includes(difficulty)) {
    query = query.eq("difficulty", difficulty as ExperienceDifficulty);
  }

  if (status === "completed") {
    query = query.in("id", completedIds.length > 0 ? completedIds : [NONE_ID]);
  } else if (status === "uncompleted" && completedIds.length > 0) {
    query = query.not("id", "in", `(${completedIds.join(",")})`);
  }

  const { count } = await query;

  return count ?? 0;
}

const FEATURED_ELIGIBLE_DIFFICULTIES: ExperienceDifficulty[] = [
  "Easy",
  "Medium",
];

export async function loadFeaturedExperience(
  nowMs: number = Date.now(),
): Promise<Experience | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("experiences")
    .select("id, image_url")
    .eq("is_public", true)
    .in("difficulty", FEATURED_ELIGIBLE_DIFFICULTIES);

  const eligibleIds = (data ?? [])
    .filter(
      (row) =>
        typeof row.image_url === "string" && row.image_url.trim().length > 0,
    )
    .map((row) => row.id as string);

  const selectedId = selectFeaturedExperienceId(eligibleIds, nowMs);
  if (!selectedId) return null;

  const { data: row } = await supabase
    .from("experiences")
    .select(EXPERIENCE_COLUMNS)
    .eq("id", selectedId)
    .maybeSingle();

  return (row as Experience | null) ?? null;
}

const CURATED_SECTIONS_DEF: { title: string; categorySlugs: string[] }[] = [
  { title: "Adventure picks", categorySlugs: ["adventure"] },
  { title: "Food & skills", categorySlugs: ["food-drink", "learn-create"] },
  { title: "Travel ideas", categorySlugs: ["places"] },
];

const CURATED_SECTION_LIMIT = 6;

export interface CuratedSection {
  title: string;
  category: string;
  items: Experience[];
}

export async function loadCuratedSections(
  categories: readonly { id: string; slug: string }[],
): Promise<CuratedSection[]> {
  const supabase = await createClient();

  const results = await Promise.all(
    CURATED_SECTIONS_DEF.map(async ({ title, categorySlugs }) => {
      const categoryIds = categorySlugs
        .map((slug) => categories.find((c) => c.slug === slug)?.id)
        .filter((id): id is string => Boolean(id));

      if (categoryIds.length === 0) {
        return { title, category: categorySlugs[0], items: [] };
      }

      const { data } = await supabase
        .from("experiences")
        .select(EXPERIENCE_COLUMNS)
        .eq("is_public", true)
        .in("primary_category_id", categoryIds)
        .order("created_at", { ascending: false })
        .limit(CURATED_SECTION_LIMIT);

      return {
        title,
        category: categorySlugs[0],
        items: (data ?? []) as Experience[],
      };
    }),
  );

  return results.filter((section) => section.items.length > 0);
}
