import { createElement } from "react";
import { getAchievementIcon } from "@/app/(app)/achievements/data";
import type { AchievementActivityItem } from "@/app/(app)/feed/data";
import { ActivityActorLine } from "./ActivityActorLine";
import { ActivityCardShell } from "./ActivityCardShell";

export function AchievementActivityCard({
  item,
}: {
  item: AchievementActivityItem;
}) {
  const Icon = getAchievementIcon(item.achievement.icon ?? "");

  return (
    <ActivityCardShell className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark sm:order-2 sm:h-16 sm:w-16 h-14 w-14">
        {createElement(Icon, { className: "h-7 w-7" })}
      </div>

      <div className="min-w-0 flex-1 sm:order-1">
        <ActivityActorLine
          actor={item.actor}
          timestamp={item.timestamp}
          action="unlocked an achievement"
        />

        <p className="mt-2 text-lg font-bold leading-snug text-ink">
          {item.achievement.title}
        </p>
      </div>
    </ActivityCardShell>
  );
}
