function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-subtle ${className}`}
    />
  );
}

function VerticalCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center gap-2 p-4 pb-3 sm:p-5 sm:pb-3">
        <SkeletonBlock className="h-6 w-6 rounded-full" />
        <SkeletonBlock className="h-3 w-32" />
      </div>
      <SkeletonBlock className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-4 sm:p-5">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
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

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <VerticalCardSkeleton />
        <VerticalCardSkeleton />
        <div className="lg:col-span-2">
          <CompactCardSkeleton />
        </div>
        <VerticalCardSkeleton />
        <VerticalCardSkeleton />
      </div>
    </div>
  );
}
