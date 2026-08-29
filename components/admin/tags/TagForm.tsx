"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { AdminField, ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  createExperienceTag,
  updateExperienceTag,
} from "@/lib/admin/tags/actions";
import type { ExperienceTag } from "@/lib/experiences/taxonomy";

interface TagFormProps {
  tag?: ExperienceTag;
}

export function TagForm({ tag }: TagFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = tag
        ? await updateExperienceTag(tag.id, formData)
        : await createExperienceTag(formData);

      if (!result.success) {
        setError(result.error ?? "Could not save the tag.");
        return;
      }

      if (tag) {
        setSuccess(true);
        router.refresh();
      } else if (result.id) {
        router.push(`/admin/tags/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminFormSection title="Tag">
        <AdminField label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={tag?.name}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField
          label="Slug"
          htmlFor="slug"
          hint={tag ? "Slug is permanent and cannot be edited." : undefined}
        >
          <input
            id="slug"
            name="slug"
            type="text"
            required
            readOnly={Boolean(tag)}
            defaultValue={tag?.slug}
            className={[
              ADMIN_INPUT_CLASS,
              tag ? "cursor-not-allowed bg-surface-subtle" : "",
            ].join(" ")}
          />
        </AdminField>

        <AdminField label="Sort order" htmlFor="sort_order">
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            min={0}
            step={1}
            defaultValue={tag?.sort_order ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Status" htmlFor="is_active">
          <label className="flex h-[42px] items-center gap-2 text-sm text-ink">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={tag?.is_active ?? true}
              className="h-4 w-4 rounded border-border"
            />
            Active
          </label>
        </AdminField>
      </AdminFormSection>

      {error && (
        <p
          role="alert"
          className="rounded-control border border-danger/20 bg-danger-light px-3.5 py-2.5 text-[13px] text-danger"
        >
          {error}
        </p>
      )}

      {success && (
        <p className="text-[13px] font-medium text-success">Changes saved.</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
