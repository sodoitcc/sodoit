import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CollectionCollage } from "@/app/(app)/list/collections/CollectionCollage";
import type { CollectionActivityItem } from "@/app/(app)/feed/data";
import { feedCollectionHref } from "@/app/(app)/feed/collection-href";
import { ActivityActorLine } from "./ActivityActorLine";
import { ActivityCardShell } from "./ActivityCardShell";

export function CollectionActivityCard({
  item,
}: {
  item: CollectionActivityItem;
}) {
  const href = feedCollectionHref(item.collection);

  return (
    <ActivityCardShell className="lg:flex lg:items-stretch">
      <div className="flex flex-col justify-between gap-4 p-4 sm:p-5 lg:w-[42%] lg:shrink-0">
        <ActivityActorLine
          actor={item.actor}
          timestamp={item.timestamp}
          action="created a collection"
        />

        <div>
          <Link
            href={href}
            className="block text-lg font-bold leading-snug text-ink hover:text-accent-dark"
          >
            {item.collection.name}
          </Link>

          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {item.collection.itemCount}{" "}
            {item.collection.itemCount === 1 ? "item" : "items"}
          </p>

          <Link
            href={href}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-accent"
          >
            View collection
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <Link
        href={href}
        className="relative block aspect-[16/10] w-full sm:aspect-[16/8] lg:aspect-auto lg:w-[58%]"
      >
        <CollectionCollage
          images={item.collection.coverImages}
          sizes="(min-width: 1024px) 58vw, 100vw"
        />
      </Link>
    </ActivityCardShell>
  );
}
