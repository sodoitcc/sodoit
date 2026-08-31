function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-subtle ${className}`}
    />
  );
}

export default function MyListLoading() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <SkeletonBlock className="aspect-[4/3] w-full rounded-card" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
