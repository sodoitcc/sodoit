import type { GuideComparisonPair } from "@/lib/guides/types";
import { GuideComparisonSide } from "./GuideComparisonSide";

export function GuideComparisonPairRow({
  pair,
  index,
}: {
  pair: GuideComparisonPair;
  index: number;
}) {
  return (
    <li className="border-b border-border/60 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <span
        aria-hidden="true"
        className="text-xs font-bold tabular-nums text-muted"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <GuideComparisonSide
          kind="skip"
          title={pair.skip_title}
          description={pair.skip_description}
          neighborhood={pair.skip_neighborhood}
          address={pair.skip_address}
          latitude={pair.skip_latitude}
          longitude={pair.skip_longitude}
          googleMapsUrl={pair.skip_google_maps_url}
          externalUrl={pair.skip_external_url}
          tags={pair.skip_tags}
        />

        <GuideComparisonSide
          kind="instead"
          title={pair.go_instead_title}
          description={pair.go_instead_description}
          neighborhood={pair.go_instead_neighborhood}
          address={pair.go_instead_address}
          latitude={pair.go_instead_latitude}
          longitude={pair.go_instead_longitude}
          googleMapsUrl={pair.go_instead_google_maps_url}
          externalUrl={pair.go_instead_external_url}
          tags={pair.go_instead_tags}
        />
      </div>

      {pair.reason && (
        <p className="mt-3 text-[13px] leading-5 text-secondary">
          <span className="font-bold text-accent-dark">Why — </span>
          {pair.reason}
        </p>
      )}
    </li>
  );
}
