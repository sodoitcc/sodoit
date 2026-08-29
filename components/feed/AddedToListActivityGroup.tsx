import Link from "next/link";
import { ExperienceImage } from "@/components/ui";
import type { AddedToListGroupItem } from "@/app/(app)/feed/added-to-list-aggregation";
import { ActivityActorLine } from "./ActivityActorLine";
import { ActivityCardShell } from "./ActivityCardShell";

const VISIBLE_COUNT = 4;
const FALLBACK_COLORS = ["#FED7AA", "#BAE6FD", "#BBF7D0", "#E9D5FF", "#FECACA"];

function fallbackColorFor(id: string) {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export function AddedToListActivityGroup({
  item,
}: {
  item: AddedToListGroupItem;
}) {
  const count = item.experiences.length;

  if (count === 1) {
    const experience = item.experiences[0];

    return (
      <ActivityCardShell className="flex items-center gap-3 p-3 sm:p-4">
        <Link
          href={`/tasks/${experience.id}`}
          className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-md"
        >
          <ExperienceImage
            imageUrl={experience.imageUrl}
            imageAlt={experience.imageAlt}
            title={experience.title}
            fallbackColor={fallbackColorFor(experience.id)}
            className="h-full w-full"
            sizes="48px"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <ActivityActorLine
            actor={item.actor}
            timestamp={item.timestamp}
            action="added to their list"
          />
          <Link
            href={`/tasks/${experience.id}`}
            className="mt-0.5 block truncate text-sm font-semibold text-ink hover:text-accent-dark"
          >
            {experience.title}
          </Link>
        </div>
      </ActivityCardShell>
    );
  }

  const needsOverflowCell = count > VISIBLE_COUNT;
  const visible = item.experiences.slice(
    0,
    needsOverflowCell ? VISIBLE_COUNT - 1 : VISIBLE_COUNT,
  );
  const overflow = count - visible.length;

  return (
    <ActivityCardShell className="p-3 sm:p-4">
      <ActivityActorLine
        actor={item.actor}
        timestamp={item.timestamp}
        action={`added ${count} things to their list`}
      />

      <div className="mt-3 grid grid-cols-4 gap-2">
        {visible.map((experience) => (
          <Link
            key={experience.id}
            href={`/tasks/${experience.id}`}
            title={experience.title}
            className="relative block aspect-square w-full overflow-hidden rounded-md"
          >
            <ExperienceImage
              imageUrl={experience.imageUrl}
              imageAlt={experience.imageAlt}
              title={experience.title}
              fallbackColor={fallbackColorFor(experience.id)}
              className="h-full w-full"
              sizes="120px"
            />
          </Link>
        ))}

        {overflow > 0 && (
          <div className="flex aspect-square w-full items-center justify-center rounded-md bg-surface-subtle text-sm font-semibold text-secondary">
            +{overflow}
          </div>
        )}
      </div>
    </ActivityCardShell>
  );
}
