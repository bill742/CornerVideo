"use client";

import { RouteError } from "@/components/route-error";

export default function ShowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} noun="this show" reset={reset} />;
}
