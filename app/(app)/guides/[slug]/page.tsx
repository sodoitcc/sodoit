import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { GuideCollectionDetail } from "@/components/guides/GuideCollectionDetail";
import { GuideComparisonDetail } from "@/components/guides/GuideComparisonDetail";
import { GuideItineraryDetail } from "@/components/guides/GuideItineraryDetail";
import { getGuideBySlug, getGuideResolvedImages } from "@/lib/guides/queries";
import { getGuideRenderer } from "@/lib/guides/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { isGuideSaved } from "@/lib/guides/saved";
import { SITE_URL } from "@/lib/site";
import { isValidPublicImageUrl } from "@/lib/seo/image";

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
      title: "Guide not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    guide.description ?? `A curated Sodoit guide to ${guide.city}.`;
  const canonical = `${SITE_URL}/guides/${guide.slug}`;
  const hasImage = isValidPublicImageUrl(guide.cover_image_url);

  return {
    title: guide.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: guide.title,
      description,
      url: canonical,
      images: hasImage
        ? [
            {
              url: guide.cover_image_url as string,
              alt: guide.cover_image_alt || guide.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: hasImage ? "summary_large_image" : "summary",
      title: guide.title,
      description,
      images: hasImage ? [guide.cover_image_url as string] : undefined,
    },
  };
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await loadGuide(slug);

  if (!guide) {
    notFound();
  }

  const renderer = getGuideRenderer(guide.type);

  const resolvedImages = await getGuideResolvedImages([guide]);
  const resolvedImage = resolvedImages[guide.id];
  const imageUrl = resolvedImage?.url ?? guide.cover_image_url;
  const imageAlt = resolvedImage?.alt ?? guide.cover_image_alt;

  const user = await getCurrentUser();
  let initialSaved = false;

  if (user) {
    const supabase = await createClient();
    initialSaved = await isGuideSaved(supabase, user.id, guide.id);
  }

  const signedIn = Boolean(user);

  const backLink = (
    <Link
      href="/discovery"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      Back to Discovery
    </Link>
  );

  return (
    <article className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {backLink}

      {renderer === "itinerary" && (
        <GuideItineraryDetail
          guide={guide}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          signedIn={signedIn}
          initialSaved={initialSaved}
        />
      )}

      {renderer === "collection" && (
        <GuideCollectionDetail
          guide={guide}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          signedIn={signedIn}
          initialSaved={initialSaved}
        />
      )}

      {renderer === "comparison" && (
        <GuideComparisonDetail
          guide={guide}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          signedIn={signedIn}
          initialSaved={initialSaved}
        />
      )}
    </article>
  );
}
