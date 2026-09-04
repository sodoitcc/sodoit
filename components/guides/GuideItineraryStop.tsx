import type { GuideItem } from "@/lib/guides/types";
import type { TimelineNodeState } from "@/lib/guides/timeline";
import { GuideSpotRow } from "./GuideSpotRow";

interface GuideItineraryStopProps {
  item: GuideItem;
  state: TimelineNodeState;
  isLast: boolean;
}

const NODE_CLASS: Record<TimelineNodeState, string> = {
  start: "border-accent bg-accent",
  finish: "border-ink bg-ink",
  regular: "border-border-strong bg-surface",
};

export function GuideItineraryStop({
  item,
  state,
  isLast,
}: GuideItineraryStopProps) {
  return (
    <li className="relative flex gap-3">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[5px] top-6 w-px bg-border"
        />
      )}

      <span
        aria-hidden="true"
        className={`relative z-10 mt-3.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${NODE_CLASS[state]}`}
      />

      <div className="min-w-0 flex-1">
        <GuideSpotRow item={item} />
      </div>
    </li>
  );
}
