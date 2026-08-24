import Link from "next/link";

import type { Guide } from "@/lib/guides/types";
import { GuideCover } from "@/components/guides/GuideCover";

interface DiscoveryFeaturedCardProps {
  guide: Guide;
  stopCount?: number;
}

export function DiscoveryFeaturedCard({
  guide,
  stopCount,
}: DiscoveryFeaturedCardProps) {
  const meta = [guide.duration_label, stopCount ? `${stopCount} stops` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="h-full overflow-hidden rounded-card border border-border bg-surface md:grid md:grid-cols-[1.08fr_0.92fr]">
      <div className="relative h-[220px] sm:h-[280px] md:h-full">
        <Link
          href={`/guides/${guide.slug}`}
          aria-label={`View ${guide.title}`}
          className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30"
        />

        <GuideCover
          imageUrl={guide.cover_image_url}
          imageAlt={guide.cover_image_alt}
          title={guide.title}
          priority
          sizes="(min-width: 768px) 55vw, 100vw"
          className="h-full w-full"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-7 md:px-8">
        <Link
          href={`/guides/${guide.slug}`}
          className="group w-fit outline-none"
        >
          <h2 className="max-w-[520px] text-2xl font-extrabold leading-[1.05] tracking-[-0.025em] text-ink transition-colors group-hover:text-accent-dark sm:text-3xl">
            {guide.title}
          </h2>
        </Link>

        {guide.description && (
          <p className="mt-3 line-clamp-2 max-w-[520px] text-sm leading-6 text-secondary">
            {guide.description}
          </p>
        )}

        {meta && (
          <p className="mt-4 text-xs font-semibold text-muted">{meta}</p>
        )}

        <div className="mt-6">
          <Link
            href={`/guides/${guide.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            Open plan
          </Link>
        </div>
      </div>
    </section>
  );
}
