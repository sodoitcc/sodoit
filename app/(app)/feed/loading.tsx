import { PageShell } from "@/components/ui";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

export default function FeedLoading() {
  return (
    <PageShell
      title="Community updates"
      subtitle="See what people are adding, completing, and planning."
      maxWidth="1440px"
    >
      <FeedSkeleton />
    </PageShell>
  );
}
