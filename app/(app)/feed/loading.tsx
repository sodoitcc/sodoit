import { LoadingState, PageShell } from "@/components/ui";

export default function FeedLoading() {
  return (
    <PageShell
      title="Community updates"
      subtitle="See what people are adding, completing, and planning."
      maxWidth="1440px"
    >
      <LoadingState label="Loading community updates…" />
    </PageShell>
  );
}
