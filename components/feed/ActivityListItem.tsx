import type { ActivityItem } from "@/app/(app)/feed/data";
import { CompletedExperienceCard } from "./CompletedExperienceCard";
import { FeedCollectionCard } from "./FeedCollectionCard";
import { AddedToListActivityGroup } from "./AddedToListActivityGroup";

export function ActivityListItem({ item }: { item: ActivityItem }) {
  if (item.kind === "completed") {
    return <CompletedExperienceCard item={item} />;
  }

  if (item.kind === "added_to_list_group") {
    return <AddedToListActivityGroup item={item} />;
  }

  if (item.kind === "added_to_list") {
    return (
      <AddedToListActivityGroup
        item={{
          id: item.id,
          kind: "added_to_list_group",
          timestamp: item.timestamp,
          actor: item.actor,
          experiences: [
            {
              id: item.experience.id,
              slug: item.experience.slug,
              title: item.experience.title,
              imageUrl: item.experience.imageUrl,
              imageAlt: item.experience.imageAlt,
            },
          ],
        }}
      />
    );
  }

  if (item.kind === "collection_created") {
    return <FeedCollectionCard item={item} />;
  }

  return null;
}
