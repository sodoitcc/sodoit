import { describe, expect, it } from "vitest";
import { aggregateAddedToListActivity } from "../../app/(app)/feed/added-to-list-aggregation";
import type {
  ActivityItem,
  CollectionActivityItem,
  ExperienceActivityItem,
} from "../../app/(app)/feed/data";

const ACTOR_A = { id: "user-a", username: "amina", avatarUrl: null };
const ACTOR_B = { id: "user-b", username: "kenji", avatarUrl: null };

function savedItem(
  id: string,
  actor: typeof ACTOR_A,
  timestamp: string,
  experienceId = id,
): ExperienceActivityItem {
  return {
    id,
    kind: "added_to_list",
    timestamp,
    actor,
    experience: {
      id: experienceId,
      slug: `experience-${experienceId}`,
      title: `Experience ${experienceId}`,
      category: null,
      difficulty: null,
      location: null,
      imageUrl: null,
      imageAlt: null,
    },
  };
}

function collectionEvent(
  id: string,
  timestamp: string,
): CollectionActivityItem {
  return {
    id,
    kind: "collection_created",
    timestamp,
    actor: ACTOR_A,
    collection: {
      id: "col",
      name: "A Collection",
      slug: "a-collection",
      ownerUsername: ACTOR_A.username,
      itemCount: 0,
      coverImages: [],
    },
  };
}

describe("aggregateAddedToListActivity", () => {
  it("groups multiple consecutive saves from the same actor into one block", () => {
    const items: ActivityItem[] = [
      savedItem("s1", ACTOR_A, "2026-08-10T12:00:00Z"),
      savedItem("s2", ACTOR_A, "2026-08-10T11:00:00Z"),
      savedItem("s3", ACTOR_A, "2026-08-10T10:00:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("added_to_list_group");
    if (result[0].kind === "added_to_list_group") {
      expect(result[0].experiences.map((e) => e.id)).toEqual([
        "s1",
        "s2",
        "s3",
      ]);
      expect(result[0].timestamp).toBe("2026-08-10T12:00:00Z");
      expect(result[0].actor).toEqual(ACTOR_A);
    }
  });

  it("does not group different users together, even when interleaved", () => {
    const items: ActivityItem[] = [
      savedItem("a1", ACTOR_A, "2026-08-10T12:00:00Z"),
      savedItem("b1", ACTOR_B, "2026-08-10T11:50:00Z"),
      savedItem("a2", ACTOR_A, "2026-08-10T11:40:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);

    expect(result).toHaveLength(3);
    expect(result.every((item) => item.kind === "added_to_list_group")).toBe(
      true,
    );
  });

  it("renders a single saved item as its own one-item group", () => {
    const items: ActivityItem[] = [
      savedItem("solo", ACTOR_A, "2026-08-10T12:00:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("added_to_list_group");
    if (result[0].kind === "added_to_list_group") {
      expect(result[0].experiences).toHaveLength(1);
    }
  });

  it("does not group saves separated by an unreasonable time gap", () => {
    const items: ActivityItem[] = [
      savedItem("recent", ACTOR_A, "2026-08-10T12:00:00Z"),
      savedItem("old", ACTOR_A, "2026-08-09T01:00:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);

    expect(result).toHaveLength(2);
  });

  it("does not group across an intervening event of another kind", () => {
    const items: ActivityItem[] = [
      savedItem("before", ACTOR_A, "2026-08-10T12:00:00Z"),
      collectionEvent("col-1", "2026-08-10T11:55:00Z"),
      savedItem("after", ACTOR_A, "2026-08-10T11:50:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);

    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("added_to_list_group");
    expect(result[1].kind).toBe("collection_created");
    expect(result[2].kind).toBe("added_to_list_group");
  });

  it("passes through non-added_to_list items untouched and preserves order", () => {
    const items: ActivityItem[] = [
      collectionEvent("col-1", "2026-08-10T12:00:00Z"),
      savedItem("s1", ACTOR_A, "2026-08-10T11:00:00Z"),
      collectionEvent("col-2", "2026-08-10T10:00:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);

    expect(result.map((item) => item.id)).toEqual([
      "col-1",
      "added-to-list-group-s1",
      "col-2",
    ]);
  });

  it("preserves whatever privacy-filtered input it's given — no items appear that weren't in the input", () => {
    const items: ActivityItem[] = [
      savedItem("visible-1", ACTOR_A, "2026-08-10T12:00:00Z"),
      savedItem("visible-2", ACTOR_A, "2026-08-10T11:00:00Z"),
    ];

    const result = aggregateAddedToListActivity(items);
    const allExperienceIds = result.flatMap((item) =>
      item.kind === "added_to_list_group"
        ? item.experiences.map((e) => e.id)
        : [],
    );

    expect(allExperienceIds.sort()).toEqual(["visible-1", "visible-2"]);
  });
});
