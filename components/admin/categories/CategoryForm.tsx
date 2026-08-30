"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { AdminField, ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  createExperienceCategory,
  updateExperienceCategory,
} from "@/lib/admin/categories/actions";
import type { ExperienceCategory } from "@/lib/experiences/taxonomy";

interface CategoryFormProps {
  category?: ExperienceCategory;
}

export function CategoryForm({ category }: CategoryFormProps) {
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
      const result = category
        ? await updateExperienceCategory(category.id, formData)
        : await createExperienceCategory(formData);

      if (!result.success) {
        setError(result.error ?? "Could not save the category.");
        return;
      }

      if (category) {
        setSuccess(true);
        router.refresh();
      } else if (result.id) {
        router.push(`/admin/categories/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminFormSection title="Category">
        <AdminField label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={category?.name}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField
          label="Slug"
          htmlFor="slug"
          hint={
            category ? "Slug is permanent and cannot be edited." : undefined
          }
        >
          <input
            id="slug"
            name="slug"
            type="text"
            required
            readOnly={Boolean(category)}
            defaultValue={category?.slug}
            className={[
              ADMIN_INPUT_CLASS,
              category ? "cursor-not-allowed bg-surface-subtle" : "",
            ].join(" ")}
          />
        </AdminField>

        <AdminField label="Description" htmlFor="description" full>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category?.description ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Icon" htmlFor="icon" hint="Lucide icon name.">
          <input
            id="icon"
            name="icon"
            type="text"
            defaultValue={category?.icon ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Sort order" htmlFor="sort_order">
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={category?.sort_order}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Status" htmlFor="is_active">
          <label className="flex h-[42px] items-center gap-2 text-sm text-ink">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={category?.is_active ?? true}
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
