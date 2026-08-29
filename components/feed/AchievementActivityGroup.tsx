import { createElement } from "react";
import { getAchievementIcon } from "@/app/(app)/achievements/data";
import type { AchievementActivityGroupItem } from "@/app/(app)/feed/achievement-aggregation";
import { ActivityActorLine } from "./ActivityActorLine";
import { ActivityCardShell } from "./ActivityCardShell";

const VISIBLE_COUNT = 4;

export function AchievementActivityGroup({
  item,
}: {
  item: AchievementActivityGroupItem;
}) {
  const count = item.achievements.length;

  if (count === 1) {
    const achievement = item.achievements[0];
    const Icon = getAchievementIcon(achievement.icon ?? "");

    return (
      <ActivityCardShell className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark sm:h-12 sm:w-12">
          {createElement(Icon, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
        </div>

        <div className="min-w-0 flex-1">
          <ActivityActorLine
            actor={item.actor}
            timestamp={item.timestamp}
            action="unlocked an achievement"
          />
          <p className="mt-1 text-base font-bold leading-snug text-ink">
            {achievement.title}
          </p>
        </div>
      </ActivityCardShell>
    );
  }

  const needsOverflowCell = count > VISIBLE_COUNT;
  const visible = item.achievements.slice(
    0,
    needsOverflowCell ? VISIBLE_COUNT - 1 : VISIBLE_COUNT,
  );
  const overflow = count - visible.length;

  return (
    <ActivityCardShell className="p-3 sm:p-4">
      <ActivityActorLine
        actor={item.actor}
        timestamp={item.timestamp}
        action={`unlocked ${count} achievements`}
      />

      <div className="mt-3 grid grid-cols-4 gap-2">
        {visible.map((achievement) => {
          const Icon = getAchievementIcon(achievement.icon ?? "");

          return (
            <div
              key={achievement.id}
              title={achievement.title}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark">
                {createElement(Icon, { className: "h-5 w-5" })}
              </div>
              <span className="w-full truncate text-center text-[11px] font-medium text-secondary">
                {achievement.title}
              </span>
            </div>
          );
        })}

        {overflow > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-secondary">
              +{overflow}
            </div>
            <span className="text-[11px] font-medium text-muted">more</span>
          </div>
        )}
      </div>
    </ActivityCardShell>
  );
}
