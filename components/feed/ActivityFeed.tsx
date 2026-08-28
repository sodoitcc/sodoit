import { EmptyState } from "@/components/ui";
import type {
  ActivityFeedResult,
  ActivityFilter,
  CollectionActivityItem,
} from "@/app/(app)/feed/data";
import { ActivityFilters } from "./ActivityFilters";
import { ActivityListItem } from "./ActivityListItem";
import { ActivityPagination } from "./ActivityPagination";
import { FeedCollectionCard } from "./FeedCollectionCard";

interface ActivityFeedProps {
  filter: ActivityFilter;
  result: ActivityFeedResult;
  viewerStatuses: Map<string, "saved" | "completed">;
  signedIn: boolean;
}

export function ActivityFeed({
  filter,
  result,
  viewerStatuses,
  signedIn,
}: ActivityFeedProps) {
  return (
    <div>
      <ActivityFilters active={filter} />

      {result.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No community updates yet"
            description="When people share their lists, complete experiences, or create public collections, you'll see it here."
          />
        </div>
      ) : filter === "collections" ? (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(result.items as CollectionActivityItem[]).map((item) => (
            <li key={item.id}>
              <FeedCollectionCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 flex flex-col gap-5">
          {result.items.map((item) => (
            <li key={item.id}>
              <ActivityListItem
                item={item}
                viewerStatus={
                  item.kind === "completed" || item.kind === "added_to_list"
                    ? (viewerStatuses.get(item.experience.id) ?? null)
                    : null
                }
                signedIn={signedIn}
              />
            </li>
          ))}
        </ul>
      )}

      <ActivityPagination
        filter={filter}
        page={result.page}
        hasMore={result.hasMore}
      />
    </div>
  );
}
