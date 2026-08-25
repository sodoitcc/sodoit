"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SearchField } from "@/components/ui/SearchField";

const SEARCH_DEBOUNCE_MS = 300;

interface DiscoverySearchProps {
  q?: string;
  city: string | null;
  category?: string | null;
}

export function DiscoverySearch({
  q = "",
  city,
  category,
}: DiscoverySearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const isFirstRender = useRef(true);

  if (q !== prevQ) {
    setPrevQ(q);
    setSearch(q);
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();

      const trimmedSearch = search.trim();

      if (trimmedSearch) params.set("q", trimmedSearch);
      if (city) params.set("city", city);
      if (category) params.set("category", category);

      const query = params.toString();

      router.push(query ? `/discovery?${query}` : "/discovery");
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search, city, category, router]);

  return (
    <SearchField
      value={search}
      onChange={setSearch}
      placeholder="Search places, itineraries, and collections..."
      label="Search places, itineraries, and collections"
    />
  );
}
