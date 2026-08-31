"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { Button, EmptyState } from "@/components/ui";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import {
  readBrowseCache,
  writeBrowseCache,
} from "@/lib/navigation/browse-session-cache";
import {
  clearCurrentHistoryEntryScrollRestore,
  markCurrentHistoryEntryForScrollRestore,
  shouldRestoreCurrentHistoryEntry,
} from "@/lib/navigation/scroll-history";
import { loadMoreExperiences } from "../actions";
import type { BrowseSort, BrowseView, Experience } from "../types";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshotKey = `${pathname}?${searchParams.toString()}`;

  const [experiences, setExperiences] = useState(initialExperiences);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const [restoring, setRestoring] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const experiencesRef = useRef(experiences);
  const cursorRef = useRef(cursor);
  const hasMoreRef = useRef(hasMore);
  const restoringRef = useRef(true);
  const pendingScrollRef = useRef<number | null>(null);

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setExperiences(initialExperiences);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
    setError(false);
  }

  useEffect(() => {
    experiencesRef.current = experiences;
  }, [experiences]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    function captureExperienceNavigation(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>(
        'a[data-experience-link="true"]',
      );

      if (!link) return;

      writeBrowseCache(snapshotKey, {
        experiences: experiencesRef.current,
        cursor: cursorRef.current,
        hasMore: hasMoreRef.current,
        scrollY: window.scrollY,
      });

      markCurrentHistoryEntryForScrollRestore(snapshotKey);
    }

    document.addEventListener("click", captureExperienceNavigation, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("click", captureExperienceNavigation, true);
    };
  }, [snapshotKey]);

  useLayoutEffect(() => {
    function applyRestoreOrSettle() {
      if (!shouldRestoreCurrentHistoryEntry(snapshotKey)) {
        restoringRef.current = false;
        setRestoring(false);
        return;
      }

      const cached = readBrowseCache(snapshotKey);
      clearCurrentHistoryEntryScrollRestore();

      if (!cached) {
        restoringRef.current = false;
        setRestoring(false);
        return;
      }

      experiencesRef.current = cached.experiences;
      cursorRef.current = cached.cursor;
      hasMoreRef.current = cached.hasMore;
      pendingScrollRef.current = cached.scrollY;

      setExperiences(cached.experiences);
      setCursor(cached.cursor);
      setHasMore(cached.hasMore);
    }

    applyRestoreOrSettle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotKey]);

  useLayoutEffect(() => {
    if (pendingScrollRef.current === null) return;

    const target = pendingScrollRef.current;
    pendingScrollRef.current = null;

    window.scrollTo({ top: target, left: 0, behavior: "instant" });

    requestAnimationFrame(() => {
      window.scrollTo({ top: target, left: 0, behavior: "instant" });
      restoringRef.current = false;
      setRestoring(false);
    });
  }, [experiences]);

  async function loadMore() {
    if (loading || !hasMore || restoringRef.current) return;

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

      setExperiences((previous) => {
        const next = [...previous, ...result.experiences];
        experiencesRef.current = next;
        return next;
      });

      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (restoring || !hasMore || typeof IntersectionObserver === "undefined") {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [restoring, hasMore, cursor]);

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
        {(loading || restoring) && (
          <p className="text-xs text-muted">Loading more…</p>
        )}

        {error && (
          <>
            <p className="text-xs text-muted">
              Couldn&apos;t load more experiences.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMore()}
            >
              Retry
            </Button>
          </>
        )}

        {!restoring && !loading && !error && hasMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadMore()}
          >
            Load more
          </Button>
        )}

        {!restoring && !hasMore && (
          <p className="text-xs text-muted">You&apos;ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
