import {
  getAchievementIcon,
  type AchievementDefinition,
} from "@/app/(app)/achievements/data";
import { EmptyState } from "@/components/ui";

interface ProfileAchievementsPreviewProps {
  earnedMilestoneIds: string[];
  achievements: AchievementDefinition[];
  limit?: number;
}

export function ProfileAchievementsPreview({
  earnedMilestoneIds,
  achievements,
  limit,
}: ProfileAchievementsPreviewProps) {
  const earnedIds = new Set(earnedMilestoneIds);

  const milestones = achievements.filter((milestone) =>
    earnedIds.has(milestone.id),
  );
  const visibleMilestones =
    limit === undefined ? milestones : milestones.slice(0, limit);

  if (visibleMilestones.length === 0) {
    return <EmptyState title="No achievements earned yet" />;
  }

  return (
    <ul className="divide-y divide-border">
      {visibleMilestones.map((milestone) => {
        const Icon = getAchievementIcon(milestone.icon);

        return (
          <li key={milestone.id} className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark">
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {milestone.title}
              </p>

              <p className="mt-0.5 truncate text-xs text-muted">
                {milestone.description}
              </p>
            </div>

            <span className="text-[11px] font-semibold text-accent-dark">
              Earned
            </span>
          </li>
        );
      })}
    </ul>
  );
}
