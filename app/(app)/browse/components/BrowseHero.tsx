import Image from "next/image";
import type { ReactNode } from "react";

import { HeroLayout } from "@/components/ui";

interface BrowseHeroProps {
  children: ReactNode;
}

export function BrowseHero({ children }: BrowseHeroProps) {
  return (
    <section className="relative overflow-visible pb-3 pt-0 sm:py-6 lg:py-8">
      <div className="relative h-[130px] w-full overflow-hidden sm:hidden">
        <Image
          src="/illustrations/browse-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="select-none scale-[1.12] object-contain object-center"
        />
      </div>

      <HeroLayout
        visual={
          <Image
            src="/illustrations/browse-hero.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="pointer-events-none select-none object-contain object-center lg:object-right"
          />
        }
      >
        <h1 className="text-[28px] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[42px] lg:text-[56px]">
          Things worth doing.
        </h1>

        <p className="mt-2 max-w-[500px] text-[15px] leading-6 text-secondary sm:mt-3 sm:text-base lg:text-lg">
          Find something worth experiencing, save it, and make it part of your
          Life List.
        </p>

        <div className="mt-3 sm:mt-5">{children}</div>
      </HeroLayout>
    </section>
  );
}
