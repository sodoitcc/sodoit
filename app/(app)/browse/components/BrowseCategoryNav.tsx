"use client";

import { CategoryNav } from "@/components/ui";
import type { CategoryNavItem } from "@/components/ui";
import { categoryDisplayLabel } from "../browse-filters";
import type { BrowseCategory } from "../taxonomy-loader";

interface BrowseCategoryNavProps {
  categories: BrowseCategory[];
  category: string | null;
  onCategoryChange: (slug: string | null) => void;
}

export function BrowseCategoryNav({
  categories,
  category,
  onCategoryChange,
}: BrowseCategoryNavProps) {
  const items: CategoryNavItem[] = [
    {
      key: "all",
      label: "All",
      active: category === null,
      onClick: () => onCategoryChange(null),
    },
    ...categories.map((option) => ({
      key: option.slug,
      label: categoryDisplayLabel(option.slug, option.name),
      active: option.slug === category,
      onClick: () => onCategoryChange(option.slug),
    })),
  ];

  return <CategoryNav items={items} ariaLabel="Categories" />;
}
