import { Check, ExternalLink, X } from "lucide-react";
import { buildGoogleMapsUrl } from "@/lib/guides/google-maps";

interface GuideComparisonSideProps {
  kind: "skip" | "instead";
  title: string;
  description: string | null;
  neighborhood?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  externalUrl?: string | null;
  tags?: string[] | null;
}

export function GuideComparisonSide({
  kind,
  title,
  description,
  neighborhood,
  address,
  latitude,
  longitude,
  googleMapsUrl,
  externalUrl,
  tags,
}: GuideComparisonSideProps) {
  const isSkip = kind === "skip";

  const metaLine = [...(tags ?? []).slice(0, 2), neighborhood]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" · ");

  const mapsUrl = buildGoogleMapsUrl({
    googleMapsUrl,
    latitude,
    longitude,
    address,
    name: title,
  });

  return (
    <div>
      <p
        className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] ${
          isSkip ? "text-muted" : "text-accent-dark"
        }`}
      >
        {isSkip ? (
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {isSkip ? "Skip" : "Instead"}
      </p>

      <p className="mt-1 text-[15px] font-bold text-ink sm:text-base">
        {title}
      </p>

      {metaLine && <p className="mt-0.5 text-[13px] text-muted">{metaLine}</p>}

      {description && (
        <p className="mt-1 text-[15px] leading-6 text-secondary">
          {description}
        </p>
      )}

      {(mapsUrl || externalUrl) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-accent-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-0"
              aria-label={`Open ${title} in Google Maps (opens in a new tab)`}
            >
              Open in Google Maps
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          )}

          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-0"
              aria-label={`Visit ${title} website (opens in a new tab)`}
            >
              Visit website
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
