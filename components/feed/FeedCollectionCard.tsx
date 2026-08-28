import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui";
import { CollectionCollage } from "@/app/(app)/list/collections/CollectionCollage";
import { relativeTime } from "@/lib/relative-time";
import type { CollectionActivityItem } from "@/app/(app)/feed/data";
import { feedCollectionHref } from "@/app/(app)/feed/collection-href";

export function FeedCollectionCard({
  item,
}: {
  item: CollectionActivityItem;
}) {
  const { collection, actor, timestamp } = item;
  const href = feedCollectionHref(collection);

  return (
    <Link
      href={href}
      aria-label={`View ${collection.name}, a collection by ${collection.ownerUsername}`}
      className="group block overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-card">
        <CollectionCollage
          images={collection.coverImages}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-bold leading-snug text-ink">
          {collection.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Avatar name={actor.username} src={actor.avatarUrl} size="sm" />
          <span className="truncate text-xs font-semibold text-secondary">
            {actor.username}
          </span>
          <span aria-hidden="true" className="text-xs text-muted">
            ·
          </span>
          <time
            dateTime={timestamp}
            className="shrink-0 text-xs font-medium text-muted"
          >
            {relativeTime(timestamp)}
          </time>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </span>

          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark group-hover:text-accent"
          >
            View collection
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
