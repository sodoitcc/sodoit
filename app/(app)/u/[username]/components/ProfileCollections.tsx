import Link from "next/link";
import { Globe2, Lock } from "lucide-react";

import { EmptyState } from "@/components/ui";
import { CollectionCollage } from "@/app/(app)/list/collections/CollectionCollage";
import type { Collection } from "@/app/(app)/list/collections/types";

export function ProfileCollections({
  username,
  collections,
  isOwner,
}: {
  username: string;
  collections: Collection[];
  isOwner: boolean;
}) {
  if (collections.length === 0) {
    return (
      <EmptyState
        title={isOwner ? "No collections yet" : "No public collections yet"}
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <li key={collection.id}>
          <Link
            href={`/u/${username}/collections/${collection.slug}`}
            className="group flex items-center gap-3 rounded-card border border-border bg-surface p-2 transition-colors hover:border-border-strong"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control">
              <CollectionCollage
                images={collection.coverImages ?? []}
                sizes="64px"
              />
            </div>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent-dark">
                {collection.name}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {collection.itemCount}{" "}
                {collection.itemCount === 1 ? "item" : "items"}
              </span>
            </span>

            {isOwner && (
              <span
                className="shrink-0 text-muted"
                aria-label={`${collection.visibility === "public" ? "Public" : "Private"} collection`}
              >
                {collection.visibility === "public" ? (
                  <Globe2 aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Lock aria-hidden="true" className="h-4 w-4" />
                )}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
