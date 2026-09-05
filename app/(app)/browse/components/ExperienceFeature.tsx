"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getExperienceHref } from "@/lib/experiences/href";
import { ExperienceMetaLine } from "./ExperienceMetaLine";
import { Badge, ExperienceImage, experienceLocation } from "@/components/ui";
import type { Experience } from "../types";
import { getDifficulty, getTaskMeta } from "../types";
import { useCompletionToggle } from "../hooks/useCompletionToggle";
import { ExperienceSaveControl } from "./ExperienceSaveControl";

interface ExperienceFeatureProps {
  experience: Experience;
  done: boolean;
  onToggle: () => Promise<void>;
  guest?: boolean;
  onGuestSave?: () => void;
}

export function ExperienceFeature({
  experience,
  done,
  onToggle,
  guest = false,
  onGuestSave,
}: ExperienceFeatureProps) {
  const { thumbnail } = getTaskMeta(experience.id);
  const difficulty = getDifficulty(experience.id, experience.difficulty);
  const { isToggling, handleToggle } = useCompletionToggle(done, onToggle);

  const location = experienceLocation(experience);

  return (
    <section className="h-full w-full min-w-0 overflow-hidden rounded-panel border border-border bg-surface lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <div className="relative h-[220px] sm:h-[280px] lg:h-full">
        <Link
          href={getExperienceHref(experience)}
          aria-label={`View ${experience.title}`}
          className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30"
        />

        <ExperienceImage
          imageUrl={experience.image_url}
          imageAlt={experience.image_alt}
          title={experience.title}
          fallbackColor={thumbnail}
          sizes="(min-width: 1024px) 55vw, 100vw"
          quality={90}
          priority
          className="h-full w-full object-cover"
        />

        <Badge
          variant="accent"
          className="absolute left-4 top-4 z-20 gap-1 bg-surface/95 font-bold shadow-sm backdrop-blur"
        >
          <Sparkles aria-hidden="true" className="h-3 w-3" />
          Today&apos;s pick
        </Badge>

        <div className="absolute right-4 top-4 z-20">
          <ExperienceSaveControl
            mode={guest ? "guest" : "toggle"}
            done={done}
            onClick={guest ? (onGuestSave ?? (() => {})) : handleToggle}
            disabled={!guest && isToggling}
            label={
              guest
                ? `Save ${experience.title}`
                : `${
                    done ? "Mark as incomplete" : "Mark as complete"
                  }: ${experience.title}`
            }
            className="border-white/70 bg-white/95 shadow-sm backdrop-blur"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-7 md:px-8">
        <Link
          href={getExperienceHref(experience)}
          className="group w-fit outline-none"
        >
          <h2 className="max-w-[520px] text-2xl font-extrabold leading-[1.05] tracking-[-0.025em] text-ink transition-colors group-hover:text-accent-dark sm:text-3xl">
            {experience.title}
          </h2>
        </Link>

        {experience.description && (
          <p className="mt-3 line-clamp-2 max-w-[520px] text-sm leading-6 text-secondary">
            {experience.description}
          </p>
        )}

        <div className="mt-4">
          <ExperienceMetaLine
            location={location}
            difficulty={difficulty.label}
            size="sm"
          />
        </div>

        <div className="mt-6">
          <Link
            href={getExperienceHref(experience)}
            className="inline-flex h-10 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            View experience
          </Link>
        </div>
      </div>{" "}
    </section>
  );
}
