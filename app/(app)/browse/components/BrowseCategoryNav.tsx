"use client";

import { CategoryNav } from "@/components/ui";
import type { CategoryNavItem } from "@/components/ui";

interface BrowseCategoryNavProps {
  categories: readonly string[];
  category: string;
  onCategoryChange: (value: string) => void;
}

export function BrowseCategoryNav({
  categories,
  category,
  onCategoryChange,
}: BrowseCategoryNavProps) {
  const items: CategoryNavItem[] = categories.map((option) => ({
    key: option,
    label: option,
    active: option === category,
    onClick: () => onCategoryChange(option),
  }));

  return <CategoryNav items={items} ariaLabel="Categories" />;
}
