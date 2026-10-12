import { SkeletonCardList } from "./skeleton-card-list";

const SkeletonSection = () => (
  <section className="space-y-6">
    <SkeletonCardList />
  </section>
);

const MediaListSkeleton = () => (
  <section className="space-y-16">
    <div className="bg-muted h-125 w-full animate-pulse rounded-sm" />
    <SkeletonSection />
    <SkeletonSection />
  </section>
);

MediaListSkeleton.displayName = "MediaListSkeleton";

export { MediaListSkeleton };
