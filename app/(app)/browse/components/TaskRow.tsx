"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, FolderPlus, X } from "lucide-react";
import { getExperienceHref } from "@/lib/experiences/href";

import {
  ExperienceImage,
  ExperienceMeta,
  experienceLocation,
} from "@/components/ui";

import type { Experience } from "../types";
import { getDifficulty, getTaskMeta } from "../types";
import { useCompletionToggle } from "../hooks/useCompletionToggle";
import { resolveExperienceCardActionState } from "../experience-card-state";
import { COMPLETED_MEDIA } from "./completedStyles";
import { SaveDoneButtons } from "./SaveDoneButtons";

interface TaskRowProps {
  experience: Experience;
  done: boolean;
  onToggle: () => Promise<void>;
  saved?: boolean;
  onSave?: () => void;
  onRemoveSaved?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  onManageCollections?: () => void;
  guest?: boolean;
  className?: string;
}

export function TaskRow({
  experience,
  done,
  onToggle,
  saved,
  onSave,
  onRemoveSaved,
  onRemove,
  removeLabel,
  onManageCollections,
  guest = false,
  className = "",
}: TaskRowProps) {
  const [prevDone, setPrevDone] = useState(done);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const { isToggling, handleToggle } = useCompletionToggle(done, onToggle);

  const { thumbnail } = getTaskMeta(experience.id);
  const difficulty = getDifficulty(experience.id, experience.difficulty);

  const hasListActions = onSave !== undefined && onRemoveSaved !== undefined;
  const actionState = resolveExperienceCardActionState(Boolean(saved), done);

  if (prevDone !== done) {
    const justCompleted = done && !prevDone;

    setPrevDone(done);

    if (justCompleted) {
      setIsCelebrating(true);
    }
  }

  useEffect(() => {
    if (!isCelebrating) return;

    const timeout = window.setTimeout(() => {
      setIsCelebrating(false);
    }, 650);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isCelebrating]);

  return (
    <li
      className={[
        "task-card relative rounded-card transition-colors duration-200",
        "hover:bg-surface-subtle",
        done ? "is-done" : "",
        isCelebrating ? "is-celebrating" : "",
        className,
      ].join(" ")}
    >
      <Link
        href={getExperienceHref(experience)}
        aria-label={experience.title}
        data-experience-link="true"
        scroll
        className="absolute inset-0 z-10 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      />

      <div className="pointer-events-none flex items-center gap-3 rounded-card p-2.5">
        <ExperienceImage
          imageUrl={experience.image_url}
          imageAlt={experience.image_alt}
          title={experience.title}
          fallbackColor={thumbnail}
          sizes="56px"
          className={[
            "h-14 w-14 shrink-0 rounded-media transition-opacity",
            done ? COMPLETED_MEDIA : "",
          ].join(" ")}
        />

        <div className="min-w-0 flex-1">
          <span className="task-title-wrap">
            <span
              className={[
                "task-title line-clamp-2 text-sm font-semibold text-ink sm:truncate",
                done ? "line-through sm:no-underline" : "",
              ].join(" ")}
            >
              {experience.title}
            </span>

            <span
              aria-hidden="true"
              className="task-strike-line hidden sm:block"
            />
          </span>

          <ExperienceMeta
            className="mt-1.5"
            category={experience.category}
            difficulty={difficulty.label}
            location={experienceLocation(experience)}
            dimmed={done}
          />
        </div>

        {!guest && onManageCollections && (
          <button
            type="button"
            onClick={onManageCollections}
            aria-label={`Manage collections for ${experience.title}`}
            className="pointer-events-auto relative z-20 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <FolderPlus aria-hidden="true" className="h-4 w-4" />
          </button>
        )}

        {hasListActions || guest ? (
          <SaveDoneButtons
            state={actionState}
            guest={guest}
            title={experience.title}
            onSave={onSave ?? (() => {})}
            onRemoveSaved={onRemoveSaved ?? (() => {})}
            onComplete={handleToggle}
            onUncomplete={handleToggle}
            disabled={isToggling}
            className="pointer-events-auto relative z-20 shrink-0"
          />
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={`${
              done ? "Mark as incomplete" : "Mark as complete"
            }: ${experience.title}`}
            onClick={handleToggle}
            disabled={isToggling}
            className="pointer-events-auto relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-control outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="task-checkbox" aria-hidden="true">
              <Check className="task-checkmark h-3 w-3" strokeWidth={3} />
            </span>
          </button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={
              removeLabel
                ? `${removeLabel}: ${experience.title}`
                : `Remove ${experience.title}`
            }
            className="pointer-events-auto relative z-20 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
