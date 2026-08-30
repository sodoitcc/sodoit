"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import { removeFromMyList, setListStatus } from "./actions";
import { isDefaultBrowseView } from "./browse-editorial";
import { countActiveTaxonomyFilters } from "./browse-filters";
import type { BrowseCategory } from "./taxonomy-loader";
import type { BrowseSort, BrowseView, Experience, StatusFilter } from "./types";
import type { CuratedSection } from "./data";
import { ActiveFilterSummary } from "./components/ActiveFilterSummary";
import { BrowseEditorialContent } from "./components/BrowseEditorialContent";
import { BrowseHero } from "./components/BrowseHero";
import { BrowseSignupCta } from "./components/BrowseSignupCta";
import { BrowseToolbar } from "./components/BrowseToolbar";
import { InfiniteExperienceResults } from "./components/InfiniteExperienceResults";
import { useBrowseNavigation } from "./hooks/useBrowseNavigation";

const SEARCH_DEBOUNCE_MS = 300;

interface BrowseBoardProps {
  experiences: Experience[];
  nextCursor: string | null;
  hasMore: boolean;
  completedIds: string[];
  signedIn: boolean;
  q: string;
  categories: BrowseCategory[];
  category: string | null;
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
  status: StatusFilter;
  sort: BrowseSort;
  view: BrowseView;
  curatedSections: CuratedSection[];
  resultCount: number | null;
  featured: Experience | null;
}

export function BrowseBoard({
  experiences,
  nextCursor,
  hasMore,
  completedIds,
  signedIn,
  q,
  categories,
  category,
  type,
  difficulty,
  locationScope,
  status,
  sort,
  view,
  curatedSections,
  resultCount,
  featured,
}: BrowseBoardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [completed, setCompleted] = useState(() => new Set(completedIds));
  const [searchText, setSearchText] = useState(q);
  const firstSearchRender = useRef(true);

  const { navigate, clear } = useBrowseNavigation({
    q: searchText,
    category,
    type,
    difficulty,
    locationScope,
    status,
    sort,
    view,
  });

  useEffect(() => {
    if (firstSearchRender.current) {
      firstSearchRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      navigate({ q: searchText });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchText, navigate]);

  async function toggle(id: string) {
    if (!signedIn) {
      router.push(loginHrefWithNext(pathname));
      return;
    }

    const wasDone = completed.has(id);

    setCompleted((current) => {
      const next = new Set(current);

      if (wasDone) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

    try {
      if (wasDone) {
        await removeFromMyList(id);
      } else {
        await setListStatus(id, "completed");
      }
    } catch (error) {
      setCompleted((current) => {
        const next = new Set(current);

        if (wasDone) {
          next.add(id);
        } else {
          next.delete(id);
        }

        return next;
      });

      throw error;
    }
  }

  function requireLogin() {
    router.push(loginHrefWithNext(pathname));
  }

  const isDefaultView = isDefaultBrowseView({
    q,
    category,
    type,
    difficulty,
    locationScope,
    status,
    sort,
  });

  const showEditorial = isDefaultView && view === "grid";
  const activeFeatured = showEditorial ? featured : null;

  const remainingExperiences = activeFeatured
    ? experiences.filter((experience) => experience.id !== activeFeatured.id)
    : experiences;

  const activeFilterCount = countActiveTaxonomyFilters({
    type,
    difficulty,
    locationScope,
  });

  const results = (
    <InfiniteExperienceResults
      initialExperiences={remainingExperiences}
      initialCursor={nextCursor}
      initialHasMore={hasMore}
      view={view}
      completed={completed}
      onToggle={toggle}
      guest={!signedIn}
      onGuestSave={requireLogin}
      q={q}
      category={category}
      type={type}
      difficulty={difficulty}
      locationScope={locationScope}
      status={status}
      sort={sort}
      resetKey={[
        q,
        category,
        type,
        difficulty,
        locationScope,
        status,
        sort,
      ].join("|")}
      inlineContent={signedIn ? undefined : <BrowseSignupCta compact />}
    />
  );

  return (
    <>
      <BrowseHero>
        <BrowseToolbar
          search={searchText}
          onSearchChange={setSearchText}
          categories={categories}
          category={category}
          onCategoryChange={(next) => navigate({ category: next })}
          sort={sort}
          onSortChange={(next) => navigate({ sort: next })}
          type={type}
          onTypeChange={(next) => navigate({ type: next })}
          difficulty={difficulty}
          onDifficultyChange={(next) => navigate({ difficulty: next })}
          locationScope={locationScope}
          onLocationScopeChange={(next) => navigate({ locationScope: next })}
          activeFilterCount={activeFilterCount}
        />
      </BrowseHero>

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mt-4 sm:mt-6">
          {showEditorial ? (
            <>
              <BrowseEditorialContent
                featured={activeFeatured}
                curatedSections={curatedSections}
                completed={completed}
                signedIn={signedIn}
                onToggle={toggle}
                onGuestSave={requireLogin}
              />

              <section className="mt-10">
                <h2 className="mb-4 text-base font-bold tracking-[-0.01em] text-ink">
                  Explore experiences
                </h2>

                {results}
              </section>
            </>
          ) : isDefaultView ? (
            results
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p
                    className="text-sm text-secondary"
                    role="status"
                    aria-live="polite"
                  >
                    {resultCount === null
                      ? null
                      : `${resultCount} ${
                          resultCount === 1 ? "result" : "results"
                        }`}
                  </p>

                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs font-semibold text-accent-dark hover:text-accent"
                  >
                    Clear filters
                  </button>
                </div>

                <ActiveFilterSummary
                  type={type}
                  difficulty={difficulty}
                  locationScope={locationScope}
                  onRemoveType={() => navigate({ type: null })}
                  onRemoveDifficulty={() => navigate({ difficulty: null })}
                  onRemoveLocationScope={() =>
                    navigate({ locationScope: null })
                  }
                />
              </div>

              {results}
            </>
          )}
        </div>
      </div>
    </>
  );
}
