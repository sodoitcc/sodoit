"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import posthog from "posthog-js";

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
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (submitting) return;

    const trimmed = name.trim();

    if (!trimmed) {
      setName("");
      setCreating(false);
      return;
    }

    setSubmitting(true);

    try {
      const result = await createCollection(trimmed);

      if (result) {
        posthog.capture("collection_created");
        onCollectionsChange([
          {
            id: result.id,
            slug: result.slug,
            name: trimmed,
            description: null,
            visibility: "private",
            itemCount: 0,
            coverImages: [],
          },
          ...collections,
        ]);
      }

      setName("");
      setCreating(false);
    } finally {
      setSubmitting(false);
    }
  }

  function renamed(id: string, nextName: string) {
    onCollectionsChange(
      collections.map((collection) =>
        collection.id === id
          ? {
              ...collection,
              name: nextName,
            }
          : collection,
      ),
    );
  }

  function deleted(id: string) {
    onCollectionsChange(
      collections.filter((collection) => collection.id !== id),
    );
  }

  function visibilityChanged(id: string, visibility: Collection["visibility"]) {
    onCollectionsChange(
      collections.map((collection) =>
        collection.id === id
          ? {
              ...collection,
              visibility,
            }
          : collection,
      ),
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">
          Collections
        </h2>
      </div>

      <div
        className={[
          "-mx-4 flex gap-3 px-4 pb-2",
          "overflow-x-auto [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
          "sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        ].join(" ")}
      >
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
          <div
            className={[
              "flex h-[213px] w-56 shrink-0 flex-col items-center justify-center",
              "rounded-card border border-dashed border-border",
              "bg-surface p-4",
              "sm:h-[229px] sm:w-60",
            ].join(" ")}
          >
            <input
              autoFocus
              value={name}
              disabled={submitting}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => {
                void handleCreate();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleCreate();
                }

                if (event.key === "Escape") {
                  setName("");
                  setCreating(false);
                }
              }}
              placeholder="Collection name"
              maxLength={60}
              className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm font-semibold text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 disabled:opacity-60"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={[
              "flex h-[213px] w-56 shrink-0 flex-col items-center justify-center gap-2",
              "rounded-card border border-dashed border-border",
              "bg-background text-secondary",
              "transition-[border-color,color,background-color]",
              "hover:border-border-strong hover:bg-surface-subtle hover:text-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              "sm:h-[229px] sm:w-60",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle">
              <Plus aria-hidden="true" className="h-4 w-4" />
            </span>

            <span className="text-sm font-semibold">New collection</span>
          </button>
        )}
      </div>
    </section>
  );
}
