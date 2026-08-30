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

function setupFakeClient(rows: Row[]) {
  const client = {
    from() {
      return makeQuery(rows);
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

    const result = await loadExperiences({ ...BASE_QUERY, type: "activity" }, []);
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
