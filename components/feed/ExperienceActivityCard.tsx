import Link from "next/link";
import { ExperienceImage, ExperienceMeta } from "@/components/ui";
import type { ExperienceActivityItem } from "@/app/(app)/feed/data";
import { ActivityActorLine } from "./ActivityActorLine";
import { ActivityCardShell } from "./ActivityCardShell";
import { AddToListButton } from "./AddToListButton";

const FALLBACK_COLORS = ["#FED7AA", "#BAE6FD", "#BBF7D0", "#E9D5FF", "#FECACA"];

function fallbackColorFor(id: string) {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

const ACTION_TEXT: Record<ExperienceActivityItem["kind"], string> = {
  completed: "completed an experience",
  added_to_list: "added to their list",
};

interface ExperienceActivityCardProps {
  item: ExperienceActivityItem;
  viewerStatus: "saved" | "completed" | null;
  signedIn: boolean;
}

export function ExperienceActivityCard({
  item,
  viewerStatus,
  signedIn,
}: ExperienceActivityCardProps) {
  return (
    <ActivityCardShell className="lg:flex lg:items-stretch">
      <div className="flex flex-col justify-between gap-4 p-4 sm:p-5 lg:w-[42%] lg:shrink-0">
        <ActivityActorLine
          actor={item.actor}
          timestamp={item.timestamp}
          action={ACTION_TEXT[item.kind]}
        />

        <div>
          <Link
            href={`/tasks/${item.experience.id}`}
            className="block text-lg font-bold leading-snug text-ink hover:text-accent-dark"
          >
            {item.experience.title}
          </Link>

          <ExperienceMeta
            className="mt-2"
            category={item.experience.category}
            difficulty={item.experience.difficulty ?? "Any level"}
            location={item.experience.location}
          />

          <div className="mt-4">
            <AddToListButton
              experienceId={item.experience.id}
              initialStatus={viewerStatus}
              signedIn={signedIn}
            />
          </div>
        </div>
      </div>

      <Link
        href={`/tasks/${item.experience.id}`}
        className="relative block aspect-[16/10] w-full sm:aspect-[16/8] lg:aspect-auto lg:w-[58%]"
      >
        <ExperienceImage
          imageUrl={item.experience.imageUrl}
          imageAlt={item.experience.imageAlt}
          title={item.experience.title}
          fallbackColor={fallbackColorFor(item.experience.id)}
          className="h-full w-full"
          sizes="(min-width: 1024px) 58vw, 100vw"
        />
      </Link>
    </ActivityCardShell>
  );
}
