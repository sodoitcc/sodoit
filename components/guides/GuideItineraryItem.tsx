import { ExternalLink } from "lucide-react";
import type { GuideItem } from "@/lib/guides/types";
import { GuideCover } from "./GuideCover";

interface GuideItineraryItemProps {
  item: GuideItem;
  index: number;
  isLast: boolean;
}

export function GuideItineraryItem({
  item,
  index,
  isLast,
}: GuideItineraryItemProps) {
  const showPlaceName =
    item.place_name &&
    item.place_name.trim().toLocaleLowerCase() !==
      item.title.trim().toLocaleLowerCase();

  const imageUrl = item.image_url;
  const imageAlt = item.image_alt;

  const imageLeft = index % 2 === 0;

  return (
    <li className="relative flex gap-2.5 pb-6 last:pb-0 sm:gap-3 md:pb-8">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[15px] top-8 w-px bg-border/70"
        />
      )}

      <span
        aria-hidden="true"
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent text-xs font-bold text-white"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <article
        className={`min-w-0 flex-1 md:flex md:items-stretch md:gap-6 md:rounded-card md:border md:border-border/60 md:bg-surface md:p-4 ${
          imageLeft ? "" : "md:flex-row-reverse"
        }`}
      >
        <div className="md:w-[44%] md:shrink-0">
          <GuideCover
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            title={item.title}
            sizes="(min-width: 768px) 44vw, 100vw"
            className="aspect-[16/10] w-full rounded-media object-cover"
          />
        </div>

        <div className="mt-3 min-w-0 flex-1 md:mt-0 md:flex md:flex-col md:justify-center">
          <h3 className="text-lg font-bold leading-snug text-ink sm:text-xl">
            {item.title}
          </h3>

          {showPlaceName && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              {item.place_name}
            </p>
          )}

          {item.description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-secondary sm:text-base">
              {item.description}
            </p>
          )}

          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-accent-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${item.title} (opens in a new tab)`}
            >
              View place
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </article>
    </li>
  );
}
