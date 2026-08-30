import { describe, expect, it } from "vitest";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Row {
  slug: string | null;
  is_public: boolean;
}

function audit(rows: Row[]) {
  const nullSlugs = rows.filter((row) => row.slug === null);
  const emptySlugs = rows.filter((row) => row.slug === "");
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (!row.slug) continue;
    seen.set(row.slug, (seen.get(row.slug) ?? 0) + 1);
  }
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
  const invalid = rows.filter(
    (row) => row.slug && !SLUG_RE.test(row.slug),
  );
  const unpublishedWithProblems = rows.filter(
    (row) => !row.is_public && (!row.slug || row.slug === ""),
  );

  return { nullSlugs, emptySlugs, duplicates, invalid, unpublishedWithProblems };
}

describe("Experience slug data quality", () => {
  it("flags null, empty, duplicate, and invalid slugs when present", () => {
    const result = audit([
      { slug: "valid-slug", is_public: true },
      { slug: null, is_public: true },
      { slug: "", is_public: true },
      { slug: "valid-slug", is_public: true },
      { slug: "Invalid Slug!", is_public: true },
      { slug: null, is_public: false },
    ]);

    expect(result.nullSlugs).toHaveLength(2);
    expect(result.emptySlugs).toHaveLength(1);
    expect(result.duplicates).toEqual([["valid-slug", 2]]);
    expect(result.invalid).toHaveLength(1);
    expect(result.unpublishedWithProblems).toHaveLength(1);
  });

  it("reports a clean dataset as clean", () => {
    const result = audit([
      { slug: "swim-with-whale-sharks", is_public: true },
      { slug: "hike-the-inca-trail", is_public: false },
    ]);

    expect(result.nullSlugs).toHaveLength(0);
    expect(result.emptySlugs).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
    expect(result.unpublishedWithProblems).toHaveLength(0);
  });
});
