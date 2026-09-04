import type { GuideItem } from "@/lib/guides/types";
import { GuideSpotRow } from "./GuideSpotRow";

interface GuideCollectionItemProps {
  item: GuideItem;
  index: number;
}

export function GuideCollectionItem({ item, index }: GuideCollectionItemProps) {
  return (
    <li className="flex gap-3 border-b border-border/60 first:pt-0 last:border-b-0 last:pb-0">
      <span
        aria-hidden="true"
        className="shrink-0 pt-3.5 text-xs font-bold tabular-nums text-muted"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <GuideSpotRow item={item} />
      </div>
    </li>
  );
}
