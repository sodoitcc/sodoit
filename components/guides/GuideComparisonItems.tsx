import { ArrowRight, X } from "lucide-react";
import type { GuideComparisonPair } from "@/lib/guides/types";

export function GuideComparisonItems({
  pairs,
}: {
  pairs: GuideComparisonPair[];
}) {
  if (pairs.length === 0) return null;

  return (
    <ol className="flex flex-col gap-4">
      {pairs.map((pair) => (
        <li
          key={pair.id}
          className="rounded-card border border-border/60 bg-surface p-4"
        >
          <div className="flex items-start gap-2">
            <X
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-danger"
            />
            <div>
              <p className="text-sm font-bold text-ink">{pair.skip_title}</p>
              {pair.skip_description && (
                <p className="mt-1 text-sm text-secondary">
                  {pair.skip_description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <ArrowRight
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            />
            <div>
              <p className="text-sm font-bold text-ink">
                {pair.go_instead_title}
              </p>
              {pair.go_instead_description && (
                <p className="mt-1 text-sm text-secondary">
                  {pair.go_instead_description}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
