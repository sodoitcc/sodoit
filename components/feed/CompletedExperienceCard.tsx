import Link from "next/link";
import { ExperienceImage, ExperienceMeta } from "@/components/ui";
import { getExperienceHref } from "@/lib/experiences/href";
import type { ExperienceActivityItem } from "@/app/(app)/feed/data";
import { ActivityActorLine } from "./ActivityActorLine";
import { ActivityCardShell } from "./ActivityCardShell";
import { resolveCompletedExperienceMedia } from "./completed-experience-media";

const FALLBACK_COLORS = ["#FED7AA", "#BAE6FD", "#BBF7D0", "#E9D5FF", "#FECACA"];

function fallbackColorFor(id: string) {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export function CompletedExperienceCard({
  item,
}: {
  item: ExperienceActivityItem;
}) {
  const media = resolveCompletedExperienceMedia(item.experience);

  return (
    <ActivityCardShell>
      <div className="p-4 pb-3 sm:p-5 sm:pb-3">
        <ActivityActorLine
          actor={item.actor}
          timestamp={item.timestamp}
          action="completed an experience"
        />
      </div>

      <Link
        href={getExperienceHref(item.experience)}
        className="relative block aspect-[16/10] w-full"
      >
        <ExperienceImage
          imageUrl={media.imageUrl}
          imageAlt={media.imageAlt}
          title={item.experience.title}
          fallbackColor={fallbackColorFor(item.experience.id)}
          className="h-full w-full"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </Link>

      <div className="p-4 sm:p-5">
        <Link
          href={getExperienceHref(item.experience)}
          className="block text-xl font-bold leading-snug text-ink hover:text-accent-dark"
        >
          {item.experience.title}
        </Link>

        <ExperienceMeta
          className="mt-2"
          category={item.experience.category}
          difficulty={item.experience.difficulty ?? "Any level"}
          location={item.experience.location}
        />

        <Link
          href={getExperienceHref(item.experience)}
          className="mt-4 inline-block text-xs font-semibold text-accent-dark hover:text-accent"
        >
          View experience
        </Link>
      </div>
    </ActivityCardShell>
  );
}
