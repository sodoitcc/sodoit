import { ErrorState } from "@/components/ui";
import { ScrollRestoration } from "@/lib/navigation/ScrollRestoration";
import { ActivityFeed } from "@/components/feed/ActivityFeed";
import { FeedHero } from "./FeedHero";
import {
  ACTIVITY_FILTERS,
  loadActivityFeed,
  type ActivityFilter,
} from "./data";

interface FeedPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const filter: ActivityFilter = ACTIVITY_FILTERS.includes(
    params.filter as ActivityFilter,
  )
    ? (params.filter as ActivityFilter)
    : "all";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  let result;
  try {
    result = await loadActivityFeed(filter, page);
  } catch {
    return (
      <div className="overflow-x-hidden">
        <ScrollRestoration />

        <FeedHero filter={filter} />

        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Couldn't load community updates"
            description="Please try again shortly."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <ScrollRestoration />

      <FeedHero filter={filter} />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <ActivityFeed filter={filter} result={result} />
      </div>
    </div>
  );
}
