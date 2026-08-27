"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmptyState, Button } from "@/components/ui";
import { ExperienceResults } from "@/app/(app)/browse/components/ExperienceResults";
import type { BrowseView, Experience } from "@/app/(app)/browse/types";

import { MyListHero } from "./MyListHero";
import { MyListResultsHeader } from "./MyListResultsHeader";
import { useMyListState, type MyListStatus } from "./useMyListState";
import { CollectionsSection } from "./collections/CollectionsSection";
import { AddToCollectionMenu } from "./collections/AddToCollectionMenu";
import type { Collection, Visibility } from "./collections/types";

const EMPTY_STATUS_TITLES: Record<MyListStatus, string> = {
  all: "No experiences found",
  saved: "No saved experiences",
  completed: "Nothing completed yet",
};

interface MyListViewProps {
  username: string;
  saved: Experience[];
  completed: Experience[];
  view: BrowseView;
  visibility: Visibility;
  collections: Collection[];
  membership: Record<string, string[]>;
}

export function MyListView({
  username,
  saved,
  completed,
  view,
  visibility,
  collections: initialCollections,
  membership: initialMembership,
}: MyListViewProps) {
  const router = useRouter();

  const {
    entries,
    status,
    setStatus,
    search,
    setSearch,
    isEmpty,
    visible,
    completedIds,
    toggle,
    remove,
  } = useMyListState(saved, completed);

  const [collections, setCollections] = useState(initialCollections);

  const [membership, setMembership] = useState(
    () =>
      new Map(
        Object.entries(initialMembership).map(([id, ids]) => [
          id,
          new Set(ids),
        ]),
      ),
  );

  const [managingId, setManagingId] = useState<string | null>(null);

  const managingExperience = entries.find(
    (entry) => entry.experience.id === managingId,
  )?.experience;

  function changeView(nextView: BrowseView) {
    router.push(nextView === "grid" ? "/list" : `/list?view=${nextView}`);
  }

  function toggleMembership(collectionId: string, member: boolean) {
    setMembership((previous) => {
      const next = new Map(previous);
      const current = new Set(next.get(managingId ?? "") ?? []);

      if (member) current.add(collectionId);
      else current.delete(collectionId);

      if (managingId) next.set(managingId, current);
      return next;
    });

    setCollections((previous) =>
      previous.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              itemCount: Math.max(0, collection.itemCount + (member ? 1 : -1)),
            }
          : collection,
      ),
    );
  }

  return (
    <div className="pb-6 sm:pb-8">
      <MyListHero
        username={username}
        visibility={visibility}
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <CollectionsSection
          username={username}
          collections={collections}
          onCollectionsChange={setCollections}
        />

        {isEmpty ? (
          <div className="mt-8">
            <EmptyState
              title="Your list is empty"
              description="Save experiences from Browse and they'll show up here."
              action={
                <Button type="button" onClick={() => router.push("/")}>
                  Browse experiences
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <MyListResultsHeader
              status={status}
              view={view}
              onViewChange={changeView}
            />

            <div className="mt-4">
              {visible.length === 0 ? (
                <EmptyState
                  title={
                    search.trim()
                      ? "No experiences found"
                      : EMPTY_STATUS_TITLES[status]
                  }
                  description={
                    search.trim() ? "Try a different search." : undefined
                  }
                />
              ) : (
                <ExperienceResults
                  experiences={visible.map((entry) => entry.experience)}
                  view={view}
                  completed={completedIds}
                  onToggle={toggle}
                  onRemove={remove}
                  onManageCollections={setManagingId}
                />
              )}
            </div>
          </>
        )}
      </div>

      {managingId && managingExperience && (
        <AddToCollectionMenu
          experienceId={managingId}
          experienceTitle={managingExperience.title}
          collections={collections}
          memberOf={membership.get(managingId) ?? new Set()}
          onClose={() => setManagingId(null)}
          onToggled={toggleMembership}
          onCreated={(collection) =>
            setCollections((previous) => [collection, ...previous])
          }
        />
      )}
    </div>
  );
}
