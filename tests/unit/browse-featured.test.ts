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
    in(col: string, vals: unknown[]) {
      data = data.filter((row) => vals.includes(row[col]));
      return builder;
    },
    maybeSingle() {
      return Promise.resolve({ data: data[0] ?? null, error: null });
    },
    then(resolve: (result: { data: Row[]; error: null }) => void) {
      resolve({ data, error: null });
    },
  };

  return builder;
}

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { loadFeaturedExperience } from "@/app/(app)/browse/data";
import { computeRotationBucket } from "@/app/(app)/browse/featured-rotation";

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

const BUCKET_MS = 2 * 60 * 60 * 1000;
const NOW = 1_000 * BUCKET_MS; // bucket-aligned instant

describe("loadFeaturedExperience — eligibility", () => {
  it("includes Easy-difficulty experiences", async () => {
    setupFakeClient([experienceRow({ id: "easy-1", difficulty: "Easy" })]);
    const result = await loadFeaturedExperience(NOW);
    expect(result?.id).toBe("easy-1");
  });

  it("includes Medium-difficulty experiences", async () => {
    setupFakeClient([experienceRow({ id: "medium-1", difficulty: "Medium" })]);
    const result = await loadFeaturedExperience(NOW);
    expect(result?.id).toBe("medium-1");
  });

  it("excludes Hard-difficulty experiences", async () => {
    setupFakeClient([experienceRow({ id: "hard-1", difficulty: "Hard" })]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("excludes Extreme-difficulty experiences", async () => {
    setupFakeClient([
      experienceRow({ id: "extreme-1", difficulty: "Extreme" }),
    ]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("excludes experiences with a null/malformed difficulty", async () => {
    setupFakeClient([
      experienceRow({ id: "no-difficulty-1", difficulty: null }),
    ]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("excludes unpublished (is_public: false) experiences", async () => {
    setupFakeClient([
      experienceRow({ id: "hidden-1", is_public: false, difficulty: "Easy" }),
    ]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("excludes experiences with no image", async () => {
    setupFakeClient([
      experienceRow({ id: "no-image-1", image_url: null, difficulty: "Easy" }),
    ]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("excludes experiences with a blank image URL", async () => {
    setupFakeClient([
      experienceRow({
        id: "blank-image-1",
        image_url: "   ",
        difficulty: "Easy",
      }),
    ]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("returns null when the eligible pool is empty", async () => {
    setupFakeClient([]);
    const result = await loadFeaturedExperience(NOW);
    expect(result).toBeNull();
  });

  it("keeps returning the sole eligible candidate across different buckets", async () => {
    setupFakeClient([experienceRow({ id: "only-one", difficulty: "Easy" })]);
    const a = await loadFeaturedExperience(NOW);
    const b = await loadFeaturedExperience(NOW + BUCKET_MS);
    expect(a?.id).toBe("only-one");
    expect(b?.id).toBe("only-one");
  });
});

describe("loadFeaturedExperience — rotation", () => {
  const rows = [
    experienceRow({ id: "exp-a", difficulty: "Easy" }),
    experienceRow({ id: "exp-b", difficulty: "Medium" }),
    experienceRow({ id: "exp-c", difficulty: "Easy" }),
  ];

  it("resolves the same experience for repeated calls in the same bucket", async () => {
    setupFakeClient(rows);
    const a = await loadFeaturedExperience(NOW);
    setupFakeClient(rows);
    const b = await loadFeaturedExperience(NOW + 1000);
    expect(a?.id).toBe(b?.id);
  });

  it("is a pure function of the injected timestamp — never touches Date.now internally", async () => {
    setupFakeClient(rows);
    const bucket = computeRotationBucket(NOW);
    const result = await loadFeaturedExperience(NOW);
    expect(result).not.toBeNull();
    expect(bucket).toBe(computeRotationBucket(NOW));
  });
});
