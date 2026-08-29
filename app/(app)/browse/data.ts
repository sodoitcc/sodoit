import { createClient } from "@/lib/supabase/server";
import { BATCH_SIZE, DIFFICULTIES } from "./types";
import type { Experience, StatusFilter, BrowseSort } from "./types";
import type { ExperienceDifficulty } from "@/lib/experiences/types";
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
  category: string | null;
  difficulty: string | null;
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
  { q, category, difficulty, status, sort, cursor }: BrowseQuery,
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

  if (category) {
    query = query.eq("category", category);
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
  { q, category, difficulty, status }: Omit<BrowseQuery, "sort" | "cursor">,
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

  if (category) {
    query = query.eq("category", category);
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

const CURATED_SECTIONS_DEF: { title: string; categories: string[] }[] = [
  { title: "Adventure picks", categories: ["Adventure"] },
  { title: "Food & skills", categories: ["Food", "Skills"] },
  { title: "Travel ideas", categories: ["Travel"] },
];

const CURATED_SECTION_LIMIT = 6;

export interface CuratedSection {
  title: string;
  category: string;
  items: Experience[];
}

export async function loadCuratedSections(): Promise<CuratedSection[]> {
  const supabase = await createClient();

  const results = await Promise.all(
    CURATED_SECTIONS_DEF.map(async ({ title, categories }) => {
      const { data } = await supabase
        .from("experiences")
        .select(EXPERIENCE_COLUMNS)
        .eq("is_public", true)
        .in("category", categories)
        .order("created_at", { ascending: false })
        .limit(CURATED_SECTION_LIMIT);

      return {
        title,
        category: categories[0],
        items: (data ?? []) as Experience[],
      };
    }),
  );

  return results.filter((section) => section.items.length > 0);
}
