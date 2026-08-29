import { EmptyState } from "@/components/ui";
import type {
  ActivityFeedResult,
  ActivityFilter,
  CollectionActivityItem,
} from "@/app/(app)/feed/data";
import { emptyStateForFilter } from "@/app/(app)/feed/empty-state-copy";
import { ActivityListItem } from "./ActivityListItem";
import { ActivityPagination } from "./ActivityPagination";
import { FeedCollectionCard } from "./FeedCollectionCard";

interface ActivityFeedProps {
  filter: ActivityFilter;
  result: ActivityFeedResult;
}

function isWideItem(kind: string) {
  return kind === "added_to_list_group" || kind === "added_to_list";
}

export function ActivityFeed({ filter, result }: ActivityFeedProps) {
  return (
    <div>
      {result.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState {...emptyStateForFilter(filter)} />
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
        <ul className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {result.items.map((item) => (
            <li
              key={item.id}
              className={isWideItem(item.kind) ? "lg:col-span-2" : undefined}
            >
              <ActivityListItem item={item} />
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
