"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import { AdminField, ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { Button } from "@/components/ui";
import { CATEGORIES, DIFFICULTIES } from "@/app/(app)/browse/types";
import { RegenerateImageButton } from "@/components/admin/experiences/RegenerateImageButton";
import { slugify } from "@/lib/admin/slug";
import { getExperienceHref } from "@/lib/experiences/href";
import {
  createExperience,
  updateExperience,
} from "@/lib/admin/experiences/actions";
import type {
  Experience,
  ExperienceLocationType,
} from "@/lib/experiences/types";

interface ExperienceFormProps {
  experience?: Experience;
}

export function ExperienceForm({ experience }: ExperienceFormProps) {
  const router = useRouter();
  const isEdit = Boolean(experience);

  const [title, setTitle] = useState(experience?.title ?? "");
  const [slug, setSlug] = useState(experience?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [locationType, setLocationType] = useState<ExperienceLocationType>(
    experience?.location_type ?? "global",
  );

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
      const result = experience
        ? await updateExperience(experience.id, formData)
        : await createExperience(formData);

      if (!result.success) {
        setError(result.error ?? "Could not save the experience.");
        return;
      }

      if (experience) {
        setSuccess(true);
        router.refresh();
      } else if (result.id) {
        router.push(`/admin/experiences/${result.id}`);
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
            defaultValue={experience?.description ?? ""}
            rows={4}
            maxLength={2000}
            className={`${ADMIN_INPUT_CLASS} resize-none`}
          />
        </AdminField>

        <AdminField label="Category" htmlFor="category">
          <select
            id="category"
            name="category"
            defaultValue={experience?.category ?? ""}
            required
            className={ADMIN_INPUT_CLASS}
          >
            <option value="" disabled>
              Select category
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Difficulty" htmlFor="difficulty">
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={experience?.difficulty ?? ""}
            className={ADMIN_INPUT_CLASS}
          >
            <option value="">Not set</option>
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty.label} value={difficulty.label}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Location">
        <AdminField label="Location type" htmlFor="location_type">
          <select
            id="location_type"
            name="location_type"
            value={locationType}
            onChange={(event) =>
              setLocationType(event.target.value as ExperienceLocationType)
            }
            className={ADMIN_INPUT_CLASS}
          >
            <option value="global">Global</option>
            <option value="country">Country</option>
            <option value="city">City</option>
          </select>
        </AdminField>

        <div />

        {locationType !== "global" && (
          <AdminField
            label="Country code"
            htmlFor="country_code"
            hint="2-letter ISO code, e.g. CZ."
          >
            <input
              id="country_code"
              name="country_code"
              defaultValue={experience?.country_code ?? ""}
              maxLength={2}
              className={`${ADMIN_INPUT_CLASS} uppercase`}
            />
          </AdminField>
        )}

        {locationType === "city" && (
          <AdminField label="City" htmlFor="city">
            <input
              id="city"
              name="city"
              defaultValue={experience?.city ?? ""}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
        )}
      </AdminFormSection>

      <AdminFormSection title="Media">
        <AdminField label="Image URL" htmlFor="image_url" full>
          <input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={experience?.image_url ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Image alt text" htmlFor="image_alt" full>
          <input
            id="image_alt"
            name="image_alt"
            defaultValue={experience?.image_alt ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        {experience && (
          <AdminField label="Regenerate" htmlFor="regenerate_image" full>
            <RegenerateImageButton experienceId={experience.id} />
          </AdminField>
        )}
      </AdminFormSection>

      <AdminFormSection title="Detail content">
        <AdminField
          label="Why it's worth doing"
          htmlFor="why_it_matters"
          hint="Shown on the detail page when set. Leave blank to hide."
          full
        >
          <textarea
            id="why_it_matters"
            name="why_it_matters"
            defaultValue={experience?.why_it_matters ?? ""}
            rows={3}
            maxLength={600}
            className={`${ADMIN_INPUT_CLASS} resize-none`}
          />
        </AdminField>

        <AdminField
          label="What to know"
          htmlFor="what_to_know"
          hint="One item per line. Leave blank to hide the section."
          full
        >
          <textarea
            id="what_to_know"
            name="what_to_know"
            defaultValue={(experience?.what_to_know ?? []).join("\n")}
            rows={4}
            className={`${ADMIN_INPUT_CLASS} resize-none`}
          />
        </AdminField>

        <AdminField label="Best time" htmlFor="best_time">
          <input
            id="best_time"
            name="best_time"
            defaultValue={experience?.best_time ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Time needed" htmlFor="duration_text">
          <input
            id="duration_text"
            name="duration_text"
            defaultValue={experience?.duration_text ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>

        <AdminField label="Location note" htmlFor="location_note" full>
          <input
            id="location_note"
            name="location_note"
            defaultValue={experience?.location_note ?? ""}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Visibility">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={experience?.is_public ?? false}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
          />
          Published
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={experience?.featured ?? false}
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

        {experience && (
          <a
            href={getExperienceHref(experience)}
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
