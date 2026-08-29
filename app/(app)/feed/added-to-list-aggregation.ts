import type {
  ActivityActor,
  ActivityItem,
  ExperienceActivityItem,
} from "./data";

export interface AddedToListGroupItem {
  id: string;
  kind: "added_to_list_group";
  timestamp: string;
  actor: ActivityActor;
  experiences: {
    id: string;
    title: string;
    imageUrl: string | null;
    imageAlt: string | null;
  }[];
}

const GROUP_WINDOW_MS = 6 * 60 * 60 * 1000;

function isAddedToList(item: ActivityItem): item is ExperienceActivityItem {
  return item.kind === "added_to_list";
}

export function aggregateAddedToListActivity(
  items: ActivityItem[],
): ActivityItem[] {
  const result: ActivityItem[] = [];
  let currentGroup: ExperienceActivityItem[] = [];

  function flush() {
    if (currentGroup.length === 0) return;

    const first = currentGroup[0];
    result.push({
      id: `added-to-list-group-${first.id}`,
      kind: "added_to_list_group",
      timestamp: first.timestamp,
      actor: first.actor,
      experiences: currentGroup.map((item) => ({
        id: item.experience.id,
        title: item.experience.title,
        imageUrl: item.experience.imageUrl,
        imageAlt: item.experience.imageAlt,
      })),
    } satisfies AddedToListGroupItem);

    currentGroup = [];
  }

  for (const item of items) {
    if (!isAddedToList(item)) {
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
