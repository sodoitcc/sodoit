"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import type { BrowseSort, BrowseView, StatusFilter } from "../types";

export interface BrowseNavState {
  q: string;
  category: string | null;
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
  status: StatusFilter;
  sort: BrowseSort;
  view: BrowseView;
}

export function buildBrowseHref(state: BrowseNavState): string {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.type) params.set("type", state.type);
  if (state.difficulty) params.set("difficulty", state.difficulty);
  if (state.locationScope) params.set("location", state.locationScope);
  if (state.status !== "all") params.set("status", state.status);
  if (state.sort !== "recommended") params.set("sort", state.sort);
  if (state.view !== "grid") params.set("view", state.view);

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

export function useBrowseNavigation(state: BrowseNavState) {
  const router = useRouter();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const navigate = useCallback(
    (patch: Partial<BrowseNavState>) => {
      router.push(
        buildBrowseHref({
          ...stateRef.current,
          ...patch,
        }),
      );
    },
    [router],
  );

  const clear = useCallback(() => router.push("/"), [router]);

  return { navigate, clear };
}
