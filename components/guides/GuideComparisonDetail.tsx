import type { GuideWithItems } from "@/lib/guides/types";
import { GUIDE_TYPE_LABELS } from "@/lib/guides/types";
import { hasBriefingContent } from "@/lib/guides/spot-summary";
import { GuideCover } from "./GuideCover";
import { GuideActions } from "./GuideActions";
import { GuideHeader } from "./GuideHeader";
import { GuideSidebar } from "./GuideSidebar";
import { GuideComparisonItems } from "./GuideComparisonItems";
import { GuideBriefing } from "./GuideBriefing";

interface GuideComparisonDetailProps {
  guide: GuideWithItems;
  imageUrl: string | null;
  imageAlt: string | null;
  signedIn: boolean;
  initialSaved: boolean;
}

export function GuideComparisonDetail({
  guide,
  imageUrl,
  imageAlt,
  signedIn,
  initialSaved,
}: GuideComparisonDetailProps) {
  const pairs = guide.comparisons ?? [];

  const metaParts = [
    guide.city,
    `${pairs.length} ${pairs.length === 1 ? "swap" : "swaps"}`,
    guide.best_time ? `Best time: ${guide.best_time}` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="mx-auto mt-8 max-w-[1440px]">
      <GuideHeader
        typeLabel={GUIDE_TYPE_LABELS.worth_it_or_skip_it}
        title={guide.title}
        description={guide.description}
        metaParts={metaParts}
        actions={
          <GuideActions
            guideId={guide.id}
            title={guide.title}
            signedIn={signedIn}
            initialSaved={initialSaved}
          />
        }
      />

      {imageUrl && (
        <GuideCover
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          title={guide.title}
          priority
          sizes="(min-width: 900px) 900px, 100vw"
          className="mt-3 aspect-[21/9] max-h-[160px] w-full rounded-media object-cover sm:mt-4 sm:max-h-[280px]"
        />
      )}

      <div className="mt-4 sm:mt-6 lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          {pairs.length > 0 && (
            <section id="comparison" className="scroll-mt-24">
              <div className="mb-2 border-b border-border pb-2">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  {pairs.length} {pairs.length === 1 ? "swap" : "swaps"} to
                  upgrade your trip
                </h2>
              </div>

              <GuideComparisonItems pairs={pairs} />
            </section>
          )}

          {hasBriefingContent(guide.description) && (
            <GuideBriefing
              heading="Why these swaps?"
              description={guide.description as string}
            />
          )}
        </div>

        <GuideSidebar
          facts={[
            { label: "Swaps", value: String(pairs.length) },
            ...(guide.best_time
              ? [{ label: "Best time", value: guide.best_time }]
              : []),
          ]}
          localTip={guide.local_tip}
        />
      </div>
    </div>
  );
}
