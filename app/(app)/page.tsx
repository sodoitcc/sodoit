import { createClient } from "@/lib/supabase/server";
import { BrowseBoard } from "./browse/BrowseBoard";
import {
  loadExperiences,
  loadExperiencesCount,
  loadCompletedIds,
  loadCuratedSections,
  loadFeaturedExperience,
} from "./browse/data";
import { isDefaultBrowseView } from "./browse/browse-editorial";
import {
  BROWSE_SORTS,
  BROWSE_VIEWS,
  CATEGORIES,
  DIFFICULTIES,
} from "./browse/types";
import type { BrowseSort, BrowseView, StatusFilter } from "./browse/types";

const STATUS_VALUES: StatusFilter[] = ["all", "completed", "uncompleted"];
const CATEGORY_VALUES: readonly string[] = CATEGORIES;
const DIFFICULTY_VALUES: readonly string[] = DIFFICULTIES.map((d) => d.label);

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    status?: string;
    sort?: string;
    view?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const q = (params.q ?? "").trim().slice(0, 200);

  const category =
    params.category && CATEGORY_VALUES.includes(params.category)
      ? params.category
      : null;

  const difficulty =
    params.difficulty && DIFFICULTY_VALUES.includes(params.difficulty)
      ? params.difficulty
      : null;

  const sort: BrowseSort = BROWSE_SORTS.includes(params.sort as BrowseSort)
    ? (params.sort as BrowseSort)
    : "recommended";

  const view: BrowseView = BROWSE_VIEWS.includes(params.view as BrowseView)
    ? (params.view as BrowseView)
    : "grid";

  const status: StatusFilter = STATUS_VALUES.includes(
    params.status as StatusFilter,
  )
    ? (params.status as StatusFilter)
    : "all";

  const completedIds = user ? await loadCompletedIds(user.id) : [];
  const effectiveStatus: StatusFilter = user ? status : "all";
  const isDefaultView = isDefaultBrowseView({
    q,
    category,
    difficulty,
    status: effectiveStatus,
    sort,
  });

  const showEditorial = isDefaultView && view === "grid";

  const [
    { experiences, nextCursor, hasMore },
    curatedSections,
    resultCount,
    featured,
  ] = await Promise.all([
    loadExperiences(
      {
        q,
        category,
        difficulty,
        status: effectiveStatus,
        sort,
        cursor: null,
      },
      completedIds,
    ),
    !user && isDefaultView ? loadCuratedSections() : Promise.resolve([]),
    isDefaultView
      ? Promise.resolve(null)
      : loadExperiencesCount(
          { q, category, difficulty, status: effectiveStatus },
          completedIds,
        ),
    showEditorial ? loadFeaturedExperience() : Promise.resolve(null),
  ]);

  return (
    <BrowseBoard
      experiences={experiences}
      nextCursor={nextCursor}
      hasMore={hasMore}
      completedIds={completedIds}
      signedIn={Boolean(user)}
      q={q}
      category={category}
      difficulty={difficulty}
      status={effectiveStatus}
      sort={sort}
      view={view}
      curatedSections={curatedSections}
      resultCount={resultCount}
      featured={featured}
    />
  );
}
