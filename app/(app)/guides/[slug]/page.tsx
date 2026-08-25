import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, ListOrdered, MapPin } from "lucide-react";

import { GuideCover } from "@/components/guides/GuideCover";
import { GuideItinerary } from "@/components/guides/GuideItinerary";
import { ShareGuideButton } from "@/components/guides/ShareGuideButton";
import { getGuideBySlug, getGuideResolvedImages } from "@/lib/guides/queries";

const loadGuide = cache(async (slug: string) => {
  const guide = await getGuideBySlug(slug);

  if (guide || process.env.NODE_ENV !== "development") {
    return guide;
  }

  const { getDevPreviewGuideBySlug } = await import("@/lib/guides/dev-preview");

  return getDevPreviewGuideBySlug(slug);
});

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuide(slug);

  if (!guide) {
    return {
      title: "Guide not found | Sodoit",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${guide.title} | Sodoit`,
    description:
      guide.description ?? `A curated Sodoit guide to ${guide.city}.`,
  };
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await loadGuide(slug);

  if (!guide) {
    notFound();
  }

  const isCollection = guide.type === "collection";
  const stopWord = isCollection ? "places" : "stops";
  const stopWordCapitalized = isCollection ? "Places" : "Stops";

  const resolvedImages = await getGuideResolvedImages([guide]);
  const resolvedImage = resolvedImages[guide.id];
  const imageUrl = resolvedImage?.url ?? guide.cover_image_url;
  const imageAlt = resolvedImage?.alt ?? guide.cover_image_alt;

  return (
    <article className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        href="/discovery"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Back to Discovery
      </Link>

      <div className="mx-auto mt-8 max-w-[1440px]">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <span className="inline-flex items-center gap-1 text-accent-dark">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                {guide.city}
              </span>

              {guide.duration_label && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{guide.duration_label}</span>
                </>
              )}

              <span aria-hidden="true">·</span>

              <span>
                {guide.items.length} {stopWord}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.025em] text-ink sm:text-4xl lg:text-5xl">
              {guide.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ShareGuideButton title={guide.title} />
          </div>
        </header>

        <GuideCover
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          title={guide.title}
          priority
          sizes="(min-width: 900px) 900px, 100vw"
          className="mt-7 aspect-[16/9] w-full rounded-media object-cover"
        />

        <div className="mt-6 flex items-center gap-8 border-y border-border py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-secondary">
              <ListOrdered aria-hidden="true" className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                {stopWordCapitalized}
              </p>
              <p className="text-sm font-bold text-ink">{guide.items.length}</p>
            </div>
          </div>

          {guide.duration_label && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-secondary">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Duration
                </p>
                <p className="text-sm font-bold text-ink">
                  {guide.duration_label}
                </p>
              </div>
            </div>
          )}
        </div>

        {guide.description && (
          <section className="mt-10 rounded-media bg-accent-wash px-6 py-7 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">
              The plan
            </p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink sm:text-lg">
              {guide.description}
            </p>
          </section>
        )}

        {guide.items.length > 0 && (
          <section id="itinerary" className="mt-12 scroll-mt-24">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Your route
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                  {isCollection ? "Explore this collection" : "Your itinerary"}
                </h2>
              </div>

              <span className="shrink-0 text-sm text-muted">
                {guide.items.length} {stopWord}
              </span>
            </div>

            <GuideItinerary items={guide.items} />
          </section>
        )}
      </div>
    </article>
  );
}
