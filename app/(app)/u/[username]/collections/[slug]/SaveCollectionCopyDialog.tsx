"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@/components/ui";
import {
  forkCollection,
  type ForkCollectionResult,
} from "@/app/(app)/list/collections/actions";
import { COLLECTION_NAME_MAX_LENGTH } from "@/app/(app)/list/collections/types";

interface SaveCollectionCopyDialogProps {
  sourceCollectionId: string;
  sourceName: string;
  onClose: () => void;
  onSaved: (result: ForkCollectionResult) => void;
}

export function SaveCollectionCopyDialog({
  sourceCollectionId,
  sourceName,
  onClose,
  onSaved,
}: SaveCollectionCopyDialogProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(sourceName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, onClose]);

  async function handleSave() {
    if (pending) return;

    setPending(true);
    setError(null);

    const trimmed = name.trim();
    const result = await forkCollection(
      sourceCollectionId,
      trimmed ? trimmed : undefined,
    );

    if (!result) {
      setError("Couldn’t save a copy. Please try again.");
      setPending(false);
      return;
    }

    posthog.capture("collection_forked");
    onSaved(result);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 sm:items-center sm:p-4"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-copy-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-t-panel border border-border bg-surface outline-none sm:rounded-panel"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <h2 id="save-copy-title" className="text-base font-bold text-ink">
            Save a copy
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-60"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-sm text-secondary">
            This creates an independent collection in your My List that you can
            edit freely — the original won&apos;t be affected.
          </p>

          <div>
            <label
              htmlFor="save-copy-name"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
            >
              Collection name
            </label>
            <input
              id="save-copy-name"
              ref={nameInputRef}
              type="text"
              value={name}
              disabled={pending}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSave();
                }
              }}
              maxLength={COLLECTION_NAME_MAX_LENGTH}
              className="mt-1.5 h-10 w-full rounded-control border border-border bg-surface px-3 text-sm font-semibold text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 disabled:opacity-60"
            />
          </div>

          <p className="text-xs text-muted">
            Your copy starts <span className="font-semibold">Private</span> —
            only you can see it until you choose to share it.
          </p>

          {error && (
            <p
              role="alert"
              className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4 sm:p-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || name.trim().length === 0}
            onClick={handleSave}
          >
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
