function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-subtle ${className}`}
    />
  );
}

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-64 max-w-full" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-16 w-full" />
        ))}
      </div>

      <SkeletonBlock className="mt-6 h-9 w-full max-w-md" />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className="aspect-[4/3] w-full rounded-card"
          />
        ))}
      </div>
    </div>
  );
}
