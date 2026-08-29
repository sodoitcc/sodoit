import { Avatar } from "@/components/ui";
import { relativeTime } from "@/lib/relative-time";
import type { ActivityActor } from "@/app/(app)/feed/data";

export function ActivityActorLine({
  actor,
  timestamp,
  action,
}: {
  actor: ActivityActor;
  timestamp: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar name={actor.username} src={actor.avatarUrl} size="sm" />

      <p className="min-w-0 flex-1 text-sm leading-snug text-secondary">
        <span className="font-semibold text-ink">{actor.username}</span>{" "}
        {action}
        <span aria-hidden="true" className="mx-1.5 text-muted">
          ·
        </span>
        <time dateTime={timestamp} className="text-xs font-medium text-muted">
          {relativeTime(timestamp)}
        </time>
      </p>
    </div>
  );
}
