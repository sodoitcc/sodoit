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
        <ul className="mt-6 flex flex-col gap-4">
          {result.items.map((item) => (
            <li key={item.id}>
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
