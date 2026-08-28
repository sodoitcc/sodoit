"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Globe2, Lock, MoreHorizontal } from "lucide-react";

import { Button, EmptyState, ShareButton, ViewToggle } from "@/components/ui";
import { SearchField } from "@/components/ui/SearchField";
import { ExperienceResults } from "@/app/(app)/browse/components/ExperienceResults";
import { setListStatus } from "@/app/(app)/browse/actions";
import type { BrowseView, Experience } from "@/app/(app)/browse/types";
import {
  deleteCollection,
  removeExperienceFromCollection,
  renameCollection,
  setCollectionVisibility,
} from "@/app/(app)/list/collections/actions";
import { CollectionCollage } from "@/app/(app)/list/collections/CollectionCollage";
import { canSaveCopyCollection } from "@/app/(app)/list/collections/fork-visibility";
import type { Collection } from "@/app/(app)/list/collections/types";
import { AddExperiencesDialog } from "./AddExperiencesDialog";
import { SaveCollectionCopyButton } from "./SaveCollectionCopyButton";

interface CollectionDetailViewProps {
  username: string;
  isOwner: boolean;
  signedIn: boolean;
  collection: Collection;
  experiences: Experience[];
  completedIds: string[];
  myListExperiences: Experience[];
}

export function CollectionDetailView({
  username,
  isOwner,
  signedIn,
  collection: initialCollection,
  experiences: initialExperiences,
  completedIds: initialCompletedIds,
  myListExperiences,
}: CollectionDetailViewProps) {
  const router = useRouter();

  const [collection, setCollection] = useState(initialCollection);
  const [experiences, setExperiences] = useState(initialExperiences);
  const [completedIds, setCompletedIds] = useState(
    () => new Set(initialCompletedIds),
  );
  const [view, setView] = useState<BrowseView>("grid");
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection.name);
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPublic = collection.visibility === "public";

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  async function submitRename() {
    const trimmed = name.trim();
    setRenaming(false);
    if (!trimmed || trimmed === collection.name) {
      setName(collection.name);
      return;
    }

    setCollection((previous) => ({ ...previous, name: trimmed }));
    await renameCollection(collection.id, trimmed);
  }

  async function toggleVisibility() {
    setMenuOpen(false);
    const next = isPublic ? "private" : "public";
    setCollection((previous) => ({ ...previous, visibility: next }));
    await setCollectionVisibility(collection.id, next);
  }

  async function handleDelete() {
    setMenuOpen(false);
    await deleteCollection(collection.id);
    router.push("/list");
  }

  async function removeItem(experienceId: string) {
    setExperiences((previous) =>
      previous.filter((experience) => experience.id !== experienceId),
    );
    setCollection((previous) => ({
      ...previous,
      itemCount: Math.max(0, previous.itemCount - 1),
    }));
    await removeExperienceFromCollection(collection.id, experienceId);
  }

  function addItems(added: Experience[]) {
    setExperiences((previous) => {
      const existing = new Set(previous.map((experience) => experience.id));
      return [
        ...previous,
        ...added.filter((experience) => !existing.has(experience.id)),
      ];
    });
    setCollection((previous) => ({
      ...previous,
      itemCount: previous.itemCount + added.length,
    }));
  }

  async function toggleComplete(experienceId: string) {
    const isDone = completedIds.has(experienceId);

    setCompletedIds((previous) => {
      const next = new Set(previous);
      if (isDone) next.delete(experienceId);
      else next.add(experienceId);
      return next;
    });

    await setListStatus(experienceId, isDone ? "saved" : "completed");
  }

  const filteredExperiences = search.trim()
    ? experiences.filter((experience) => {
        const query = search.trim().toLowerCase();
        return [
          experience.title,
          experience.description,
          experience.category,
          experience.city,
        ].some((value) => value?.toLowerCase().includes(query));
      })
    : experiences;

  async function noop(): Promise<void> {}

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        href={isOwner ? "/list" : `/u/${username}/list`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {isOwner ? "My list" : `${username}'s list`}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.55fr_0.45fr] lg:items-start">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-media sm:aspect-[16/11]">
          <CollectionCollage
            images={collection.coverImages ?? []}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>

        <div className="min-w-0">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={submitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitRename();
                if (event.key === "Escape") {
                  setName(collection.name);
                  setRenaming(false);
                }
              }}
              maxLength={60}
              className="h-11 w-full rounded-control border border-border bg-surface px-3 text-2xl font-extrabold text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 sm:text-3xl"
            />
          ) : (
            <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-3xl lg:text-4xl">
              {collection.name}
            </h1>
          )}

          {collection.description && (
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-secondary">
              {collection.description}
            </p>
          )}

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            <span>
              {collection.itemCount}{" "}
              {collection.itemCount === 1 ? "item" : "items"}
            </span>
            <span aria-hidden="true">&middot;</span>
            <span className="inline-flex items-center gap-1">
              {isPublic ? (
                <Globe2 aria-hidden="true" className="h-3 w-3" />
              ) : (
                <Lock aria-hidden="true" className="h-3 w-3" />
              )}
              {isPublic ? "Public" : "Private"}
            </span>
            <span aria-hidden="true">&middot;</span>
            <span>by {username}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {isOwner && (
              <Button type="button" size="sm" onClick={() => setAdding(true)}>
                Add experiences
              </Button>
            )}

            {isPublic && (
              <ShareButton
                url={`/u/${username}/collections/${collection.slug}`}
                title={collection.name}
                size="sm"
              />
            )}

            {canSaveCopyCollection(isOwner, collection.visibility) && (
              <SaveCollectionCopyButton
                signedIn={signedIn}
                sourceCollectionId={collection.id}
                sourceName={collection.name}
                currentPath={`/u/${username}/collections/${collection.slug}`}
              />
            )}

            {isOwner && (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  aria-label="Collection options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border bg-surface text-secondary transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-20 mt-1 w-44 rounded-panel border border-border bg-surface p-1 shadow-popover"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setRenaming(true);
                      }}
                      className="flex w-full items-center rounded-control px-3 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface-subtle hover:text-ink"
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={toggleVisibility}
                      className="flex w-full items-center rounded-control px-3 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface-subtle hover:text-ink"
                    >
                      Make {isPublic ? "private" : "public"}
                    </button>

                    <div className="my-1 border-t border-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDelete}
                      className="flex w-full items-center rounded-control px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {experiences.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No experiences yet"
            description={
              isOwner
                ? "Add experiences from your My List to start building this collection."
                : "This collection does not have any experiences yet."
            }
            action={
              isOwner ? (
                <Button type="button" onClick={() => setAdding(true)}>
                  Add experiences
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
              In this collection
            </h2>

            <ViewToggle view={view} onChange={setView} />
          </div>

          <div className="mt-3 border-b border-border pb-3">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search this collection..."
              className="w-full sm:max-w-sm"
            />
          </div>

          <div className="mt-4">
            {filteredExperiences.length === 0 ? (
              <EmptyState
                title="No experiences found"
                description="Try a different search."
              />
            ) : isOwner ? (
              <ExperienceResults
                experiences={filteredExperiences}
                view={view}
                completed={completedIds}
                onToggle={toggleComplete}
                onRemove={removeItem}
                removeLabel="Remove from collection"
              />
            ) : (
              <ExperienceResults
                experiences={filteredExperiences}
                view={view}
                completed={completedIds}
                onToggle={noop}
                guest
              />
            )}
          </div>
        </section>
      )}

      {isOwner && adding && (
        <AddExperiencesDialog
          collectionId={collection.id}
          collectionItems={experiences}
          myListExperiences={myListExperiences}
          onAdded={addItems}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
