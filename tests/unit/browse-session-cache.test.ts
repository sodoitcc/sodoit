import { describe, expect, it } from "vitest";
import {
  readBrowseCache,
  writeBrowseCache,
} from "@/lib/navigation/browse-session-cache";
import type { Experience } from "@/app/(app)/browse/types";

function fakeExperience(id: string): Experience {
  return {
    id,
    slug: id,
    title: id,
    description: null,
    category: null,
    difficulty: null,
    location_type: "global",
    country_code: null,
    city: null,
    featured: false,
    is_public: true,
    image_url: null,
    image_alt: null,
    saved_count: 0,
    completed_count: 0,
    why_it_matters: null,
    what_to_know: null,
    best_time: null,
    duration_text: null,
    location_note: null,
  };
}

describe("browse session cache", () => {
  it("returns undefined for a key that was never written", () => {
    expect(readBrowseCache("/?never-used")).toBeUndefined();
  });

  it("round-trips experiences, cursor, hasMore, and scrollY", () => {
    const state = {
      experiences: [fakeExperience("a"), fakeExperience("b")],
      cursor: "48",
      hasMore: true,
      scrollY: 4200,
    };

    writeBrowseCache("/?category=adventure", state);

    expect(readBrowseCache("/?category=adventure")).toEqual(state);
  });

  it("keeps different keys isolated", () => {
    writeBrowseCache("/?a", {
      experiences: [fakeExperience("a")],
      cursor: null,
      hasMore: false,
      scrollY: 10,
    });
    writeBrowseCache("/?b", {
      experiences: [fakeExperience("b")],
      cursor: null,
      hasMore: false,
      scrollY: 20,
    });

    expect(readBrowseCache("/?a")?.scrollY).toBe(10);
    expect(readBrowseCache("/?b")?.scrollY).toBe(20);
  });

  it("evicts the oldest entry once the cache exceeds its bound", () => {
    for (let i = 0; i < 9; i++) {
      writeBrowseCache(`/?evict-${i}`, {
        experiences: [],
        cursor: null,
        hasMore: false,
        scrollY: i,
      });
    }

    expect(readBrowseCache("/?evict-0")).toBeUndefined();
    expect(readBrowseCache("/?evict-8")).toBeDefined();
  });
});
