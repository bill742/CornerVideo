import { cookies } from "next/headers";

import "server-only";

import {
  ATTRIBUTION_COOKIE,
  type Attribution,
  parseAttribution,
} from "@/types";

/** The first-touch UTM tags AttributionCapture saved, if any. */
export async function readAttribution(): Promise<Attribution> {
  const raw = (await cookies()).get(ATTRIBUTION_COOKIE)?.value;
  if (!raw) return {};
  try {
    return parseAttribution(decodeURIComponent(raw));
  } catch {
    return {};
  }
}
