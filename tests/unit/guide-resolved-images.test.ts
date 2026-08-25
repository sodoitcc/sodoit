import { beforeEach, describe, expect, it, vi } from "vitest";

interface Row {
  [key: string]: unknown;
}

function makeQuery(rows: Row[]) {
  let data = [...rows];

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
    not(col: string, _op: string, val: unknown) {
      data = data.filter((row) => row[col] !== val);
      return builder;
    },
    order(col: string) {
      data = [...data].sort((a, b) => {
        const av = a[col] as number;
        const bv = b[col] as number;
        return av < bv ? -1 : av > bv ? 1 : 0;
      });
      return builder;
    },
    then(resolve: (result: { data: Row[]; error: null }) => void) {
      resolve({ data, error: null });
    },
  };

  return builder;
}

function fakeSupabase(tables: Record<string, Row[]>) {
  const fromCalls: string[] = [];
  const client = {
    from(name: string) {
      fromCalls.push(name);
      return makeQuery(tables[name] ?? []);
    },
  };
  return { client, fromCalls };
}

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getGuideResolvedImages } from "@/lib/guides/queries";
import type { Guide } from "@/lib/guides/types";

function guide(overrides: Partial<Guide> = {}): Guide {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "guide",
    title: "Guide",
    description: null,
    city: "Prague",
    country_code: "CZ",
    cover_image_url: null,
    cover_image_alt: null,
    duration_label: null,
    is_public: true,
    featured: false,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function setupFakeClient(tables: { guide_items?: Row[]; places?: Row[] }) {
  const { client, fromCalls } = fakeSupabase({
    guide_items: tables.guide_items ?? [],
    places: tables.places ?? [],
  });
  createClientMock.mockResolvedValue(client);
  return fromCalls;
}

describe("getGuideResolvedImages — resolution priority", () => {
  it("1. manual guide cover wins over everything else", async () => {
    setupFakeClient({});
    const g = guide({
      cover_image_url: "/cover.jpg",
      cover_image_alt: "Cover",
    });
    const result = await getGuideResolvedImages([g]);
    expect(result[g.id]).toEqual({
      url: "/cover.jpg",
      alt: "Cover",
      source: "guide",
    });
  });

  it("2. guide item image wins over a linked place image", async () => {
    const g = guide();
    setupFakeClient({
      guide_items: [
        {
          guide_id: g.id,
          position: 1,
          image_url: "/item.jpg",
          image_alt: "Item photo",
          place_id: "place-1",
          place_name: "Charles Bridge",
        },
      ],
      places: [
        {
          id: "place-1",
          name: "Charles Bridge",
          primary_photo_url: "/place.jpg",
          primary_photo_alt: "Place photo",
          is_public: true,
        },
      ],
    });

    const result = await getGuideResolvedImages([g]);
    expect(result[g.id]).toEqual({
      url: "/item.jpg",
      alt: "Item photo",
      source: "guide_item",
    });
  });

  it("3. linked place image is used when no guide item has an image", async () => {
    const g = guide();
    setupFakeClient({
      guide_items: [
        {
          guide_id: g.id,
          position: 1,
          image_url: null,
          image_alt: null,
          place_id: "place-1",
          place_name: "Charles Bridge",
        },
      ],
      places: [
        {
          id: "place-1",
          name: "Charles Bridge",
          primary_photo_url: "/place.jpg",
          primary_photo_alt: "Place photo",
          is_public: true,
        },
      ],
    });

    const result = await getGuideResolvedImages([g]);
    expect(result[g.id]).toEqual({
      url: "/place.jpg",
      alt: "Place photo",
      source: "place",
    });
  });

  it("falls back to the guide item's place_name for alt when the place has no photo alt", async () => {
    const g = guide();
    setupFakeClient({
      guide_items: [
        {
          guide_id: g.id,
          position: 1,
          image_url: null,
          image_alt: null,
          place_id: "place-1",
          place_name: "Charles Bridge",
        },
      ],
      places: [
        {
          id: "place-1",
          name: "Charles Bridge (canonical)",
          primary_photo_url: "/place.jpg",
          primary_photo_alt: null,
          is_public: true,
        },
      ],
    });

    const result = await getGuideResolvedImages([g]);
    expect(result[g.id]?.alt).toBe("Charles Bridge");
  });

  it("preserves guide item position priority when picking the linked place", async () => {
    const g = guide();
    setupFakeClient({
      guide_items: [
        {
          guide_id: g.id,
          position: 2,
          image_url: null,
          image_alt: null,
          place_id: "place-second",
          place_name: "Second stop",
        },
        {
          guide_id: g.id,
          position: 1,
          image_url: null,
          image_alt: null,
          place_id: "place-first",
          place_name: "First stop",
        },
      ],
      places: [
        {
          id: "place-first",
          name: "First stop",
          primary_photo_url: "/first.jpg",
          primary_photo_alt: null,
          is_public: true,
        },
        {
          id: "place-second",
          name: "Second stop",
          primary_photo_url: "/second.jpg",
          primary_photo_alt: null,
          is_public: true,
        },
      ],
    });

    const result = await getGuideResolvedImages([g]);
    expect(result[g.id]?.url).toBe("/first.jpg");
  });

  it("4. unresolved guide (no cover, no item image, no place image) remains null", async () => {
    const g = guide();
    setupFakeClient({
      guide_items: [
        {
          guide_id: g.id,
          position: 1,
          image_url: null,
          image_alt: null,
          place_id: null,
          place_name: "No place",
        },
      ],
      places: [],
    });

    const result = await getGuideResolvedImages([g]);
    expect(result[g.id]).toBeNull();
  });

  it("5. synthetic dev-preview ids never query uuid-only relations", async () => {
    const g = guide({ id: "preview-some-slug" });
    const calls = setupFakeClient({ guide_items: [], places: [] });

    const result = await getGuideResolvedImages([g]);

    expect(result[g.id]).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("does not query places at all when nothing is still unresolved", async () => {
    const g = guide();
    const calls = setupFakeClient({
      guide_items: [
        {
          guide_id: g.id,
          position: 1,
          image_url: "/item.jpg",
          image_alt: null,
          place_id: "place-1",
          place_name: "Somewhere",
        },
      ],
      places: [],
    });

    await getGuideResolvedImages([g]);
    expect(calls).toEqual(["guide_items"]);
  });
});
