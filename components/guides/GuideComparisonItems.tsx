import type { GuideComparisonPair } from "@/lib/guides/types";
import { GuideComparisonPairRow } from "./GuideComparisonPairRow";

export function GuideComparisonItems({
  pairs,
}: {
  pairs: GuideComparisonPair[];
}) {
  if (pairs.length === 0) return null;

  return (
    <ol>
      {pairs.map((pair, index) => (
        <GuideComparisonPairRow key={pair.id} pair={pair} index={index} />
      ))}
    </ol>
  );
}
