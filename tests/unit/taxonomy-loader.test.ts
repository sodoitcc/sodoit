import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { resolveCategoryId } from "../../app/(app)/browse/taxonomy-loader";
import type { BrowseCategory } from "../../app/(app)/browse/taxonomy-loader";

const CATEGORIES: BrowseCategory[] = [
  { id: "cat-1", slug: "places", name: "Places", sort_order: 1 },
  { id: "cat-2", slug: "adventure", name: "Adventure", sort_order: 2 },
];

describe("resolveCategoryId", () => {
  it("resolves a known slug to its id", () => {
    expect(resolveCategoryId(CATEGORIES, "adventure")).toBe("cat-2");
  });

  it("returns null for a null slug", () => {
    expect(resolveCategoryId(CATEGORIES, null)).toBeNull();
  });

  it("returns null for an unknown slug instead of throwing", () => {
    expect(resolveCategoryId(CATEGORIES, "not-a-real-category")).toBeNull();
  });

  it("returns null for an inactive/omitted category slug", () => {
    expect(resolveCategoryId([], "places")).toBeNull();
  });
});
