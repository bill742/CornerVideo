export default function Loading() {
  return (
    <div className="space-y-8 py-8">
      {/* Back link skeleton */}
      <div className="bg-muted h-4 w-32 animate-pulse rounded" />

      {/* Season header skeleton */}
      <div className="flex gap-6">
        <div className="bg-muted h-48 w-32 shrink-0 animate-pulse rounded-sm" />
        <div className="flex-1 space-y-3">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="flex gap-4">
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          </div>
          <div className="space-y-1">
            <div className="bg-muted h-3 w-full max-w-md animate-pulse rounded" />
            <div className="bg-muted h-3 w-3/4 max-w-md animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Episode list skeleton */}
      <div className="divide-border divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 py-4">
            <div className="bg-muted h-18 w-32 shrink-0 animate-pulse rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-48 animate-pulse rounded" />
              <div className="bg-muted h-3 w-24 animate-pulse rounded" />
              <div className="bg-muted h-3 w-full animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
