import { RecommendationsForm } from "@/components/recommendations/recommendations-form";

export default function RecommendationsPage() {
  return (
    <div className="space-y-10 py-8">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        Staff Picks
      </h1>

      <RecommendationsForm />
    </div>
  );
}
