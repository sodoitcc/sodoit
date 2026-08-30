import { describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/app/(app)/achievements/queries", () => ({
  loadAchievementDefinitions: vi.fn().mockResolvedValue([]),
}));

import { loadProfile } from "@/app/(app)/u/[username]/data";

function experience(id: string, category: string | null = null) {
  return { id, title: id, category, image_url: null, image_alt: null };
}

function setupClient(
  listRows: { status: string; experiences: unknown }[],
  achievementRows: { achievement_id: string }[] = [],
) {
  createClientMock.mockResolvedValue({
    from(table: string) {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: "profile-1",
                    username: "tester",
                    bio: null,
                    avatar_url: null,
                    created_at: "2026-01-01T00:00:00.000Z",
                  },
                  error: null,
                }),
            }),
          }),
        };
      }

      if (table === "user_lists") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: listRows, error: null }),
          }),
        };
      }

      if (table === "user_achievements") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: achievementRows, error: null }),
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  });
}

describe("loadProfile counts", () => {
  it("counts saved rows as saved-only, not including completed", async () => {
    setupClient([
      { status: "saved", experiences: experience("a") },
      { status: "saved", experiences: experience("b") },
      { status: "completed", experiences: experience("c") },
    ]);

    const profile = await loadProfile("tester");
    expect(profile?.savedCount).toBe(2);
  });

  it("counts completed rows as completed-only, not including saved", async () => {
    setupClient([
      { status: "saved", experiences: experience("a") },
      { status: "completed", experiences: experience("b") },
      { status: "completed", experiences: experience("c") },
    ]);

    const profile = await loadProfile("tester");
    expect(profile?.completedCount).toBe(2);
  });

  it("recently completed never includes a saved-only experience", async () => {
    setupClient([
      { status: "saved", experiences: experience("saved-only") },
      { status: "completed", experiences: experience("done-one") },
    ]);

    const profile = await loadProfile("tester");
    const recentIds = profile?.recentCompleted.map((item) => item.id) ?? [];

    expect(recentIds).toContain("done-one");
    expect(recentIds).not.toContain("saved-only");
  });

  it("recently completed includes completed experiences", async () => {
    setupClient([
      { status: "completed", experiences: experience("done-a") },
      { status: "completed", experiences: experience("done-b") },
    ]);

    const profile = await loadProfile("tester");
    const recentIds = profile?.recentCompleted.map((item) => item.id) ?? [];

    expect(recentIds).toEqual(expect.arrayContaining(["done-a", "done-b"]));
  });
});
