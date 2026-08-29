import Image from "next/image";
import { HeroLayout } from "@/components/ui";
import { ActivityFilters } from "@/components/feed/ActivityFilters";
import type { ActivityFilter } from "./data";

export function FeedHero({ filter }: { filter: ActivityFilter }) {
  return (
    <section className="relative overflow-visible pb-3 pt-0 sm:py-6 lg:py-8">
      <div className="relative -mx-4 h-[120px] overflow-hidden px-4 sm:hidden">
        <Image
          src="/illustrations/feed-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none select-none object-contain object-center"
        />
      </div>

      <HeroLayout
        visual={
          <Image
            src="/illustrations/feed-hero.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="pointer-events-none select-none object-contain object-center lg:object-right"
          />
        }
      >
        <h1 className="text-[28px] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[42px] lg:text-[56px]">
          What the community is up to
        </h1>

        <p className="mt-2 max-w-[500px] text-[15px] leading-6 text-secondary sm:mt-3 sm:text-base lg:text-lg">
          See what people are adding, completing, and planning.
        </p>

        <div className="mt-4 sm:mt-6">
          <ActivityFilters active={filter} />
        </div>
      </HeroLayout>
    </section>
  );
}
