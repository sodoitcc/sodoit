function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-subtle ${className}`}
    />
  );
}

function CompletedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface lg:flex lg:items-stretch">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:w-[42%] lg:shrink-0">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-6 w-6 rounded-full" />
          <SkeletonBlock className="h-3 w-40" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="aspect-[16/10] w-full rounded-none sm:aspect-[16/8] lg:aspect-auto lg:w-[58%]" />
    </div>
  );
}

function CompactCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 sm:p-4">
      <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-2/3" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <SkeletonBlock className="h-8 w-14" />
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="h-8 w-24" />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <CompletedCardSkeleton />
        <CompactCardSkeleton />
        <CompactCardSkeleton />
        <CompletedCardSkeleton />
      </div>
    </div>
  );
}
