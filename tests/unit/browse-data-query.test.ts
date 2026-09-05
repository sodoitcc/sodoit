import { describe, expect, it, vi } from "vitest";

interface Row {
  [key: string]: unknown;
}

function makeQuery(allRows: Row[]) {
  let data = [...allRows];

  const builder = {
    select() {
      return builder;
    },
    eq(col: string, val: unknown) {
      data = data.filter((row) => row[col] === val);
      return builder;
    },
    ilike(col: string, pattern: string) {
      const needle = pattern.replace(/%/g, "").toLowerCase();
      data = data.filter((row) =>
        String(row[col] ?? "")
          .toLowerCase()
          .includes(needle),
      );
      return builder;
    },
    in(col: string, vals: unknown[]) {
      data = data.filter((row) => vals.includes(row[col]));
      return builder;
    },
    not() {
      return builder;
    },
    order() {
      return builder;
    },
    range(from: number, to: number) {
      return Promise.resolve({ data: data.slice(from, to + 1), error: null });
    },
  };

  return builder;
}

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { loadExperiences } from "@/app/(app)/browse/data";

function experienceRow(overrides: Partial<Row>): Row {
  return {
    id: "exp-1",
    title: "Title",
    slug: "title",
    description: null,
    category: null,
    difficulty: "Easy",
    location_type: "global",
    country_code: null,
    city: null,
    featured: false,
    is_public: true,
    image_url: "https://cdn.example/img.jpg",
    image_alt: null,
    saved_count: 0,
    completed_count: 0,
    primary_category_id: null,
    experience_type: null,
    location_scope: null,
    ...overrides,
  };
}

function rankTier(row: Row, q: string): number {
  const title = String(row.title ?? "").toLowerCase();
  const needle = q.toLowerCase();
  if (title === needle) return 5;
  if (title.startsWith(needle)) return 4;
  if (title.includes(needle)) return 3;
  const category = String(row.category ?? "").toLowerCase();
  const tags = (row.tags as string[] | undefined) ?? [];
  if (
    category.includes(needle) ||
    tags.some((t) => t.toLowerCase().includes(needle))
  ) {
    return 2;
  }
  const description = String(row.description ?? "").toLowerCase();
  const content = String(row.content ?? "").toLowerCase();
  if (description.includes(needle) || content.includes(needle)) return 1;
  return 0;
}

function setupFakeClient(rows: Row[]) {
  const client = {
    from() {
      return makeQuery(rows);
    },
    rpc(fn: string, params: Record<string, unknown>) {
      const q = String(params.p_q ?? "");
      const matches = rows
        .filter((row) => rankTier(row, q) > 0)
        .filter(
          (row) => !params.p_type || row.experience_type === params.p_type,
        )
        .filter(
          (row) =>
            !params.p_category_id ||
            row.primary_category_id === params.p_category_id,
        )
        .sort((a, b) => rankTier(b, q) - rankTier(a, q));

      if (fn === "search_experiences_count") {
        return Promise.resolve({ data: matches.length, error: null });
      }

      const offset = (params.p_offset as number) ?? 0;
      const limit = (params.p_limit as number) ?? matches.length;
      return Promise.resolve({
        data: matches.slice(offset, offset + limit),
        error: null,
      });
    },
  };
  createClientMock.mockResolvedValue(client);
}

const BASE_QUERY = {
  q: "",
  categoryId: null,
  type: null,
  difficulty: null,
  locationScope: null,
  status: "all" as const,
  sort: "recommended" as const,
  cursor: null,
};

describe("loadExperiences — taxonomy filtering", () => {
  it("All includes both classified and unclassified public experiences", async () => {
    setupFakeClient([
      experienceRow({ id: "classified", primary_category_id: "cat-1" }),
      experienceRow({ id: "unclassified", primary_category_id: null }),
    ]);

    const result = await loadExperiences(BASE_QUERY, []);
    const ids = result.experiences.map((e) => e.id);
    expect(ids).toContain("classified");
    expect(ids).toContain("unclassified");
  });

  it("selecting a category filters by primary_category_id and excludes unclassified rows", async () => {
    setupFakeClient([
      experienceRow({ id: "in-category", primary_category_id: "cat-1" }),
      experienceRow({ id: "other-category", primary_category_id: "cat-2" }),
      experienceRow({ id: "unclassified", primary_category_id: null }),
    ]);

    const result = await loadExperiences(
      { ...BASE_QUERY, categoryId: "cat-1" },
      [],
    );
    const ids = result.experiences.map((e) => e.id);
    expect(ids).toEqual(["in-category"]);
  });

  it("filters by experience_type", async () => {
    setupFakeClient([
      experienceRow({ id: "activity-1", experience_type: "activity" }),
      experienceRow({ id: "place-1", experience_type: "place" }),
    ]);

    const result = await loadExperiences(
      { ...BASE_QUERY, type: "activity" },
      [],
    );
    expect(result.experiences.map((e) => e.id)).toEqual(["activity-1"]);
  });

  it("filters by location_scope", async () => {
    setupFakeClient([
      experienceRow({ id: "anywhere-1", location_scope: "anywhere" }),
      experienceRow({ id: "city-1", location_scope: "city" }),
    ]);

    const result = await loadExperiences(
      { ...BASE_QUERY, locationScope: "city" },
      [],
    );
    expect(result.experiences.map((e) => e.id)).toEqual(["city-1"]);
  });

  it("combines category, type, difficulty, and location filters", async () => {
    setupFakeClient([
      experienceRow({
        id: "match",
        primary_category_id: "cat-1",
        experience_type: "activity",
        difficulty: "Medium",
        location_scope: "country",
      }),
      experienceRow({
        id: "wrong-type",
        primary_category_id: "cat-1",
        experience_type: "place",
        difficulty: "Medium",
        location_scope: "country",
      }),
      experienceRow({
        id: "wrong-category",
        primary_category_id: "cat-2",
        experience_type: "activity",
        difficulty: "Medium",
        location_scope: "country",
      }),
    ]);

    const result = await loadExperiences(
      {
        ...BASE_QUERY,
        categoryId: "cat-1",
        type: "activity",
        difficulty: "Medium",
        locationScope: "country",
      },
      [],
    );
    expect(result.experiences.map((e) => e.id)).toEqual(["match"]);
  });

  it("returns an empty result set for a filter combination with no matches", async () => {
    setupFakeClient([
      experienceRow({ id: "only-one", primary_category_id: "cat-1" }),
    ]);

    const result = await loadExperiences(
      { ...BASE_QUERY, categoryId: "cat-does-not-exist" },
      [],
    );
    expect(result.experiences).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});

describe("loadExperiences — search relevance", () => {
  it("exact title match outranks a content-only match", async () => {
    setupFakeClient([
      experienceRow({
        id: "content-only",
        title: "Prague Weekend",
        content: "great for a hike",
      }),
      experienceRow({ id: "exact", title: "hike" }),
    ]);

    const result = await loadExperiences({ ...BASE_QUERY, q: "hike" }, []);
    expect(result.experiences.map((e) => e.id)).toEqual([
      "exact",
      "content-only",
    ]);
  });

  it("title prefix ranks above title contains", async () => {
    setupFakeClient([
      experienceRow({ id: "contains", title: "A Coffee Tasting Tour" }),
      experienceRow({ id: "prefix", title: "Coffee Roasting Basics" }),
    ]);

    const result = await loadExperiences({ ...BASE_QUERY, q: "coffee" }, []);
    expect(result.experiences.map((e) => e.id)).toEqual(["prefix", "contains"]);
  });

  it("tag/category matches are searchable and rank above content-only matches", async () => {
    setupFakeClient([
      experienceRow({
        id: "content-only",
        title: "Prague Weekend",
        content: "mentions kayak once",
      }),
      experienceRow({ id: "tagged", title: "Lake Day", tags: ["kayak"] }),
    ]);

    const result = await loadExperiences({ ...BASE_QUERY, q: "kayak" }, []);
    expect(result.experiences.map((e) => e.id)).toEqual([
      "tagged",
      "content-only",
    ]);
  });

  it("content-only matches still appear in results", async () => {
    setupFakeClient([
      experienceRow({
        id: "content-only",
        title: "Prague Weekend",
        description: "a scenic hike route",
      }),
    ]);

    const result = await loadExperiences({ ...BASE_QUERY, q: "hike" }, []);
    expect(result.experiences.map((e) => e.id)).toEqual(["content-only"]);
  });

  it("combines search with other filters", async () => {
    setupFakeClient([
      experienceRow({
        id: "match",
        title: "Hike the Dolomites",
        experience_type: "activity",
      }),
      experienceRow({
        id: "wrong-type",
        title: "Hike the Alps",
        experience_type: "place",
      }),
    ]);

    const result = await loadExperiences(
      { ...BASE_QUERY, q: "hike", type: "activity" },
      [],
    );
    expect(result.experiences.map((e) => e.id)).toEqual(["match"]);
  });

  it("leaves non-matching rows out of paginated results without duplicates or skips", async () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      experienceRow({ id: `hike-${i}`, title: `Hike Trail ${i}` }),
    );
    setupFakeClient(rows);

    const first = await loadExperiences({ ...BASE_QUERY, q: "hike" }, []);
    expect(first.experiences).toHaveLength(3);
    expect(first.hasMore).toBe(false);
    const ids = first.experiences.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
