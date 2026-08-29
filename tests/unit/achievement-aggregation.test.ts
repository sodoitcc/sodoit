import { describe, expect, it } from "vitest";
import { aggregateAchievementActivity } from "../../app/(app)/feed/achievement-aggregation";
import type {
  ActivityItem,
  AchievementActivityItem,
  ExperienceActivityItem,
} from "../../app/(app)/feed/data";

const ACTOR_A = { id: "user-a", username: "amina", avatarUrl: null };
const ACTOR_B = { id: "user-b", username: "kenji", avatarUrl: null };

function achievement(
  id: string,
  actor: typeof ACTOR_A,
  timestamp: string,
  achievementId = id,
): AchievementActivityItem {
  return {
    id,
    kind: "achievement_unlocked",
    timestamp,
    actor,
    achievement: {
      id: achievementId,
      title: `Achievement ${achievementId}`,
      icon: null,
    },
  };
}

function savedItem(id: string, timestamp: string): ExperienceActivityItem {
  return {
    id,
    kind: "added_to_list",
    timestamp,
    actor: ACTOR_A,
    experience: {
      id,
      title: `Experience ${id}`,
      category: null,
      difficulty: null,
      location: null,
      imageUrl: null,
      imageAlt: null,
    },
  };
}

describe("aggregateAchievementActivity", () => {
  it("groups consecutive same-user achievements into one block", () => {
    const items: ActivityItem[] = [
      achievement("a1", ACTOR_A, "2026-08-10T12:00:00Z"),
      achievement("a2", ACTOR_A, "2026-08-10T11:00:00Z"),
      achievement("a3", ACTOR_A, "2026-08-10T10:00:00Z"),
    ];

    const result = aggregateAchievementActivity(items);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("achievement_group");
    if (result[0].kind === "achievement_group") {
      expect(result[0].achievements.map((a) => a.id)).toEqual([
        "a1",
        "a2",
        "a3",
      ]);
      expect(result[0].timestamp).toBe("2026-08-10T12:00:00Z");
    }
  });

  it("does not group different users together", () => {
    const items: ActivityItem[] = [
      achievement("a1", ACTOR_A, "2026-08-10T12:00:00Z"),
      achievement("b1", ACTOR_B, "2026-08-10T11:50:00Z"),
    ];

    const result = aggregateAchievementActivity(items);

    expect(result).toHaveLength(2);
  });

  it("breaks grouping across an unrelated intervening event", () => {
    const items: ActivityItem[] = [
      achievement("a1", ACTOR_A, "2026-08-10T12:00:00Z"),
      savedItem("s1", "2026-08-10T11:55:00Z"),
      achievement("a2", ACTOR_A, "2026-08-10T11:50:00Z"),
    ];

    const result = aggregateAchievementActivity(items);

    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("achievement_group");
    expect(result[1].kind).toBe("added_to_list");
    expect(result[2].kind).toBe("achievement_group");
  });

  it("does not group achievements separated by an unreasonable time gap", () => {
    const items: ActivityItem[] = [
      achievement("recent", ACTOR_A, "2026-08-10T12:00:00Z"),
      achievement("old", ACTOR_A, "2026-08-09T01:00:00Z"),
    ];

    const result = aggregateAchievementActivity(items);

    expect(result).toHaveLength(2);
  });

  it("renders a single achievement as its own one-item group", () => {
    const items: ActivityItem[] = [
      achievement("solo", ACTOR_A, "2026-08-10T12:00:00Z"),
    ];

    const result = aggregateAchievementActivity(items);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("achievement_group");
    if (result[0].kind === "achievement_group") {
      expect(result[0].achievements).toHaveLength(1);
    }
  });

  it("preserves deterministic order of non-achievement items around groups", () => {
    const items: ActivityItem[] = [
      savedItem("before", "2026-08-10T13:00:00Z"),
      achievement("a1", ACTOR_A, "2026-08-10T12:00:00Z"),
      achievement("a2", ACTOR_A, "2026-08-10T11:00:00Z"),
      savedItem("after", "2026-08-10T10:00:00Z"),
    ];

    const result = aggregateAchievementActivity(items);

    expect(result.map((item) => item.id)).toEqual([
      "before",
      "achievement-group-a1",
      "after",
    ]);
  });
});
