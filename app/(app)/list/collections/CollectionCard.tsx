"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Globe2, Lock, MoreHorizontal } from "lucide-react";

import {
  deleteCollection,
  renameCollection,
  setCollectionVisibility,
} from "./actions";

import type { Collection } from "./types";

interface CollectionCardProps {
  username: string;
  collection: Collection;
  onRenamed: (id: string, name: string) => void;
  onDeleted: (id: string) => void;
  onVisibilityChanged: (
    id: string,
    visibility: Collection["visibility"],
  ) => void;
}

function Tile({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`relative bg-surface-subtle ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 640px) 240px, 224px"
        className="object-cover"
      />
    </div>
  );
}

function EmptyCollectionCover() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-accent-wash">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent-dark shadow-sm">
        <Bookmark aria-hidden="true" className="h-5 w-5" />
      </div>
    </div>
  );
}

function CollectionCollage({ images }: { images: string[] }) {
  if (images.length === 0) {
    return <EmptyCollectionCover />;
  }

  if (images.length === 1) {
    return <Tile src={images[0]} className="h-full w-full" />;
  }

  if (images.length === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        {images.map((src, index) => (
          <Tile key={`${src}-${index}`} src={src} className="h-full w-full" />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
        <Tile src={images[0]} className="row-span-2 h-full w-full" />
        <Tile src={images[1]} className="h-full w-full" />
        <Tile src={images[2]} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
      {images.slice(0, 4).map((src, index) => (
        <Tile key={`${src}-${index}`} src={src} className="h-full w-full" />
      ))}
    </div>
  );
}

export function CollectionCard({
  username,
  collection,
  onRenamed,
  onDeleted,
  onVisibilityChanged,
}: CollectionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection.name);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);

    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  async function submitRename() {
    const trimmed = name.trim();

    if (!trimmed) {
      setName(collection.name);
      setRenaming(false);
      return;
    }

    if (trimmed === collection.name) {
      setRenaming(false);
      return;
    }

    const previousName = collection.name;

    onRenamed(collection.id, trimmed);
    setRenaming(false);

    try {
      await renameCollection(collection.id, trimmed);
    } catch (error) {
      onRenamed(collection.id, previousName);
      setName(previousName);
      throw error;
    }
  }

  async function toggleVisibility() {
    const previous = collection.visibility;
    const next = previous === "public" ? "private" : "public";

    setMenuOpen(false);
    onVisibilityChanged(collection.id, next);

    try {
      await setCollectionVisibility(collection.id, next);
    } catch (error) {
      onVisibilityChanged(collection.id, previous);
      throw error;
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    onDeleted(collection.id);

    try {
      await deleteCollection(collection.id);
    } catch (error) {
      throw error;
    }
  }

  return (
    <div
      ref={containerRef}
      className={[
        "group relative w-56 shrink-0 rounded-card",
        "border border-border bg-surface",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-border-strong hover:shadow-sm",
        "sm:w-60",
      ].join(" ")}
    >
      <Link
        href={`/u/${username}/collections/${collection.slug}`}
        className="absolute inset-0 z-10 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2"
        aria-label={`Open ${collection.name}`}
      />

      <div className="relative h-36 overflow-hidden rounded-t-card sm:h-40">
        <CollectionCollage images={collection.coverImages ?? []} />

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={`Manage ${collection.name}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={[
            "absolute right-2 top-2 z-30",
            "inline-flex h-8 w-8 items-center justify-center",
            "rounded-full bg-white/90 text-ink shadow-sm backdrop-blur-sm",
            "transition-colors hover:bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          ].join(" ")}
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className={[
              "absolute right-2 top-11 z-40 w-40",
              "rounded-panel border border-border bg-surface p-1",
              "shadow-popover",
            ].join(" ")}
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
              Make {collection.visibility === "public" ? "private" : "public"}
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

      <div className="relative min-h-[68px] px-3 py-2.5">
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={submitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void submitRename();
              }

              if (event.key === "Escape") {
                setName(collection.name);
                setRenaming(false);
              }
            }}
            maxLength={60}
            className="pointer-events-auto relative z-30 h-8 w-full rounded-control border border-border bg-surface px-2 text-sm font-semibold text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
          />
        ) : (
          <p className="pointer-events-none line-clamp-1 text-[15px] font-bold leading-5 text-ink">
            {collection.name}
          </p>
        )}

        <div className="pointer-events-none mt-1 flex min-w-0 items-center justify-between gap-2 text-xs text-muted">
          <span>
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "item" : "items"}
          </span>

          <span className="inline-flex shrink-0 items-center gap-1">
            {collection.visibility === "public" ? (
              <Globe2 aria-hidden="true" className="h-3 w-3" />
            ) : (
              <Lock aria-hidden="true" className="h-3 w-3" />
            )}

            {collection.visibility === "public" ? "Public" : "Private"}
          </span>
        </div>
      </div>
    </div>
  );
}
