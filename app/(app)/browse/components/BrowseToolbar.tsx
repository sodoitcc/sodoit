"use client";

import { HeroToolbar } from "@/components/ui";
import { SearchField } from "@/components/ui/SearchField";
import { BrowseCategoryNav } from "./BrowseCategoryNav";
import type { BrowseCategory } from "../taxonomy-loader";

interface BrowseToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: BrowseCategory[];
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  searchAnchorId?: string;
  primarySearchEnabled?: boolean;
}

export function BrowseToolbar({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  searchAnchorId,
  primarySearchEnabled = true,
}: BrowseToolbarProps) {
  return (
    <HeroToolbar
      search={
        <div id={searchAnchorId} className="w-full">
          <SearchField
            value={search}
            onChange={onSearchChange}
            placeholder="Search ticks..."
            label="Search ticks"
            size="large"
            enableShortcut={primarySearchEnabled}
          />
        </div>
      }
    >
      <BrowseCategoryNav
        categories={categories}
        category={category}
        onCategoryChange={onCategoryChange}
      />
    </HeroToolbar>
  );
}
