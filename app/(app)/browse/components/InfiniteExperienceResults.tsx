"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { loadMoreExperiences } from "../actions";
import { Button, EmptyState } from "@/components/ui";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import type { BrowseView, BrowseSort, Experience } from "../types";
import { ExperienceResults } from "./ExperienceResults";

interface InfiniteExperienceResultsProps {
  initialExperiences: Experience[];
  initialCursor: string | null;
  initialHasMore: boolean;
  view: BrowseView;
  completed: Set<string>;
  onToggle: (id: string) => Promise<void>;
  saved: Set<string>;
  onSave: (id: string) => Promise<void>;
  onRemoveSaved: (id: string) => Promise<void>;
  guest: boolean;
  onGuestSave: () => void;
  q: string;
  category: string | null;
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
  status: string;
  sort: BrowseSort;
  resetKey: string;
  inlineContent?: ReactNode;
}

export function InfiniteExperienceResults({
  initialExperiences,
  initialCursor,
  initialHasMore,
  view,
  completed,
  onToggle,
  saved,
  onSave,
  onRemoveSaved,
  guest,
  onGuestSave,
  q,
  category,
  type,
  difficulty,
  locationScope,
  status,
  sort,
  resetKey,
  inlineContent,
}: InfiniteExperienceResultsProps) {
  const [experiences, setExperiences] = useState(initialExperiences);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const sentinelRef = useRef<HTMLDivElement>(null);

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setExperiences(initialExperiences);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
    setError(false);
  }

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(false);

    try {
      const result = await loadMoreExperiences({
        q,
        category,
        type,
        difficulty,
        locationScope,
        status,
        sort,
        cursor,
      });

      setExperiences((previous) => [...previous, ...result.experiences]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === "undefined") return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, cursor]);

  if (experiences.length === 0) {
    return (
      <EmptyState
        title="Nothing matches"
        description="Try a different search, category, or filter combination."
      />
    );
  }

  return (
    <div>
      <ExperienceResults
        experiences={experiences}
        view={view}
        completed={completed}
        onToggle={onToggle}
        saved={saved}
        onSave={onSave}
        onRemoveSaved={onRemoveSaved}
        guest={guest}
        onGuestSave={onGuestSave}
        inlineContent={inlineContent}
      />

      <div ref={sentinelRef} aria-hidden="true" />

      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-2.5 py-8"
      >
        {loading && <p className="text-xs text-muted">Loading more…</p>}

        {error && (
          <>
            <p className="text-xs text-muted">
              Couldn&apos;t load more experiences.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadMore}
            >
              Retry
            </Button>
          </>
        )}

        {!loading && !error && hasMore && (
          <Button type="button" variant="outline" size="sm" onClick={loadMore}>
            Load more
          </Button>
        )}

        {!hasMore && (
          <p className="text-xs text-muted">You&apos;ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
