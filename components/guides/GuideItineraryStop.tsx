import { ExternalLink, MapPin } from "lucide-react";
import type { GuideItem } from "@/lib/guides/types";
import { buildGoogleMapsUrl } from "@/lib/guides/google-maps";
import { GuideCover } from "./GuideCover";

interface GuideItineraryStopProps {
  item: GuideItem;
  index: number;
  isLast: boolean;
}

export function GuideItineraryStop({
  item,
  index,
  isLast,
}: GuideItineraryStopProps) {
  const showPlaceName =
    item.place_name &&
    item.place_name.trim().toLowerCase() !== item.title.trim().toLowerCase();

  const locationLine = [item.neighborhood, item.address]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" · ");

  const mapsUrl = buildGoogleMapsUrl({
    googleMapsUrl: item.google_maps_url,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address,
    name: item.place_name || item.title,
  });

  return (
    <li className="relative flex gap-4 pb-10 last:pb-0 sm:gap-6">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[19px] top-14 w-px bg-border sm:left-[27px]"
        />
      )}

      <span
        aria-hidden="true"
        className="relative z-10 shrink-0 pt-0.5 text-3xl font-extrabold leading-none tracking-[-0.03em] text-accent/30 sm:text-4xl"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        {item.image_url && (
          <GuideCover
            imageUrl={item.image_url}
            imageAlt={item.image_alt}
            title={item.title}
            sizes="(min-width: 768px) 640px, 100vw"
            className="mb-4 aspect-[16/9] w-full rounded-media object-cover"
          />
        )}

        <h3 className="text-lg font-bold leading-snug text-ink sm:text-xl">
          {item.title}
        </h3>

        {showPlaceName && (
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            {item.place_name}
          </p>
        )}

        {locationLine && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
            {locationLine}
          </p>
        )}

        {item.description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary sm:text-base">
            {item.description}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-accent-dark">
            {item.tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${item.title} on Google Maps (opens in a new tab)`}
            >
              View on Google Maps
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          )}

          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`Visit ${item.title} website (opens in a new tab)`}
            >
              Visit website
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
