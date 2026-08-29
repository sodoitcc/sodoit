import type {
  AchievementActivityItem,
  ActivityActor,
  ActivityItem,
} from "./data";

export interface AchievementActivityGroupItem {
  id: string;
  kind: "achievement_group";
  timestamp: string;
  actor: ActivityActor;
  achievements: { id: string; title: string; icon: string | null }[];
}

const GROUP_WINDOW_MS = 6 * 60 * 60 * 1000;

function isAchievement(item: ActivityItem): item is AchievementActivityItem {
  return item.kind === "achievement_unlocked";
}

export function aggregateAchievementActivity(
  items: ActivityItem[],
): ActivityItem[] {
  const result: ActivityItem[] = [];
  let currentGroup: AchievementActivityItem[] = [];

  function flush() {
    if (currentGroup.length === 0) return;

    const first = currentGroup[0];
    result.push({
      id: `achievement-group-${first.id}`,
      kind: "achievement_group",
      timestamp: first.timestamp,
      actor: first.actor,
      achievements: currentGroup.map((item) => ({
        id: item.achievement.id,
        title: item.achievement.title,
        icon: item.achievement.icon,
      })),
    } satisfies AchievementActivityGroupItem);

    currentGroup = [];
  }

  for (const item of items) {
    if (!isAchievement(item)) {
      flush();
      result.push(item);
      continue;
    }

    const previous = currentGroup[currentGroup.length - 1];
    const sameActor = previous && previous.actor.id === item.actor.id;
    const withinWindow =
      previous &&
      Math.abs(
        new Date(previous.timestamp).getTime() -
          new Date(item.timestamp).getTime(),
      ) <= GROUP_WINDOW_MS;

    if (previous && !(sameActor && withinWindow)) {
      flush();
    }

    currentGroup.push(item);
  }

  flush();

  return result;
}
