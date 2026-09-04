import type { GuideWithItems } from "@/lib/guides/types";
import { getCollectionPresentation } from "@/lib/guides/collection-presentation";
import { hasBriefingContent } from "@/lib/guides/spot-summary";
import { GuideCover } from "./GuideCover";
import { GuideActions } from "./GuideActions";
import { GuideHeader } from "./GuideHeader";
import { GuideSidebar } from "./GuideSidebar";
import { GuideCollectionItems } from "./GuideCollectionItems";
import { GuideBriefing } from "./GuideBriefing";

interface GuideCollectionDetailProps {
  guide: GuideWithItems;
  imageUrl: string | null;
  imageAlt: string | null;
  signedIn: boolean;
  initialSaved: boolean;
}

export function GuideCollectionDetail({
  guide,
  imageUrl,
  imageAlt,
  signedIn,
  initialSaved,
}: GuideCollectionDetailProps) {
  const items = guide.items;
  const presentation = getCollectionPresentation(guide.type);

  const metaParts = [
    guide.city,
    `${items.length} ${items.length === 1 ? "spot" : "spots"}`,
    guide.best_time ? `Best time: ${guide.best_time}` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="mx-auto mt-8 max-w-[1440px]">
      <GuideHeader
        typeLabel={presentation.label}
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
          {items.length > 0 && (
            <section id="collection" className="scroll-mt-24">
              <div className="mb-2 border-b border-border pb-2">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  {presentation.sectionHeading}
                </h2>
              </div>

              <GuideCollectionItems items={items} />
            </section>
          )}

          {hasBriefingContent(guide.description) && (
            <GuideBriefing
              heading="Why these spots?"
              description={guide.description as string}
            />
          )}
        </div>

        <GuideSidebar
          facts={[
            { label: "Spots", value: String(items.length) },
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
