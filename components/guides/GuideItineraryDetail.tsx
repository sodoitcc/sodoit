import type { GuideItem, GuideWithItems } from "@/lib/guides/types";
import { GUIDE_TYPE_LABELS } from "@/lib/guides/types";
import {
  MAX_GOOGLE_MAPS_ROUTE_STOPS,
  buildGoogleMapsDirectionsUrl,
} from "@/lib/guides/google-maps";
import { hasBriefingContent } from "@/lib/guides/spot-summary";
import { GuideCover } from "./GuideCover";
import { GuideActions } from "./GuideActions";
import { GuideHeader } from "./GuideHeader";
import { GuideSidebar } from "./GuideSidebar";
import { GuideItineraryItems } from "./GuideItineraryItems";
import { GuideBriefing } from "./GuideBriefing";

interface GuideItineraryDetailProps {
  guide: GuideWithItems;
  imageUrl: string | null;
  imageAlt: string | null;
  signedIn: boolean;
  initialSaved: boolean;
}

function itemToRouteStop(item: GuideItem) {
  return {
    googleMapsUrl: item.google_maps_url,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address,
    name: item.place_name || item.title,
  };
}

export function GuideItineraryDetail({
  guide,
  imageUrl,
  imageAlt,
  signedIn,
  initialSaved,
}: GuideItineraryDetailProps) {
  const items = guide.items;
  const routeUrl =
    items.length <= MAX_GOOGLE_MAPS_ROUTE_STOPS
      ? buildGoogleMapsDirectionsUrl(
          items.map(itemToRouteStop),
          guide.route_mode,
        )
      : null;

  const metaParts = [
    guide.city,
    `${items.length} ${items.length === 1 ? "spot" : "spots"}`,
    guide.duration_label,
    guide.best_time ? `Best time: ${guide.best_time}` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="mx-auto mt-8 max-w-[1440px]">
      <GuideHeader
        typeLabel={GUIDE_TYPE_LABELS.itinerary}
        title={guide.title}
        description={guide.description}
        metaParts={metaParts}
        actions={
          <GuideActions
            guideId={guide.id}
            title={guide.title}
            signedIn={signedIn}
            initialSaved={initialSaved}
            routeUrl={routeUrl}
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
            <section id="itinerary" className="scroll-mt-24">
              <div className="mb-2 border-b border-border pb-2">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  Spots
                </h2>
              </div>

              <GuideItineraryItems items={items} />
            </section>
          )}

          {hasBriefingContent(guide.description) && (
            <GuideBriefing
              heading="Why this route works"
              description={guide.description as string}
            />
          )}
        </div>

        <GuideSidebar
          facts={[
            { label: "Spots", value: String(items.length) },
            ...(guide.duration_label
              ? [{ label: "Duration", value: guide.duration_label }]
              : []),
            ...(guide.best_time
              ? [{ label: "Best time", value: guide.best_time }]
              : []),
            ...(guide.route_mode
              ? [
                  {
                    label: "Travel",
                    value:
                      guide.route_mode.charAt(0).toUpperCase() +
                      guide.route_mode.slice(1),
                  },
                ]
              : []),
          ]}
          routeUrl={routeUrl}
          routeLabel="Open route"
          localTip={guide.local_tip}
        />
      </div>
    </div>
  );
}
