function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-subtle ${className}`}
    />
  );
}

export default function DiscoveryLoading() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />

      <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3.5">
            <SkeletonBlock className="aspect-[4/3] w-full" />
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-3 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
