"use client";

import { RouteError } from "@/components/route-error";

export default function PersonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} noun="this person" reset={reset} />;
}
