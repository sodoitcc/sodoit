"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createCollection } from "./actions";
import { CollectionCard } from "./CollectionCard";
import type { Collection } from "./types";

interface CollectionsSectionProps {
  username: string;
  collections: Collection[];
  onCollectionsChange: (collections: Collection[]) => void;
}

export function CollectionsSection({
  username,
  collections,
  onCollectionsChange,
}: CollectionsSectionProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setCreating(false);
      return;
    }

    const result = await createCollection(trimmed);
    setCreating(false);
    setName("");

    if (result) {
      onCollectionsChange([
        {
          id: result.id,
          slug: result.slug,
          name: trimmed,
          description: null,
          visibility: "private",
          itemCount: 0,
        },
        ...collections,
      ]);
    }
  }

  function renamed(id: string, nextName: string) {
    onCollectionsChange(
      collections.map((c) => (c.id === id ? { ...c, name: nextName } : c)),
    );
  }

  function deleted(id: string) {
    onCollectionsChange(collections.filter((c) => c.id !== id));
  }

  function visibilityChanged(id: string, visibility: Collection["visibility"]) {
    onCollectionsChange(
      collections.map((c) => (c.id === id ? { ...c, visibility } : c)),
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-base font-bold tracking-[-0.01em] text-ink">
        Collections
      </h2>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            username={username}
            collection={collection}
            onRenamed={renamed}
            onDeleted={deleted}
            onVisibilityChanged={visibilityChanged}
          />
        ))}

        {creating ? (
          <div className="flex h-[148px] w-44 shrink-0 flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-border p-3">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={handleCreate}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCreate();
                if (event.key === "Escape") setCreating(false);
              }}
              placeholder="Collection name"
              maxLength={60}
              className="h-8 w-full rounded-control border border-border bg-surface px-2 text-sm font-semibold text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-[148px] w-44 shrink-0 flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-border text-sm font-semibold text-secondary transition-colors hover:border-border-strong hover:text-ink"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New collection
          </button>
        )}
      </div>
    </section>
  );
}
