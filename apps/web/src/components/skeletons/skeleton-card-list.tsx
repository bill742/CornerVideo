const SkeletonCard = () => (
  <div>
    <div className="shelf-slot relative pb-[5px]">
      <div className="bg-muted aspect-2/3 animate-pulse rounded-sm" />
    </div>
    <div className="bg-muted mt-3 h-4 w-3/4 animate-pulse rounded-sm" />
  </div>
);

interface SkeletonCardListProps {
  /**
   * A real heading to show in place of the placeholder bar, when the title
   * is known before the data — search knows its term from the URL.
   */
  heading?: React.ReactNode;
}

const SkeletonCardList = ({ heading }: SkeletonCardListProps) => (
  <>
    {heading ?? (
      <div className="border-primary h-8 w-48 border-l-4 pl-3">
        <div className="bg-muted h-full w-full animate-pulse rounded-sm" />
      </div>
    )}

    <div className="grid grid-cols-2 gap-x-4 gap-y-10 [--shelf-gap:1rem] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </>
);

SkeletonCardList.displayName = "SkeletonCardList";

export { SkeletonCardList };
