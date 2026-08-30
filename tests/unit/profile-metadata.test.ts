import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadProfileMock, createClientMock } = vi.hoisted(() => ({
  loadProfileMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/app/(app)/u/[username]/data", () => ({
  loadProfile: loadProfileMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { generateMetadata } from "@/app/(app)/u/[username]/page";
import { SITE_URL } from "@/lib/site";

const BASE_PROFILE = {
  id: "user-1",
  username: "amina",
  bio: null,
  avatarUrl: null,
  joinedAt: "2026-01-01T00:00:00Z",
  completedCount: 12,
  savedCount: 4,
  categoryCount: 3,
  achievementCount: 2,
  recentCompleted: [],
  earnedMilestoneIds: [],
  earnedAchievements: [],
  achievementDefinitions: [],
  stats: {
    totalCompleted: 12,
    categoriesCompleted: new Set<string>(),
    completedByCategory: new Map<string, number>(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Profile generateMetadata", () => {
  it("uses the @{username} on Sodoit title without a duplicated site suffix", async () => {
    loadProfileMock.mockResolvedValue(BASE_PROFILE);
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "amina" }),
    });
    expect(metadata.title).toEqual({ absolute: "@amina on Sodoit" });
  });

  it("builds a factual description from public profile stats when there is no bio", async () => {
    loadProfileMock.mockResolvedValue(BASE_PROFILE);
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "amina" }),
    });
    expect(metadata.description).toBe(
      "@amina has completed 12 experiences on Sodoit.",
    );
  });

  it("uses the public bio as the description when present", async () => {
    loadProfileMock.mockResolvedValue({
      ...BASE_PROFILE,
      bio: "Chasing sunsets since 2019",
    });
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "amina" }),
    });
    expect(metadata.description).toBe("Chasing sunsets since 2019");
  });

  it("sets the canonical URL to /u/{username}", async () => {
    loadProfileMock.mockResolvedValue(BASE_PROFILE);
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "amina" }),
    });
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/u/amina`);
  });

  it("does not leak metadata confirming existence for a nonexistent profile", async () => {
    loadProfileMock.mockResolvedValue(null);
    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "ghost" }),
    });
    expect(metadata).toEqual({});
  });
});
