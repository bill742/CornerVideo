import { SkeletonCardList } from "./skeleton-card-list";

const PersonPageSkeleton = () => (
  <div className="container mx-auto space-y-12 py-8">
    {/* Person header */}
    <div className="flex flex-col gap-6 sm:flex-row">
      {/* Profile image */}
      <div className="bg-muted h-72 w-40 shrink-0 animate-pulse rounded-sm sm:w-48" />

      {/* Details */}
      <div className="space-y-3">
        <div className="bg-muted h-9 w-56 animate-pulse rounded" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="space-y-2 pt-1">
          <div className="bg-muted h-4 w-full max-w-2xl animate-pulse rounded" />
          <div className="bg-muted h-4 w-full max-w-2xl animate-pulse rounded" />
          <div className="bg-muted h-4 w-3/4 max-w-2xl animate-pulse rounded" />
        </div>
      </div>
    </div>

    {/* Filmography */}
    <SkeletonCardList />
  </div>
);

PersonPageSkeleton.displayName = "PersonPageSkeleton";

export { PersonPageSkeleton };
