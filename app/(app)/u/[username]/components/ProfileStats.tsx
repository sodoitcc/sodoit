import { Bookmark, CheckCircle2, Layers3, Trophy } from "lucide-react";

interface ProfileStatsProps {
  completed: number;
  saved: number;
  collections: number;
  achievements: number;
}

export function ProfileStats({
  completed,
  saved,
  collections,
  achievements,
}: ProfileStatsProps) {
  const stats = [
    { icon: CheckCircle2, label: "Completed", value: completed },
    { icon: Bookmark, label: "Saved", value: saved },
    { icon: Layers3, label: "Collections", value: collections },
    { icon: Trophy, label: "Achievements", value: achievements },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-border py-4">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-secondary">
            <Icon aria-hidden="true" className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              {label}
            </p>
            <p className="text-sm font-bold text-ink">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
