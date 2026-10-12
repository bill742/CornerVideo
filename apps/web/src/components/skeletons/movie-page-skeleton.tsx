const PersonCard = () => (
  <div className="w-32 shrink-0">
    <div className="bg-muted mb-2 h-48 w-32 animate-pulse rounded-md" />
    <div className="bg-muted h-4 w-20 animate-pulse rounded" />
  </div>
);

const MoviePageSkeleton = () => (
  <div className="min-h-screen pb-12">
    {/* Content */}
    <div className="relative container mt-89 space-y-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Poster */}
        <div className="shrink-0">
          <div className="bg-muted h-112.5 w-75 animate-pulse rounded-sm" />
        </div>

        {/* Details */}
        <div className="flex-1 space-y-6">
          {/* Title + meta */}
          <div className="space-y-3">
            <div className="bg-muted h-12 w-3/4 animate-pulse rounded" />
            <div className="flex flex-wrap gap-4">
              <div className="bg-muted h-5 w-14 animate-pulse rounded" />
              <div className="bg-muted h-5 w-20 animate-pulse rounded" />
              <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-14 animate-pulse rounded-full" />
          </div>

          {/* Overview */}
          <div className="space-y-2">
            <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          </div>

          {/* Directors */}
          <div className="space-y-2">
            <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            <div className="flex gap-4">
              <PersonCard />
            </div>
          </div>

          {/* Cast */}
          <div className="space-y-2">
            <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            <div className="flex flex-wrap gap-4">
              <PersonCard />
              <PersonCard />
              <PersonCard />
              <PersonCard />
              <PersonCard />
              <PersonCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

MoviePageSkeleton.displayName = "MoviePageSkeleton";

export { MoviePageSkeleton };
