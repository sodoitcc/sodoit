"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import { removeFromMyList, setListStatus } from "./actions";
import { isDefaultBrowseView, splitFeatured } from "./browse-editorial";
import { CATEGORIES } from "./types";
import type { BrowseSort, BrowseView, Experience, StatusFilter } from "./types";
import type { CuratedSection } from "./data";
import { BrowseEditorialContent } from "./components/BrowseEditorialContent";
import { BrowseHero } from "./components/BrowseHero";
import { BrowseSignupCta } from "./components/BrowseSignupCta";
import { BrowseToolbar } from "./components/BrowseToolbar";
import { InfiniteExperienceResults } from "./components/InfiniteExperienceResults";
import { useBrowseNavigation } from "./hooks/useBrowseNavigation";

const SEARCH_DEBOUNCE_MS = 300;
const ALL_CATEGORIES = ["All", ...CATEGORIES] as const;

interface BrowseBoardProps {
  experiences: Experience[];
  nextCursor: string | null;
  hasMore: boolean;
  completedIds: string[];
  signedIn: boolean;
  q: string;
  category: string | null;
  difficulty: string | null;
  status: StatusFilter;
  sort: BrowseSort;
  view: BrowseView;
  curatedSections: CuratedSection[];
  resultCount: number | null;
}

export function BrowseBoard({
  experiences,
  nextCursor,
  hasMore,
  completedIds,
  signedIn,
  q,
  category,
  difficulty,
  status,
  sort,
  view,
  curatedSections,
  resultCount,
}: BrowseBoardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [completed, setCompleted] = useState(() => new Set(completedIds));
  const [searchText, setSearchText] = useState(q);
  const firstSearchRender = useRef(true);

  const { navigate, clear } = useBrowseNavigation({
    q: searchText,
    category,
    difficulty,
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
    difficulty,
    status,
    sort,
  });

  const showEditorial = isDefaultView && view === "grid";

  const { featured, rest } = splitFeatured(experiences, showEditorial);

  const remainingExperiences = showEditorial ? rest : experiences;

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
      difficulty={difficulty}
      status={status}
      sort={sort}
      resetKey={[q, category, difficulty, status, sort].join("|")}
      inlineContent={signedIn ? undefined : <BrowseSignupCta compact />}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-4 sm:px-6 lg:px-8">
      <BrowseHero>
        <BrowseToolbar
          search={searchText}
          onSearchChange={setSearchText}
          categories={ALL_CATEGORIES}
          category={category ?? "All"}
          onCategoryChange={(next) =>
            navigate({
              category: next === "All" ? null : next,
            })
          }
          sort={sort}
          onSortChange={(next) =>
            navigate({
              sort: next,
            })
          }
          difficulty={difficulty}
          onDifficultyChange={(next) =>
            navigate({
              difficulty: next,
            })
          }
        />
      </BrowseHero>

      <div className="mt-6">
        {showEditorial ? (
          <>
            <BrowseEditorialContent
              featured={featured}
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
            <div className="mb-4 flex items-center justify-between gap-3">
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

            {results}
          </>
        )}
      </div>
    </div>
  );
}
