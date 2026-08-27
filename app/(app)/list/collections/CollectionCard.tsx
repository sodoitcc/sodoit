"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe2, ImageOff, Lock, MoreHorizontal } from "lucide-react";
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
      <Image src={src} alt="" fill sizes="176px" className="object-cover" />
    </div>
  );
}

function CollectionCollage({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-subtle">
        <ImageOff aria-hidden="true" className="h-5 w-5 text-muted" />
      </div>
    );
  }

  if (images.length === 1) {
    return <Tile src={images[0]} className="h-full w-full" />;
  }

  if (images.length === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        {images.map((src) => (
          <Tile key={src} src={src} className="h-full w-full" />
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
    if (trimmed && trimmed !== collection.name) {
      onRenamed(collection.id, trimmed);
      await renameCollection(collection.id, trimmed);
    }
    setRenaming(false);
  }

  async function toggleVisibility() {
    const next = collection.visibility === "public" ? "private" : "public";
    onVisibilityChanged(collection.id, next);
    setMenuOpen(false);
    await setCollectionVisibility(collection.id, next);
  }

  async function handleDelete() {
    setMenuOpen(false);
    onDeleted(collection.id);
    await deleteCollection(collection.id);
  }

  return (
    <div
      ref={containerRef}
      className="relative flex w-44 shrink-0 flex-col overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <Link
        href={`/u/${username}/collections/${collection.slug}`}
        className="absolute inset-0 z-10 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        aria-label={collection.name}
      />

      <div className="relative h-28 w-full overflow-hidden">
        <CollectionCollage images={collection.coverImages ?? []} />

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={`Manage ${collection.name}`}
          aria-expanded={menuOpen}
          className="pointer-events-auto absolute right-1.5 top-1.5 z-20 inline-flex h-7 w-7 items-center justify-center rounded-control border border-border/70 bg-surface/90 text-ink backdrop-blur-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-1.5 top-9 z-20 w-40 rounded-panel border border-border bg-surface p-1 shadow-popover"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setRenaming(true);
              }}
              className="flex w-full items-center rounded-control px-3 py-1.5 text-left text-xs font-semibold text-secondary transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              Rename
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={toggleVisibility}
              className="flex w-full items-center rounded-control px-3 py-1.5 text-left text-xs font-semibold text-secondary transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              Make {collection.visibility === "public" ? "private" : "public"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="flex w-full items-center rounded-control px-3 py-1.5 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-2">
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={submitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitRename();
              if (event.key === "Escape") setRenaming(false);
            }}
            maxLength={60}
            className="pointer-events-auto relative z-20 h-7 w-full rounded-control border border-border bg-surface px-2 text-sm font-semibold text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10"
          />
        ) : (
          <p className="pointer-events-none line-clamp-1 text-sm font-semibold text-ink">
            {collection.name}
          </p>
        )}

        <p className="pointer-events-none mt-0.5 flex items-center gap-1 text-xs text-muted">
          {collection.itemCount} item{collection.itemCount === 1 ? "" : "s"}
          <span aria-hidden="true">·</span>
          {collection.visibility === "public" ? (
            <span className="inline-flex items-center gap-0.5">
              <Globe2 aria-hidden="true" className="h-3 w-3" />
              Public
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5">
              <Lock aria-hidden="true" className="h-3 w-3" />
              Private
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
