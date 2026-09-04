"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { Button } from "@/components/ui";
import {
  addGuideItem,
  deleteGuideItem,
  moveGuideItem,
  updateGuideItem,
} from "@/lib/admin/guides/actions";
import type { GuideItem } from "@/lib/guides/types";

interface GuideItemsEditorProps {
  guideId: string;
  items: GuideItem[];
}

export function GuideItemsEditor({ guideId, items }: GuideItemsEditorProps) {
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
    runAction(() => addGuideItem(guideId, formData));
    setAddOpen(false);
    event.currentTarget.reset();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Items ({items.length})
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAddOpen((open) => !open)}
        >
          {addOpen ? "Cancel" : "Add item"}
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
        <form
          onSubmit={handleAdd}
          className="mb-4 grid grid-cols-1 gap-3 rounded-control border border-border bg-surface-subtle p-4 sm:grid-cols-2"
        >
          <input
            name="title"
            placeholder="Title"
            required
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="place_name"
            placeholder="Place name (editorial override)"
            className={ADMIN_INPUT_CLASS}
          />
          <textarea
            name="description"
            placeholder="Description"
            rows={2}
            className={`${ADMIN_INPUT_CLASS} sm:col-span-2 resize-none`}
          />
          <input
            name="image_url"
            type="url"
            placeholder="Image URL"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="external_url"
            type="url"
            placeholder="External URL"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="neighborhood"
            placeholder="Neighborhood"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="address"
            placeholder="Address"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="latitude"
            type="number"
            step="any"
            placeholder="Latitude"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="longitude"
            type="number"
            step="any"
            placeholder="Longitude"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="google_maps_url"
            type="url"
            placeholder="Google Maps URL override"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            className={ADMIN_INPUT_CLASS}
          />
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Add item
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-control border border-dashed border-border p-6 text-center text-sm text-muted">
          No items yet. Add the first stop above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <GuideItemRow
              key={item.id}
              guideId={guideId}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onAction={runAction}
              isPending={isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface GuideItemRowProps {
  guideId: string;
  item: GuideItem;
  isFirst: boolean;
  isLast: boolean;
  isPending: boolean;
  onAction: (
    action: () => Promise<{ success: boolean; error?: string }>,
  ) => void;
}

function GuideItemRow({
  guideId,
  item,
  isFirst,
  isLast,
  isPending,
  onAction,
}: GuideItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onAction(() => updateGuideItem(guideId, item.id, formData));
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="rounded-control border border-border bg-surface p-4">
        <form
          onSubmit={handleEditSubmit}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <input
            name="title"
            defaultValue={item.title}
            required
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="place_name"
            defaultValue={item.place_name ?? ""}
            placeholder="Place name (editorial override)"
            className={ADMIN_INPUT_CLASS}
          />
          <textarea
            name="description"
            defaultValue={item.description ?? ""}
            rows={2}
            className={`${ADMIN_INPUT_CLASS} sm:col-span-2 resize-none`}
          />
          <input
            name="image_url"
            type="url"
            defaultValue={item.image_url ?? ""}
            placeholder="Image URL"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="external_url"
            type="url"
            defaultValue={item.external_url ?? ""}
            placeholder="External URL"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="neighborhood"
            defaultValue={item.neighborhood ?? ""}
            placeholder="Neighborhood"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="address"
            defaultValue={item.address ?? ""}
            placeholder="Address"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="latitude"
            type="number"
            step="any"
            defaultValue={item.latitude ?? ""}
            placeholder="Latitude"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="longitude"
            type="number"
            step="any"
            defaultValue={item.longitude ?? ""}
            placeholder="Longitude"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="google_maps_url"
            type="url"
            defaultValue={item.google_maps_url ?? ""}
            placeholder="Google Maps URL override"
            className={ADMIN_INPUT_CLASS}
          />
          <input
            name="tags"
            defaultValue={(item.tags ?? []).join(", ")}
            placeholder="Tags (comma separated)"
            className={ADMIN_INPUT_CLASS}
          />
          <div className="flex items-center gap-2 sm:col-span-2">
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
          onClick={() => onAction(() => moveGuideItem(guideId, item.id, "up"))}
          className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={isLast || isPending}
          onClick={() =>
            onAction(() => moveGuideItem(guideId, item.id, "down"))
          }
          className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        {item.place_name && (
          <p className="truncate text-xs text-muted">{item.place_name}</p>
        )}
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
          if (confirm(`Remove "${item.title}" from this guide?`)) {
            onAction(() => deleteGuideItem(guideId, item.id));
          }
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-danger-light hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
