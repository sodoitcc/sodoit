import { PageShell, ErrorState } from "@/components/ui";
import { ActivityFeed } from "@/components/feed/ActivityFeed";
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

  const shellProps = {
    title: "Community updates",
    subtitle: "See what people are adding, completing, and planning.",
    maxWidth: "1440px",
  } as const;

  let result;
  try {
    result = await loadActivityFeed(filter, page);
  } catch {
    return (
      <PageShell {...shellProps}>
        <ErrorState
          title="Couldn't load community updates"
          description="Please try again shortly."
        />
      </PageShell>
    );
  }

  return (
    <PageShell {...shellProps}>
      <ActivityFeed filter={filter} result={result} />
    </PageShell>
  );
}
