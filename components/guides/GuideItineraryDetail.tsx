import { ExternalLink, MapPin, Sparkles } from "lucide-react";
import type { GuideItem, GuideWithItems } from "@/lib/guides/types";
import { GUIDE_TYPE_LABELS } from "@/lib/guides/types";
import {
  MAX_GOOGLE_MAPS_ROUTE_STOPS,
  buildGoogleMapsDirectionsUrl,
} from "@/lib/guides/google-maps";
import { GuideCover } from "./GuideCover";
import { GuideActions } from "./GuideActions";
import { GuideItineraryItems } from "./GuideItineraryItems";

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

  return (
    <div className="mx-auto mt-8 max-w-[1440px]">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <span className="inline-flex items-center gap-1 text-accent-dark">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {guide.city}
            </span>

            <span aria-hidden="true">·</span>
            <span>{GUIDE_TYPE_LABELS.itinerary}</span>

            {guide.duration_label && (
              <>
                <span aria-hidden="true">·</span>
                <span>{guide.duration_label}</span>
              </>
            )}

            <span aria-hidden="true">·</span>
            <span>
              {items.length} {items.length === 1 ? "stop" : "stops"}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-ink sm:text-4xl lg:text-5xl">
            {guide.title}
          </h1>

          {guide.description && (
            <p className="mt-3 max-w-xl text-base leading-7 text-secondary">
              {guide.description}
            </p>
          )}
        </div>
      </header>

      <GuideActions
        guideId={guide.id}
        title={guide.title}
        signedIn={signedIn}
        initialSaved={initialSaved}
        routeUrl={routeUrl}
        className="mt-6"
      />

      <GuideCover
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        title={guide.title}
        priority
        sizes="(min-width: 900px) 900px, 100vw"
        className="mt-7 aspect-[16/9] w-full rounded-media object-cover"
      />

      <div className="mt-10 lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-12">
        <div className="min-w-0">
          {guide.local_tip && (
            <section className="rounded-media bg-accent-wash px-6 py-6 sm:px-7">
              <p className="flex items-start gap-2.5 text-sm leading-6 text-ink sm:text-base">
                <Sparkles
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark"
                />
                <span>
                  <span className="font-bold text-accent-dark">
                    Local tip —{" "}
                  </span>
                  {guide.local_tip}
                </span>
              </p>
            </section>
          )}

          {items.length > 0 && (
            <section
              id="itinerary"
              className={`scroll-mt-24 ${guide.local_tip ? "mt-10" : "mt-2"}`}
            >
              <div className="mb-6 border-b border-border pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Your route
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                  Your itinerary
                </h2>
              </div>

              <GuideItineraryItems items={items} />
            </section>
          )}
        </div>

        <aside className="mt-10 lg:mt-0">
          <div className="rounded-media border border-border/60 p-5 lg:sticky lg:top-24">
            <dl className="divide-y divide-border/70">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-sm text-muted">Stops</dt>
                <dd className="text-sm font-bold text-ink">{items.length}</dd>
              </div>

              {guide.duration_label && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-muted">Duration</dt>
                  <dd className="text-sm font-bold text-ink">
                    {guide.duration_label}
                  </dd>
                </div>
              )}

              {guide.best_time && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-muted">Best time</dt>
                  <dd className="text-right text-sm font-bold text-ink">
                    {guide.best_time}
                  </dd>
                </div>
              )}

              {guide.route_mode && (
                <div className="flex items-center justify-between py-2.5 capitalize last:pb-0">
                  <dt className="text-sm text-muted">Travel</dt>
                  <dd className="text-sm font-bold text-ink">
                    {guide.route_mode}
                  </dd>
                </div>
              )}
            </dl>

            {routeUrl && (
              <a
                href={routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                Open route
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
