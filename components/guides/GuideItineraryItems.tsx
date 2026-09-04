import type { GuideItem } from "@/lib/guides/types";
import { deriveTimelineState } from "@/lib/guides/timeline";
import { GuideItineraryStop } from "./GuideItineraryStop";

export function GuideItineraryItems({ items }: { items: GuideItem[] }) {
  if (items.length === 0) return null;

  return (
    <ol>
      {items.map((item, index) => (
        <GuideItineraryStop
          key={item.id}
          item={item}
          state={deriveTimelineState(index, items.length)}
          isLast={index === items.length - 1}
        />
      ))}
    </ol>
  );
}
