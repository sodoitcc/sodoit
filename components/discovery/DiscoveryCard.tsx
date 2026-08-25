import Link from "next/link";

import type { Guide } from "@/lib/guides/types";
import type { GuideResolvedImage } from "@/lib/guides/queries";
import { GuideCover } from "@/components/guides/GuideCover";

export function DiscoveryCard({
  guide,
  stopCount,
  priority = false,
  image,
}: {
  guide: Guide;
  stopCount?: number;
  priority?: boolean;
  image?: GuideResolvedImage | null;
}) {
  const meta = [stopCount ? `${stopCount} stops` : null, guide.duration_label]
    .filter(Boolean)
    .join(" · ");

  const imageUrl = image?.url ?? guide.cover_image_url;
  const imageAlt = image?.alt ?? guide.cover_image_alt;

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
    >
      <article className="flex h-full flex-col">
        <GuideCover
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          title={guide.title}
          priority={priority}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10] w-full rounded-media"
        />

        <div className="flex flex-1 flex-col pt-3">
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug tracking-[-0.015em] text-ink transition-colors group-hover:text-accent-dark sm:text-lg">
            {guide.title}
          </h3>

          {guide.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-secondary">
              {guide.description}
            </p>
          )}

          {meta && (
            <p className="mt-2 text-xs font-semibold text-muted">{meta}</p>
          )}
        </div>
      </article>
    </Link>
  );
}
