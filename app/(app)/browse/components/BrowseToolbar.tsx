"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { HeroToolbar } from "@/components/ui";
import { SearchField } from "@/components/ui/SearchField";
import type { BrowseSort } from "../types";
import { CONTROL_ACTIVE, CONTROL_BASE, CONTROL_IDLE } from "./BrowseChip";
import { BrowseCategoryNav } from "./BrowseCategoryNav";
import { BrowseFilters } from "./BrowseFilters";

interface BrowseToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: readonly string[];
  category: string;
  onCategoryChange: (value: string) => void;
  sort: BrowseSort;
  onSortChange: (value: BrowseSort) => void;
  difficulty: string | null;
  onDifficultyChange: (value: string | null) => void;
}

export function BrowseToolbar({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  difficulty,
  onDifficultyChange,
}: BrowseToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtersActive = difficulty !== null || sort !== "recommended";

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

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-haspopup="dialog"
          className={[
            CONTROL_BASE,
            "px-3 sm:px-3.5",
            filtersActive ? CONTROL_ACTIVE : CONTROL_IDLE,
          ].join(" ")}
        >
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
          Filters
        </button>

        <BrowseFilters
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          sort={sort}
          onSortChange={onSortChange}
          difficulty={difficulty}
          onDifficultyChange={onDifficultyChange}
        />
      </div>
    </HeroToolbar>
  );
}
