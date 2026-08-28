import { createClient } from "@/lib/supabase/server";
import { PageShell, ErrorState } from "@/components/ui";
import { ActivityFeed } from "@/components/feed/ActivityFeed";
import {
  ACTIVITY_FILTERS,
  loadActivityFeed,
  loadViewerListStatuses,
  type ActivityFilter,
  type ExperienceActivityItem,
} from "./data";

function isExperienceActivity(item: {
  kind: string;
}): item is ExperienceActivityItem {
  return item.kind === "completed" || item.kind === "added_to_list";
}

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

  const experienceIds = result.items
    .filter(isExperienceActivity)
    .map((item) => item.experience.id);

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    viewerStatuses,
  ] = await Promise.all([
    supabase.auth.getUser(),
    loadViewerListStatuses(experienceIds),
  ]);

  return (
    <PageShell {...shellProps}>
      <ActivityFeed
        filter={filter}
        result={result}
        viewerStatuses={viewerStatuses}
        signedIn={Boolean(user)}
      />
    </PageShell>
  );
}
