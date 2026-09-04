"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import { AdminField, ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { Button } from "@/components/ui";
import { slugify } from "@/lib/admin/slug";
import { GUIDE_TYPES } from "@/lib/admin/guides/validation";
import { createGuide, updateGuide } from "@/lib/admin/guides/actions";
import { GUIDE_TYPE_LABELS, GUIDE_ROUTE_MODES } from "@/lib/guides/types";
import type { Guide } from "@/lib/guides/types";

interface GuideFormProps {
  guide?: Guide;
}

export function GuideForm({ guide }: GuideFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(guide?.title ?? "");
  const [slug, setSlug] = useState(guide?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(guide));

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = guide
        ? await updateGuide(guide.id, formData)
        : await createGuide(formData);

      if (!result.success) {
        setError(result.error ?? "Could not save the guide.");
        return;
      }

      if (guide) {
        setSuccess(true);
        router.refresh();
      } else if (result.id) {
        router.push(`/admin/guides/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <AdminFormSection title="Basics">
        <AdminField label="Title" htmlFor="title" full>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            required
            maxLength={120}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField
          label="Slug"
          htmlFor="slug"
          hint="Lowercase letters, numbers, and hyphens."
          full
        >
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            required
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Description" htmlFor="description" full>
          <textarea
            id="description"
            name="description"
            defaultValue={guide?.description ?? ""}
            rows={4}
            maxLength={2000}
            className={`${ADMIN_INPUT_CLASS} resize-none`}
          />
        </AdminField>

        <AdminField label="Type" htmlFor="type">
          <select
            id="type"
            name="type"
            defaultValue={guide?.type ?? "itinerary"}
            className={ADMIN_INPUT_CLASS}
          >
            {GUIDE_TYPES.map((type) => (
              <option key={type} value={type}>
                {GUIDE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Sort order" htmlFor="sort_order">
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={guide?.sort_order ?? 0}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Location">
        <AdminField label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            defaultValue={guide?.city ?? ""}
            required
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField
          label="Country code"
          htmlFor="country_code"
          hint="2-letter ISO code, e.g. CZ."
        >
          <input
            id="country_code"
            name="country_code"
            defaultValue={guide?.country_code ?? ""}
            maxLength={2}
            required
            className={`${ADMIN_INPUT_CLASS} uppercase`}
          />
        </AdminField>

        <AdminField
          label="City slug"
          htmlFor="city_slug"
          hint="Optional link to an existing guide city."
          full
        >
          <input
            id="city_slug"
            name="city_slug"
            defaultValue={guide?.city_slug ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Media & editorial">
        <AdminField label="Cover image URL" htmlFor="cover_image_url" full>
          <input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            defaultValue={guide?.cover_image_url ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Cover image alt text" htmlFor="cover_image_alt" full>
          <input
            id="cover_image_alt"
            name="cover_image_alt"
            defaultValue={guide?.cover_image_alt ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Duration label" htmlFor="duration_label">
          <input
            id="duration_label"
            name="duration_label"
            defaultValue={guide?.duration_label ?? ""}
            placeholder="e.g. Weekend trip"
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField
          label="Editorial attribution"
          htmlFor="editorial_attribution"
        >
          <input
            id="editorial_attribution"
            name="editorial_attribution"
            defaultValue={guide?.editorial_attribution ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Best time" htmlFor="best_time">
          <input
            id="best_time"
            name="best_time"
            defaultValue={guide?.best_time ?? ""}
            placeholder="e.g. Weekday mornings"
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Local tip" htmlFor="local_tip">
          <input
            id="local_tip"
            name="local_tip"
            defaultValue={guide?.local_tip ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Route mode" htmlFor="route_mode">
          <select
            id="route_mode"
            name="route_mode"
            defaultValue={guide?.route_mode ?? ""}
            className={ADMIN_INPUT_CLASS}
          >
            <option value="">None</option>
            {GUIDE_ROUTE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Visibility">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={guide?.is_public ?? false}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
          />
          Published
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={guide?.featured ?? false}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
          />
          Featured
        </label>
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

        {guide && (
          <a
            href={`/guides/${guide.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-secondary hover:text-ink"
          >
            Preview public page
          </a>
        )}
      </div>
    </form>
  );
}
