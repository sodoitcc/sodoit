import type { GuideItem } from "@/lib/guides/types";
import { GuideItineraryItem } from "./GuideItineraryItem";

export function GuideCollectionItems({ items }: { items: GuideItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul>
      {items.map((item, index) => (
        <GuideItineraryItem
          key={item.id}
          item={item}
          index={index}
          isLast={index === items.length - 1}
        />
      ))}
    </ul>
  );
}
