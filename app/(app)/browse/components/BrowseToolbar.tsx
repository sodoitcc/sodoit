"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { HeroToolbar } from "@/components/ui";
import { SearchField } from "@/components/ui/SearchField";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import type { BrowseSort } from "../types";
import { BROWSE_SORTS, SORT_LABELS } from "../types";
import { CONTROL_ACTIVE, CONTROL_BASE, CONTROL_IDLE } from "./BrowseChip";
import type { BrowseCategory } from "../taxonomy-loader";
import { BrowseCategoryNav } from "./BrowseCategoryNav";
import { BrowseFilters } from "./BrowseFilters";

interface BrowseToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: BrowseCategory[];
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  sort: BrowseSort;
  onSortChange: (value: BrowseSort) => void;
  type: ExperienceType | null;
  onTypeChange: (value: ExperienceType | null) => void;
  difficulty: string | null;
  onDifficultyChange: (value: string | null) => void;
  locationScope: LocationScope | null;
  onLocationScopeChange: (value: LocationScope | null) => void;
  activeFilterCount: number;
}

export function BrowseToolbar({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  type,
  onTypeChange,
  difficulty,
  onDifficultyChange,
  locationScope,
  onLocationScopeChange,
  activeFilterCount,
}: BrowseToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  function clearAll() {
    onTypeChange(null);
    onDifficultyChange(null);
    onLocationScopeChange(null);
  }

  return (
    <HeroToolbar
      search={
        <SearchField
          value={search}
          onChange={onSearchChange}
          className="w-full"
        />
      }
    >
      <BrowseCategoryNav
        categories={categories}
        category={category}
        onCategoryChange={onCategoryChange}
      />

      <select
        aria-label="Sort"
        value={sort}
        onChange={(event) => onSortChange(event.target.value as BrowseSort)}
        className={[CONTROL_BASE, CONTROL_IDLE, "px-2.5 sm:px-3"].join(" ")}
      >
        {BROWSE_SORTS.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </select>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-haspopup="dialog"
          className={[
            CONTROL_BASE,
            "px-3 sm:px-3.5",
            activeFilterCount > 0 ? CONTROL_ACTIVE : CONTROL_IDLE,
          ].join(" ")}
        >
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
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
          onClearAll={clearAll}
        />
      </div>
    </HeroToolbar>
  );
}
