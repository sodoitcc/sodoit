"use client";

import {
  Sparkles,
  Map,
  UtensilsCrossed,
  Trees,
  Users,
  Gem,
} from "lucide-react";

import { CategoryNav } from "@/components/ui";
import type { CategoryNavItem } from "@/components/ui";
import { discoveryUrl } from "@/lib/discovery/url";

export const DISCOVERY_CATEGORIES = [
  { slug: "for-you", label: "For You", icon: Sparkles },
  { slug: "itineraries", label: "Itineraries", icon: Map },
  { slug: "food", label: "Food & Drink", icon: UtensilsCrossed },
  { slug: "hidden-gems", label: "Hidden Gems", icon: Gem },
  { slug: "outdoors", label: "Outdoors", icon: Trees },
  { slug: "kids", label: "With Kids", icon: Users },
] as const;

export type DiscoveryCategorySlug =
  (typeof DISCOVERY_CATEGORIES)[number]["slug"];

interface DiscoveryCategoriesProps {
  city: string | null;
  activeCategory: DiscoveryCategorySlug | null;
}

export function DiscoveryCategories({
  city,
  activeCategory,
}: DiscoveryCategoriesProps) {
  const items: CategoryNavItem[] = DISCOVERY_CATEGORIES.map(
    ({ slug, label, icon }) => {
      const active =
        activeCategory === slug || (!activeCategory && slug === "for-you");

      return {
        key: slug,
        label,
        icon,
        active,
        href: discoveryUrl({
          city: city ?? undefined,
          category: slug === "for-you" ? undefined : slug,
        }),
      };
    },
  );

  return <CategoryNav items={items} ariaLabel="Discovery categories" />;
}
