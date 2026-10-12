import { ViewTransition } from "react";

import { VhsLoader } from "@/components/brand/vhs-loader";

export default function Loading() {
  return (
    <ViewTransition exit="fade-out">
      <VhsLoader />
    </ViewTransition>
  );
}
