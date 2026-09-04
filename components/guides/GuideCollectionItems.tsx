import type { GuideItem } from "@/lib/guides/types";
import { GuideCollectionItem } from "./GuideCollectionItem";

export function GuideCollectionItems({ items }: { items: GuideItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul>
      {items.map((item, index) => (
        <GuideCollectionItem key={item.id} item={item} index={index} />
      ))}
    </ul>
  );
}
