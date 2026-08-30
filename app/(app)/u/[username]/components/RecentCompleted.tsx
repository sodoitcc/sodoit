import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { EmptyState, ExperienceImage } from "@/components/ui";
import { getCategoryAccent } from "@/app/(app)/achievements/data";
import { getTaskMeta } from "@/app/(app)/browse/types";
import { getExperienceHref } from "@/lib/experiences/href";

import type { CompletedExperience } from "../types";

interface RecentCompletedProps {
  experiences: CompletedExperience[];
}

const PREVIEW_COUNT = 5;

export function RecentCompleted({ experiences }: RecentCompletedProps) {
  if (experiences.length === 0) {
    return (
      <EmptyState
        title="Nothing completed yet"
        description="Completed experiences will appear here."
      />
    );
  }

  const recentExperiences = experiences?.slice(0, PREVIEW_COUNT);

  return (
    <ul className="divide-y divide-border">
      {recentExperiences.map((experience) => (
        <ExperienceRow key={experience.id} experience={experience} />
      ))}
    </ul>
  );
}

function ExperienceRow({ experience }: { experience: CompletedExperience }) {
  const { thumbnail } = getTaskMeta(experience.id);

  return (
    <li>
      <Link
        href={getExperienceHref(experience)}
        className="group flex items-center gap-3 py-3 transition-colors hover:bg-surface-subtle"
      >
        <ExperienceImage
          title={experience.title}
          imageUrl={experience.image_url}
          imageAlt={experience.image_alt}
          fallbackColor={thumbnail}
          className="h-12 w-12 rounded-control"
          sizes="48px"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent-dark">
            {experience.title}
          </p>

          {experience.category && (
            <div className="mt-1 flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: getCategoryAccent(experience.category),
                }}
              />

              <span className="text-xs text-muted">{experience.category}</span>
            </div>
          )}
        </div>

        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-border transition-colors group-hover:text-muted"
        />
      </Link>
    </li>
  );
}
