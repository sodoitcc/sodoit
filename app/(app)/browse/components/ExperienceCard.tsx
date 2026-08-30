"use client";

import Link from "next/link";
import { FolderPlus } from "lucide-react";

import { ExperienceImage, experienceLocation } from "@/components/ui";
import { getExperienceHref } from "@/lib/experiences/href";

import type { ExperienceCardData } from "../types";
import { getDifficulty, getTaskMeta } from "../types";
import { useCompletionToggle } from "../hooks/useCompletionToggle";
import { resolveExperienceCardActionState } from "../experience-card-state";
import { SaveButton } from "./SaveButton";
import { ExperienceSaveControl } from "./ExperienceSaveControl";
import { ExperienceListStateControl } from "./ExperienceListStateControl";
import { ExperienceMetaLine } from "./ExperienceMetaLine";
import { ExperienceSocialProof } from "./ExperienceSocialProof";
import { COMPLETED_MEDIA } from "./completedStyles";

interface ExperienceCardProps {
  experience: ExperienceCardData;
  done: boolean;
  onToggle: () => Promise<void>;
  saved?: boolean;
  onSave?: () => void;
  onRemoveSaved?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  onManageCollections?: () => void;
  guest?: boolean;
  onGuestSave?: () => void;
  className?: string;
  ratio?: "wide" | "standard";
  showCategory?: boolean;
  variant?: "default" | "related";
}

const RATIO_CLASS = {
  wide: "aspect-[16/9]",
  standard: "aspect-[4/3]",
} as const;

export function ExperienceCard({
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
  onGuestSave,
  className = "",
  ratio = "standard",
  showCategory = true,
  variant = "default",
}: ExperienceCardProps) {
  const { thumbnail } = getTaskMeta(experience.id);
  const difficulty = getDifficulty(experience.id, experience.difficulty);
  const { isToggling, handleToggle } = useCompletionToggle(done, onToggle);
  const usesListState = onSave !== undefined && onRemoveSaved !== undefined;
  const actionState = resolveExperienceCardActionState(Boolean(saved), done);

  const related = variant === "related";

  const imageRatio = related ? "aspect-[16/10]" : RATIO_CLASS[ratio];

  const titleClass = related
    ? "text-[15px] font-bold leading-5 sm:text-base"
    : ratio === "wide"
      ? "text-base font-bold sm:text-lg"
      : "text-sm font-semibold";

  return (
    <li
      className={[
        "group relative flex h-full min-w-0 flex-col",
        related ? "rounded-[20px] bg-surface" : "",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden",
          related ? "rounded-[18px]" : "rounded-card",
        ].join(" ")}
      >
        <Link
          href={getExperienceHref(experience)}
          aria-label={experience.title}
          className="absolute inset-0 z-10 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        />

        <ExperienceImage
          imageUrl={experience.image_url}
          imageAlt={experience.image_alt}
          title={experience.title}
          fallbackColor={thumbnail}
          sizes={
            related
              ? "(min-width: 1280px) 260px, (min-width: 768px) 30vw, 85vw"
              : ratio === "wide"
                ? "(min-width: 1024px) 45vw, 90vw"
                : "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
          }
          quality={90}
          className={[
            imageRatio,
            "w-full motion-safe:transition-transform motion-safe:duration-300",
            "motion-safe:group-hover:scale-[1.025]",
            done ? COMPLETED_MEDIA : "",
          ].join(" ")}
        />

        {!guest && onRemove && !related && (
          <div className="absolute left-2 top-2 z-20">
            <SaveButton
              label={
                removeLabel
                  ? `${removeLabel}: ${experience.title}`
                  : `Remove ${experience.title} from My List`
              }
              onClick={onRemove}
              saved
              className="bg-surface/90 backdrop-blur-sm"
            />
          </div>
        )}

        <div className="absolute right-2 top-2 z-20">
          {usesListState ? (
            <ExperienceListStateControl
              state={actionState}
              guest={guest}
              onSave={onSave!}
              onRemoveSaved={onRemoveSaved!}
              onUncomplete={handleToggle}
              disabled={isToggling}
              title={experience.title}
            />
          ) : (
            <ExperienceSaveControl
              mode={guest ? "guest" : "toggle"}
              done={done}
              onClick={guest ? (onGuestSave ?? (() => {})) : handleToggle}
              disabled={!guest && isToggling}
              label={
                guest
                  ? `Save ${experience.title}`
                  : `${done ? "Mark as incomplete" : "Mark as complete"}: ${experience.title}`
              }
            />
          )}
        </div>
      </div>

      <div
        className={[
          "flex min-w-0 flex-1 flex-col",
          related ? "px-1 pb-1 pt-3" : "pt-3",
        ].join(" ")}
      >
        <Link
          href={getExperienceHref(experience)}
          className="relative z-10 w-fit max-w-full outline-none"
        >
          <h3
            className={[
              "line-clamp-2 tracking-[-0.015em] text-ink transition-colors duration-200",
              "group-hover:text-accent-dark",
              titleClass,
            ].join(" ")}
          >
            {experience.title}
          </h3>
        </Link>

        <div className={related ? "mt-1.5" : "mt-1"}>
          <ExperienceMetaLine
            location={experienceLocation(experience)}
            difficulty={difficulty.label}
            category={experience.category}
            showCategory={showCategory}
            size={related ? "xs" : "xs"}
          />
        </div>

        <div
          className={[
            "flex min-w-0 items-center justify-between gap-2",
            related ? "mt-2" : "mt-1.5",
          ].join(" ")}
        >
          <ExperienceSocialProof savedCount={experience.saved_count} />

          {onManageCollections && !related && (
            <button
              type="button"
              onClick={onManageCollections}
              aria-label={`Manage collections for ${experience.title}`}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <FolderPlus aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
