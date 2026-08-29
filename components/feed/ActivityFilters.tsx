import Link from "next/link";
import type { ActivityFilter } from "@/app/(app)/feed/data";

const FILTER_LABELS: Record<VisibleActivityFilter, string> = {
  all: "All",
  completed: "Completed",
  collections: "Collections",
};

type VisibleActivityFilter = Exclude<ActivityFilter, "added_to_list">;

export const VISIBLE_ACTIVITY_FILTERS: readonly VisibleActivityFilter[] = [
  "all",
  "completed",
  "collections",
];

const FILTER_ORDER = VISIBLE_ACTIVITY_FILTERS;

export function ActivityFilters({ active }: { active: ActivityFilter }) {
  return (
    <div
      role="group"
      aria-label="Activity filters"
      className="flex flex-wrap gap-2"
    >
      {FILTER_ORDER.map((filter) => {
        const selected = filter === active;
        const href = filter === "all" ? "/feed" : `/feed?filter=${filter}`;

        return (
          <Link
            key={filter}
            href={href}
            aria-pressed={selected}
            className={[
              "inline-flex h-8 shrink-0 items-center rounded-control border px-3.5 text-xs font-semibold transition-colors",
              selected
                ? "border-accent/40 bg-accent-wash text-accent-dark"
                : "border-border bg-surface text-secondary hover:border-border-strong hover:text-ink",
            ].join(" ")}
          >
            {FILTER_LABELS[filter]}
          </Link>
        );
      })}
    </div>
  );
}
