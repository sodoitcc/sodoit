"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, MapPin } from "lucide-react";
import type { GuideItem } from "@/lib/guides/types";
import { buildGoogleMapsUrl } from "@/lib/guides/google-maps";
import { spotPreviewLine } from "@/lib/guides/spot-summary";

interface GuideSpotRowProps {
  item: GuideItem;
}

export function GuideSpotRow({ item }: GuideSpotRowProps) {
  const [open, setOpen] = useState(false);

  const showPlaceName =
    item.place_name &&
    item.place_name.trim().toLowerCase() !== item.title.trim().toLowerCase();

  const locationLine = [item.neighborhood, item.address]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" · ");

  const preview = spotPreviewLine(item.description);
  const tags = item.tags?.slice(0, 2) ?? [];
  const metaLine = [...tags, item.neighborhood]
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
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group flex min-h-11 w-full items-start gap-2 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="min-w-0 flex-1 py-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[17px] font-bold text-ink transition-colors group-hover:text-accent-dark sm:text-lg">
              {item.title}
            </span>

            {showPlaceName && (
              <span className="text-[13px] font-medium text-muted">
                {item.place_name}
              </span>
            )}
          </span>

          {!open && (
            <>
              {metaLine && (
                <p className="mt-0.5 text-[13px] text-muted">{metaLine}</p>
              )}

              {preview && (
                <p className="mt-1 line-clamp-1 text-[15px] text-secondary">
                  {preview}
                </p>
              )}
            </>
          )}
        </div>

        <ChevronDown
          aria-hidden="true"
          className={`mt-2 h-4 w-4 shrink-0 text-muted transition-transform motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="pb-3 pr-8">
          {locationLine && (
            <p className="flex items-center gap-1 text-[13px] text-muted">
              <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
              {locationLine}
            </p>
          )}

          {item.description && (
            <p className="mt-1.5 text-[15px] leading-6 text-secondary sm:text-base">
              {item.description}
            </p>
          )}

          {item.tags && item.tags.length > 0 && (
            <p className="mt-1.5 text-[13px] font-medium text-accent-dark">
              {item.tags.join(" · ")}
            </p>
          )}

          {(mapsUrl || item.external_url) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-accent-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-0"
                  aria-label={`Open ${item.title} in Google Maps (opens in a new tab)`}
                >
                  Open in Google Maps
                  <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </a>
              )}

              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-0"
                  aria-label={`Visit ${item.title} website (opens in a new tab)`}
                >
                  Visit website
                  <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
