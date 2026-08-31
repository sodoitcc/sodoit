import type { Experience } from "@/app/(app)/browse/types";

export interface BrowseCachedState {
  experiences: Experience[];
  cursor: string | null;
  hasMore: boolean;
  scrollY: number;
}

const MAX_ENTRIES = 8;
const cache = new Map<string, BrowseCachedState>();

export function readBrowseCache(key: string): BrowseCachedState | undefined {
  return cache.get(key);
}

export function writeBrowseCache(key: string, state: BrowseCachedState): void {
  cache.delete(key);
  cache.set(key, state);

  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}
