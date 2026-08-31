import { getCurrentUser } from "@/lib/auth/current-user";
import { BrowseBoard } from "./browse/BrowseBoard";
import {
  loadExperiences,
  loadExperiencesCount,
  loadCompletedIds,
  loadSavedIds,
  loadCuratedSections,
  loadFeaturedExperience,
} from "./browse/data";
import { isDefaultBrowseView } from "./browse/browse-editorial";
import { parseTaxonomyFilters } from "./browse/browse-filters";
import {
  loadActiveBrowseCategories,
  resolveCategoryId,
} from "./browse/taxonomy-loader";
import { BROWSE_SORTS, BROWSE_VIEWS } from "./browse/types";
import type { BrowseSort, BrowseView, StatusFilter } from "./browse/types";

const STATUS_VALUES: StatusFilter[] = ["all", "completed", "uncompleted"];

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    location?: string;
    status?: string;
    sort?: string;
    view?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  const user = await getCurrentUser();

  const q = (params.q ?? "").trim().slice(0, 200);

  const { categorySlug, type, difficulty, locationScope } =
    parseTaxonomyFilters(params);

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

  const categories = await loadActiveBrowseCategories();
  const categoryId = resolveCategoryId(categories, categorySlug);
  const resolvedCategorySlug = categoryId ? categorySlug : null;

  const [completedIds, savedIds] = user
    ? await Promise.all([loadCompletedIds(user.id), loadSavedIds(user.id)])
    : [[], []];
  const effectiveStatus: StatusFilter = user ? status : "all";
  const isDefaultView = isDefaultBrowseView({
    q,
    category: resolvedCategorySlug,
    type,
    difficulty,
    locationScope,
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
        categoryId,
        type,
        difficulty,
        locationScope,
        status: effectiveStatus,
        sort,
        cursor: null,
      },
      completedIds,
    ),
    !user && isDefaultView
      ? loadCuratedSections(categories)
      : Promise.resolve([]),
    isDefaultView
      ? Promise.resolve(null)
      : loadExperiencesCount(
          {
            q,
            categoryId,
            type,
            difficulty,
            locationScope,
            status: effectiveStatus,
          },
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
      savedIds={savedIds}
      signedIn={Boolean(user)}
      q={q}
      categories={categories}
      category={resolvedCategorySlug}
      type={type}
      difficulty={difficulty}
      locationScope={locationScope}
      status={effectiveStatus}
      sort={sort}
      view={view}
      curatedSections={curatedSections}
      resultCount={resultCount}
      featured={featured}
    />
  );
}
