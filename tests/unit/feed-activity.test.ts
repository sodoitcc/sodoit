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
    order(col: string, opts?: { ascending?: boolean }) {
      const asc = opts?.ascending ?? true;
      data = [...data].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
      return builder;
    },
    limit(n: number) {
      data = data.slice(0, n);
      return builder;
    },
    then(resolve: (result: { data: Row[]; error: null }) => void) {
      resolve({ data, error: null });
    },
  };

  return builder;
}

interface FakeUser {
  id: string;
}

function fakeSupabase(
  tables: Record<string, Row[]>,
  user: FakeUser | null = null,
) {
  const fromCalls: string[] = [];
  const client = {
    from(name: string) {
      fromCalls.push(name);
      return makeQuery(tables[name] ?? []);
    },
    auth: {
      async getUser() {
        return { data: { user } };
      },
    },
  };
  return { client, fromCalls };
}

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  loadActivityFeed,
  loadViewerListStatuses,
  type ExperienceActivityItem,
  type CollectionActivityItem,
  type AchievementActivityItem,
} from "@/app/(app)/feed/data";

const PROFILE_A = { id: "user-a", username: "martin", avatar_url: null };
const PROFILE_B = { id: "user-b", username: "anna", avatar_url: null };

const EXPERIENCE_1 = {
  id: "exp-1",
  title: "Cross Shibuya Crossing at night",
  category: "Adventure",
  difficulty: "Easy",
  image_url: null,
  image_alt: null,
};
const EXPERIENCE_2 = {
  id: "exp-2",
  title: "Swim with whale sharks",
  category: "Nature",
  difficulty: "Hard",
  image_url: null,
  image_alt: null,
};

function baseTables() {
  return {
    profiles: [PROFILE_A, PROFILE_B],
    experiences: [EXPERIENCE_1, EXPERIENCE_2],
    user_list_settings: [{ user_id: "user-a", visibility: "public" }],
    user_lists: [
      {
        id: "row-1",
        user_id: "user-a",
        experience_id: "exp-1",
        status: "completed",
        created_at: "2026-08-10T10:00:00Z",
        completed_at: "2026-08-10T12:00:00Z",
      },
      {
        id: "row-2",
        user_id: "user-a",
        experience_id: "exp-2",
        status: "saved",
        created_at: "2026-08-10T09:00:00Z",
        completed_at: null,
      },
      {
        id: "row-private",
        user_id: "user-b",
        experience_id: "exp-1",
        status: "completed",
        created_at: "2026-08-10T11:00:00Z",
        completed_at: "2026-08-10T11:00:00Z",
      },
    ],
    collections: [
      {
        id: "col-1",
        user_id: "user-a",
        name: "2027 Travel Dreams",
        slug: "2027-travel-dreams",
        visibility: "public",
        created_at: "2026-08-10T08:00:00Z",
        collection_items: [{ count: 3 }],
      },
      {
        id: "col-private",
        user_id: "user-b",
        name: "Secret plans",
        slug: "secret-plans",
        visibility: "private",
        created_at: "2026-08-10T08:30:00Z",
        collection_items: [{ count: 1 }],
      },
    ],
    achievements: [{ id: "first-step", title: "First Step", icon: null }],
    user_achievements: [
      {
        user_id: "user-a",
        achievement_id: "first-step",
        earned_at: "2026-08-10T07:00:00Z",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function setupFakeClient(
  tables: ReturnType<typeof baseTables>,
  user: FakeUser | null = null,
) {
  const { client, fromCalls } = fakeSupabase(tables, user);
  createClientMock.mockResolvedValue(client);
  return fromCalls;
}

describe("loadActivityFeed — mapping", () => {
  it("renders real activity from the database", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("maps a completed user_lists row to a completed activity with completed_at as timestamp", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const item = result.items.find(
      (i) => i.id === "list-row-1",
    ) as ExperienceActivityItem;
    expect(item.kind).toBe("completed");
    expect(item.timestamp).toBe("2026-08-10T12:00:00Z");
    expect(item.experience.title).toBe("Cross Shibuya Crossing at night");
  });

  it("maps a saved user_lists row to an added_to_list activity with created_at as timestamp", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const item = result.items.find(
      (i) => i.id === "list-row-2",
    ) as ExperienceActivityItem;
    expect(item.kind).toBe("added_to_list");
    expect(item.timestamp).toBe("2026-08-10T09:00:00Z");
  });

  it("includes a public collection as collection_created activity", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const item = result.items.find(
      (i) => i.id === "collection-col-1",
    ) as CollectionActivityItem;
    expect(item.kind).toBe("collection_created");
    expect(item.collection.name).toBe("2027 Travel Dreams");
    expect(item.collection.ownerUsername).toBe("martin");
    expect(item.collection.itemCount).toBe(3);
    expect(item.collection.coverImages).toEqual([]);
  });

  it("includes an achievement unlock activity", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const item = result.items.find(
      (i) => i.kind === "achievement_unlocked",
    ) as AchievementActivityItem;
    expect(item).toBeDefined();
    expect(item.achievement.title).toBe("First Step");
  });
});

describe("loadActivityFeed — privacy", () => {
  it("never shows My List activity for a user without public list visibility", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const leaked = result.items.some((i) => i.id === "list-row-private");
    expect(leaked).toBe(false);
  });

  it("never shows a private collection's creation", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const leaked = result.items.some((i) => i.id === "collection-col-private");
    expect(leaked).toBe(false);
  });

  it("shows no list activity at all when no user has public visibility", async () => {
    const tables = baseTables();
    tables.user_list_settings = [];
    setupFakeClient(tables);
    const result = await loadActivityFeed("completed", 1);
    expect(result.items).toHaveLength(0);
  });
});

describe("loadActivityFeed — ordering and filters", () => {
  it("orders items newest first across all activity types", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const timestamps = result.items.map((i) => i.timestamp);
    const sorted = [...timestamps].sort().reverse();
    expect(timestamps).toEqual(sorted);
  });

  it("filter=completed returns only completed activity", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("completed", 1);
    expect(result.items.every((i) => i.kind === "completed")).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filter=added_to_list returns only added_to_list activity", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("added_to_list", 1);
    expect(result.items.every((i) => i.kind === "added_to_list")).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filter=collections returns only collection activity", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("collections", 1);
    expect(result.items.every((i) => i.kind === "collection_created")).toBe(
      true,
    );
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filter=collections never includes a private collection (grid source data)", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("collections", 1);
    const leaked = result.items.some((i) => i.id === "collection-col-private");
    expect(leaked).toBe(false);
  });

  it("a collection with no items provides an empty coverImages array (renders the branded collage fallback)", async () => {
    const tables = baseTables();
    tables.collections.push({
      id: "col-empty",
      user_id: "user-a",
      name: "Fresh Start",
      slug: "fresh-start",
      visibility: "public",
      created_at: "2026-08-10T08:15:00Z",
      collection_items: [{ count: 0 }],
    });
    setupFakeClient(tables);
    const result = await loadActivityFeed("collections", 1);
    const item = result.items.find(
      (i) => i.id === "collection-col-empty",
    ) as CollectionActivityItem;
    expect(item).toBeDefined();
    expect(item.collection.itemCount).toBe(0);
    expect(item.collection.coverImages).toEqual([]);
  });

  it("filter=all excludes nothing by kind", async () => {
    setupFakeClient(baseTables());
    const result = await loadActivityFeed("all", 1);
    const kinds = new Set(result.items.map((i) => i.kind));
    expect(kinds.has("completed")).toBe(true);
    expect(kinds.has("added_to_list")).toBe(true);
    expect(kinds.has("collection_created")).toBe(true);
  });
});

describe("loadActivityFeed — pagination", () => {
  it("paginates with a stable page size and reports hasMore correctly", async () => {
    const tables = baseTables();
    tables.user_lists = Array.from({ length: 25 }, (_, i) => ({
      id: `row-${i}`,
      user_id: "user-a",
      experience_id: "exp-1",
      status: "saved",
      created_at: new Date(2026, 7, 1, 0, i).toISOString(),
      completed_at: null,
    }));

    setupFakeClient(tables);
    const page1 = await loadActivityFeed("added_to_list", 1);
    expect(page1.items).toHaveLength(20);
    expect(page1.hasMore).toBe(true);

    setupFakeClient(tables);
    const page2 = await loadActivityFeed("added_to_list", 2);
    expect(page2.items).toHaveLength(5);
    expect(page2.hasMore).toBe(false);
  });

  it("does not increase the number of table queries as item count grows (no N+1)", async () => {
    const tables = baseTables();
    tables.user_lists = Array.from({ length: 15 }, (_, i) => ({
      id: `row-${i}`,
      user_id: "user-a",
      experience_id: "exp-1",
      status: "saved",
      created_at: new Date(2026, 7, 1, 0, i).toISOString(),
      completed_at: null,
    }));
    const calls = setupFakeClient(tables);
    await loadActivityFeed("added_to_list", 1);

    const fromCallCount = calls.length;
    expect(fromCallCount).toBeLessThanOrEqual(4);
  });
});

describe("loadViewerListStatuses", () => {
  it("returns saved/completed state for the current user", async () => {
    setupFakeClient(baseTables(), { id: "user-a" });
    const statuses = await loadViewerListStatuses(["exp-1", "exp-2"]);
    expect(statuses.get("exp-1")).toBe("completed");
    expect(statuses.get("exp-2")).toBe("saved");
  });

  it("returns an empty map for anonymous viewers", async () => {
    setupFakeClient(baseTables(), null);
    const statuses = await loadViewerListStatuses(["exp-1"]);
    expect(statuses.size).toBe(0);
  });

  it("returns an empty map without querying when there are no experience ids", async () => {
    const calls = setupFakeClient(baseTables(), { id: "user-a" });
    const statuses = await loadViewerListStatuses([]);
    expect(statuses.size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});
