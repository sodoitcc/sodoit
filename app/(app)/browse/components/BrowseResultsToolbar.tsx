"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import type { BrowseSort, BrowseView } from "../types";
import { BROWSE_SORTS, SORT_LABELS } from "../types";
import { BrowseFilters } from "./BrowseFilters";
import { ViewToggle } from "@/components/ui/ViewToggle";

interface BrowseResultsToolbarProps {
  heading: string;
  headingLevel?: "h2" | "p";
  sort: BrowseSort;
  onSortChange: (value: BrowseSort) => void;
  view: BrowseView;
  onViewChange: (value: BrowseView) => void;
  type: ExperienceType | null;
  onTypeChange: (value: ExperienceType | null) => void;
  difficulty: string | null;
  onDifficultyChange: (value: string | null) => void;
  locationScope: LocationScope | null;
  onLocationScopeChange: (value: LocationScope | null) => void;
  activeFilterCount: number;
  resultCount: number | null;
  onClearAll: () => void;
}

const CONTROL_CLASS = [
  "h-10 rounded-lg bg-surface-subtle",
  "text-sm font-medium text-secondary",
  "transition-colors",
  "hover:bg-surface-subtle/80 hover:text-ink",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
].join(" ");

export function BrowseResultsToolbar({
  heading,
  headingLevel = "h2",
  sort,
  onSortChange,
  view,
  onViewChange,
  type,
  onTypeChange,
  difficulty,
  onDifficultyChange,
  locationScope,
  onLocationScopeChange,
  activeFilterCount,
  resultCount,
  onClearAll,
}: BrowseResultsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {headingLevel === "h2" ? (
        <h2 className="text-lg font-semibold tracking-[-0.015em] text-ink">
          {heading}
        </h2>
      ) : (
        <p className="text-sm text-secondary" role="status" aria-live="polite">
          {heading}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <label className="relative min-w-0">
          <span className="sr-only">Sort</span>

          <select
            aria-label="Sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as BrowseSort)}
            className={[
              CONTROL_CLASS,
              "w-full appearance-none pl-3 pr-9 sm:w-auto",
            ].join(" ")}
          >
            {BROWSE_SORTS.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>

          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
          />
        </label>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className={[
              CONTROL_CLASS,
              "inline-flex items-center gap-2 px-3",
              filtersOpen || activeFilterCount > 0 ? "text-ink" : "",
            ].join(" ")}
          >
            <SlidersHorizontal
              aria-hidden="true"
              className={[
                "h-4 w-4",
                activeFilterCount > 0 ? "text-accent" : "text-muted",
              ].join(" ")}
            />

            <span>Filters</span>

            {activeFilterCount > 0 && (
              <span className="font-semibold text-accent">
                {activeFilterCount}
              </span>
            )}
          </button>

          <BrowseFilters
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            type={type}
            onTypeChange={onTypeChange}
            difficulty={difficulty}
            onDifficultyChange={onDifficultyChange}
            locationScope={locationScope}
            onLocationScopeChange={onLocationScopeChange}
            onClearAll={onClearAll}
            resultCount={resultCount}
          />
        </div>

        <ViewToggle view={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
