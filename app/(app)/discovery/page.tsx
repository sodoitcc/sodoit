import type { Metadata } from "next";

import type { DiscoveryCategorySlug } from "@/components/discovery/DiscoveryCategories";
import { DiscoveryExperiencesSection } from "@/components/discovery/DiscoveryExperiencesSection";
import { DiscoveryFeaturedCard } from "@/components/discovery/DiscoveryFeaturedCard";
import { DiscoveryGrid } from "@/components/discovery/DiscoveryGrid";
import { DiscoveryHero } from "@/components/discovery/DiscoveryHero";

import { getDiscoveryExperiences } from "@/lib/discovery/experiences";
import {
  getGuideCities,
  getGuideItemCounts,
  getGuideResolvedImages,
  getPublicGuides,
} from "@/lib/guides/queries";
import type { Guide } from "@/lib/guides/types";

export const metadata: Metadata = {
  title: "Discovery",
  description:
    "Curated itineraries, collections, and local recommendations for your next city.",
};

interface DiscoveryPageProps {
  searchParams: Promise<{
    city?: string;
    q?: string;
    category?: string;
  }>;
}

const CATEGORY_SEARCH_TERMS: Partial<Record<DiscoveryCategorySlug, string>> = {
  food: "food",
  outdoors: "outdoor",
  kids: "kids",
  "hidden-gems": "hidden",
};

function cityCounts(guides: Guide[]) {
  const counts = new Map<string, number>();

  for (const guide of guides) {
    counts.set(guide.city, (counts.get(guide.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => a.city.localeCompare(b.city));
}

function matchesQuery(guide: Guide, query: string) {
  const needle = query.toLowerCase();

  return (
    guide.title.toLowerCase().includes(needle) ||
    (guide.description?.toLowerCase().includes(needle) ?? false)
  );
}

async function loadGuides(): Promise<Guide[]> {
  const guides = await getPublicGuides();

  if (guides.length > 0 || process.env.NODE_ENV !== "development") {
    return guides;
  }

  const { getDevPreviewGuides } = await import("@/lib/guides/dev-preview");

  return getDevPreviewGuides();
}

async function loadItemCounts(
  guideIds: string[],
): Promise<Record<string, number>> {
  if (guideIds.length === 0) {
    return {};
  }

  if (
    process.env.NODE_ENV === "development" &&
    guideIds[0].startsWith("preview-")
  ) {
    const { getDevPreviewItemCounts } =
      await import("@/lib/guides/dev-preview");

    return getDevPreviewItemCounts();
  }

  return getGuideItemCounts(guideIds);
}

export default async function DiscoveryPage({
  searchParams,
}: DiscoveryPageProps) {
  const [{ city, q, category }, guides, guideCities, experiences] =
    await Promise.all([
      searchParams,
      loadGuides(),
      getGuideCities(),
      getDiscoveryExperiences(),
    ]);

  const guideIds = guides.map((guide) => guide.id);

  const [itemCounts, resolvedImages] = await Promise.all([
    loadItemCounts(guideIds),
    getGuideResolvedImages(guides),
  ]);

  const cities = cityCounts(guides);

  const selectedCity =
    city && cities.some((entry) => entry.city === city) ? city : null;

  const heroCity =
    selectedCity ?? (cities.length === 1 ? cities[0].city : null);

  const heroMetadata = heroCity
    ? (guideCities.find((metadata) => metadata.city === heroCity) ?? null)
    : null;

  const cityScope = selectedCity
    ? guides.filter((guide) => guide.city === selectedCity)
    : guides;

  const activeCategory: DiscoveryCategorySlug | null =
    category === "itineraries" ||
    category === "food" ||
    category === "outdoors" ||
    category === "kids" ||
    category === "hidden-gems"
      ? category
      : null;

  const query =
    q?.trim() ?? CATEGORY_SEARCH_TERMS[activeCategory ?? "for-you"] ?? "";

  const hasActiveFilter = query.length > 0 || activeCategory === "itineraries";

  const filtered = cityScope.filter((guide) => {
    if (query && !matchesQuery(guide, query)) {
      return false;
    }

    if (
      activeCategory === "itineraries" &&
      (guide.type ?? "itinerary") !== "itinerary"
    ) {
      return false;
    }

    return true;
  });

  const hasGuides = guides.length > 0;

  const heroFeatured = !hasActiveFilter
    ? (cityScope.find((guide) => guide.featured) ?? null)
    : null;

  const rest = hasActiveFilter
    ? filtered
    : cityScope.filter((guide) => guide.id !== heroFeatured?.id);

  const groupByCity = !hasActiveFilter && !selectedCity && cities.length > 1;

  const citySections = groupByCity
    ? cities
        .map(({ city: sectionCity }) => ({
          city: sectionCity,
          guides: rest.filter((guide) => guide.city === sectionCity),
        }))
        .filter((section) => section.guides.length > 0)
    : [];

  return (
    <>
      <DiscoveryHero
        cities={cities}
        selectedCity={selectedCity}
        hero={heroMetadata}
        q={q}
        activeCategory={activeCategory}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {!hasGuides ? (
          <section className="py-16 sm:py-24">
            <div className="max-w-lg">
              <p className="text-sm font-semibold text-accent-dark">
                More soon
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                We’re putting the good stuff together.
              </h2>

              <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">
                New itineraries, collections and recommendations are on the way.
                We’d rather share a few great ones than fill the page with
                things that aren’t worth your time.
              </p>
            </div>
          </section>
        ) : (
          <div className="mt-5 space-y-10 sm:mt-8 sm:space-y-12">
            {heroFeatured && (
              <section aria-labelledby="featured-discovery">
                <h2
                  id="featured-discovery"
                  className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted"
                >
                  {selectedCity ? `Featured in ${selectedCity}` : "Featured"}
                </h2>

                <DiscoveryFeaturedCard
                  guide={heroFeatured}
                  stopCount={itemCounts[heroFeatured.id]}
                  image={resolvedImages[heroFeatured.id] ?? null}
                />
              </section>
            )}

            {hasActiveFilter ? (
              filtered.length > 0 ? (
                <DiscoveryGrid
                  eyebrow={selectedCity ?? undefined}
                  title={q ? `Results for “${q}”` : "Filtered plans"}
                  guides={filtered}
                  stopCounts={itemCounts}
                  resolvedImages={resolvedImages}
                />
              ) : (
                <div className="rounded-panel border border-dashed border-border px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-ink">
                    No plans found
                  </p>

                  <p className="mt-1 text-sm text-secondary">
                    Try another search or category.
                  </p>
                </div>
              )
            ) : groupByCity ? (
              citySections.map((section) => (
                <DiscoveryGrid
                  key={section.city}
                  eyebrow="Explore"
                  title={section.city}
                  guides={section.guides}
                  stopCounts={itemCounts}
                  resolvedImages={resolvedImages}
                />
              ))
            ) : (
              <DiscoveryGrid
                title={heroCity ? `Explore ${heroCity}` : "Explore"}
                guides={rest}
                stopCounts={itemCounts}
                resolvedImages={resolvedImages}
              />
            )}

            <DiscoveryExperiencesSection experiences={experiences} />
          </div>
        )}
      </main>
    </>
  );
}
