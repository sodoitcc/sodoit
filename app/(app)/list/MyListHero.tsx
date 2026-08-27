import Image from "next/image";

import { HeroLayout, HeroToolbar } from "@/components/ui";
import { SearchField } from "@/components/ui/SearchField";
import { FilterGroup } from "@/app/(app)/browse/components/FilterGroup";
import { ListVisibilityControl } from "./ListVisibilityControl";
import type { Visibility } from "./collections/types";
import type { MyListStatus } from "./useMyListState";

const STATUS_OPTIONS: readonly MyListStatus[] = ["all", "saved", "completed"];

const STATUS_LABELS: Record<MyListStatus, string> = {
  all: "All",
  saved: "Saved",
  completed: "Completed",
};

interface MyListHeroProps {
  username: string;
  visibility: Visibility;
  search: string;
  onSearchChange: (value: string) => void;
  status: MyListStatus;
  onStatusChange: (status: MyListStatus) => void;
}

export function MyListHero({
  username,
  visibility,
  search,
  onSearchChange,
  status,
  onStatusChange,
}: MyListHeroProps) {
  return (
    <section className="relative overflow-visible pb-3 pt-0 sm:py-6 lg:py-8">
      <div className="relative -mx-4 h-[130px] overflow-hidden px-4 sm:hidden">
        <Image
          src="/illustrations/my-list-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="select-none object-contain object-center"
        />
      </div>

      <HeroLayout
        visual={
          <Image
            src="/illustrations/my-list-hero.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="pointer-events-none select-none object-contain object-center lg:object-right"
          />
        }
      >
        <h1 className="text-[28px] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[42px] lg:text-[56px]">
          My list
        </h1>

        <p className="mt-2 max-w-[500px] text-[15px] leading-6 text-secondary sm:mt-3 sm:text-base lg:text-lg">
          Everything you&apos;ve saved and completed, in one place.
        </p>

        <div className="mt-2">
          <ListVisibilityControl username={username} visibility={visibility} />
        </div>

        <div className="mt-3 sm:mt-5">
          <HeroToolbar
            search={
              <SearchField
                value={search}
                onChange={onSearchChange}
                placeholder="Search your list..."
                className="w-full"
              />
            }
          >
            <FilterGroup
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={onStatusChange}
              getLabel={(option) => STATUS_LABELS[option]}
            />
          </HeroToolbar>
        </div>
      </HeroLayout>
    </section>
  );
}
