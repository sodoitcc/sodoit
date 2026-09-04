"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { Button } from "@/components/ui";
import {
  addGuideComparison,
  deleteGuideComparison,
  moveGuideComparison,
  updateGuideComparison,
} from "@/lib/admin/guides/actions";
import type { GuideComparisonPair } from "@/lib/guides/types";

interface GuideComparisonsEditorProps {
  guideId: string;
  comparisons: GuideComparisonPair[];
}

export function GuideComparisonsEditor({
  guideId,
  comparisons,
}: GuideComparisonsEditorProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(
    action: () => Promise<{ success: boolean; error?: string }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    runAction(() => addGuideComparison(guideId, formData));
    setAddOpen(false);
    event.currentTarget.reset();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Swaps ({comparisons.length})
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAddOpen((open) => !open)}
        >
          {addOpen ? "Cancel" : "Add swap"}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-control border border-danger/20 bg-danger-light px-3.5 py-2.5 text-[13px] text-danger"
        >
          {error}
        </p>
      )}

      {addOpen && (
        <form onSubmit={handleAdd} className="mb-4">
          <ComparisonFields />
          <div className="mt-3">
            <Button type="submit" size="sm" disabled={isPending}>
              Add swap
            </Button>
          </div>
        </form>
      )}

      {comparisons.length === 0 ? (
        <p className="rounded-control border border-dashed border-border p-6 text-center text-sm text-muted">
          No swaps yet. Add the first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comparisons.map((pair, index) => (
            <GuideComparisonRow
              key={pair.id}
              guideId={guideId}
              pair={pair}
              isFirst={index === 0}
              isLast={index === comparisons.length - 1}
              onAction={runAction}
              isPending={isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ComparisonFields({ pair }: { pair?: GuideComparisonPair }) {
  return (
    <div className="rounded-control border border-border bg-surface-subtle p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted">
        Skip
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="skip_title"
          placeholder="Title"
          defaultValue={pair?.skip_title}
          required
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="skip_neighborhood"
          placeholder="Neighborhood"
          defaultValue={pair?.skip_neighborhood ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <textarea
          name="skip_description"
          placeholder="Description"
          rows={2}
          defaultValue={pair?.skip_description ?? ""}
          className={`${ADMIN_INPUT_CLASS} sm:col-span-2 resize-none`}
        />
        <input
          name="skip_address"
          placeholder="Address"
          defaultValue={pair?.skip_address ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="skip_google_maps_url"
          type="url"
          placeholder="Google Maps URL override"
          defaultValue={pair?.skip_google_maps_url ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="skip_latitude"
          type="number"
          step="any"
          placeholder="Latitude"
          defaultValue={pair?.skip_latitude ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="skip_longitude"
          type="number"
          step="any"
          placeholder="Longitude"
          defaultValue={pair?.skip_longitude ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="skip_external_url"
          type="url"
          placeholder="External URL"
          defaultValue={pair?.skip_external_url ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="skip_tags"
          placeholder="Tags (comma separated)"
          defaultValue={(pair?.skip_tags ?? []).join(", ")}
          className={ADMIN_INPUT_CLASS}
        />
      </div>

      <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-[0.1em] text-accent-dark">
        Instead
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="go_instead_title"
          placeholder="Title"
          defaultValue={pair?.go_instead_title}
          required
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="go_instead_neighborhood"
          placeholder="Neighborhood"
          defaultValue={pair?.go_instead_neighborhood ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <textarea
          name="go_instead_description"
          placeholder="Description"
          rows={2}
          defaultValue={pair?.go_instead_description ?? ""}
          className={`${ADMIN_INPUT_CLASS} sm:col-span-2 resize-none`}
        />
        <input
          name="go_instead_address"
          placeholder="Address"
          defaultValue={pair?.go_instead_address ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="go_instead_google_maps_url"
          type="url"
          placeholder="Google Maps URL override"
          defaultValue={pair?.go_instead_google_maps_url ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="go_instead_latitude"
          type="number"
          step="any"
          placeholder="Latitude"
          defaultValue={pair?.go_instead_latitude ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="go_instead_longitude"
          type="number"
          step="any"
          placeholder="Longitude"
          defaultValue={pair?.go_instead_longitude ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="go_instead_external_url"
          type="url"
          placeholder="External URL"
          defaultValue={pair?.go_instead_external_url ?? ""}
          className={ADMIN_INPUT_CLASS}
        />
        <input
          name="go_instead_tags"
          placeholder="Tags (comma separated)"
          defaultValue={(pair?.go_instead_tags ?? []).join(", ")}
          className={ADMIN_INPUT_CLASS}
        />
      </div>

      <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-[0.1em] text-muted">
        Why this swap
      </p>
      <textarea
        name="reason"
        placeholder="Why is the replacement better?"
        rows={2}
        defaultValue={pair?.reason ?? ""}
        className={`${ADMIN_INPUT_CLASS} w-full resize-none`}
      />
    </div>
  );
}

interface GuideComparisonRowProps {
  guideId: string;
  pair: GuideComparisonPair;
  isFirst: boolean;
  isLast: boolean;
  isPending: boolean;
  onAction: (
    action: () => Promise<{ success: boolean; error?: string }>,
  ) => void;
}

function GuideComparisonRow({
  guideId,
  pair,
  isFirst,
  isLast,
  isPending,
  onAction,
}: GuideComparisonRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onAction(() => updateGuideComparison(guideId, pair.id, formData));
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li>
        <form onSubmit={handleEditSubmit}>
          <ComparisonFields pair={pair} />
          <div className="mt-3 flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-control border border-border bg-surface p-3">
      <div className="flex flex-col">
        <button
          type="button"
          disabled={isFirst || isPending}
          onClick={() =>
            onAction(() => moveGuideComparison(guideId, pair.id, "up"))
          }
          className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={isLast || isPending}
          onClick={() =>
            onAction(() => moveGuideComparison(guideId, pair.id, "down"))
          }
          className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          Skip: {pair.skip_title}
        </p>
        <p className="truncate text-xs text-muted">
          Instead: {pair.go_instead_title}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-surface-subtle hover:text-ink"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Remove "${pair.skip_title}" from this guide?`)) {
            onAction(() => deleteGuideComparison(guideId, pair.id));
          }
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-danger-light hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
