import Image from "next/image";
import { MapPin } from "lucide-react";

import { HeroToolbar } from "@/components/ui";
import { CitySelector } from "@/components/guides/CitySelector";
import { DiscoveryCategories } from "@/components/discovery/DiscoveryCategories";
import type { DiscoveryCategorySlug } from "@/components/discovery/DiscoveryCategories";
import { DiscoverySearch } from "@/components/discovery/DiscoverySearch";
import { discoveryUrl } from "@/lib/discovery/url";
import type { GuideCity } from "@/lib/guides/types";

interface CityCount {
  city: string;
  count: number;
}

interface DiscoveryHeroProps {
  cities: CityCount[];
  selectedCity: string | null;
  hero: GuideCity | null;
  q?: string;
  activeCategory: DiscoveryCategorySlug | null;
}

export function DiscoveryHero({
  cities,
  selectedCity,
  hero,
  q,
  activeCategory,
}: DiscoveryHeroProps) {
  const city = hero?.city ?? selectedCity;

  const title =
    hero?.title ??
    (city ? `${city}, worth wandering.` : "Find somewhere worth wandering.");

  const description =
    hero?.description ??
    "Local plans, hidden gems, and neighborhood finds curated for right now.";

  return (
    <section className="relative isolate min-h-[420px] overflow-hidden bg-ink sm:min-h-[560px] lg:min-h-[600px]">
      {hero?.hero_image_url && (
        <Image
          src={hero.hero_image_url}
          alt={hero.hero_image_alt ?? ""}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="max-w-[640px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              {hero?.eyebrow || "Discovery"}
            </span>

            {city && (
              <span className="inline-flex items-center gap-1.5 rounded-control border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <MapPin
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  strokeWidth={2}
                />
                {city}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[28px] font-extrabold leading-[0.98] tracking-[-0.035em] text-white sm:mt-4 sm:text-[42px] lg:text-[56px]">
            {title}
          </h1>

          <p className="mt-2 max-w-[500px] text-[15px] leading-6 text-white/85 sm:mt-3 sm:text-base lg:text-lg">
            {description}
          </p>

          {cities.length > 1 && (
            <div className="mt-3 sm:mt-5">
              <CitySelector
                cities={cities}
                selectedCity={selectedCity}
                basePath="/discovery"
                urlFor={(nextCity) => discoveryUrl({ city: nextCity })}
              />
            </div>
          )}

          <div className="mt-3 sm:mt-5">
            <HeroToolbar
              search={
                <DiscoverySearch
                  q={q}
                  city={selectedCity}
                  category={activeCategory}
                />
              }
            >
              <DiscoveryCategories
                city={selectedCity}
                activeCategory={activeCategory}
              />
            </HeroToolbar>
          </div>
        </div>
      </div>
    </section>
  );
}
