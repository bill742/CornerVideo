import { BRAND } from "./brand";

/**
 * Where a member came from, for the marketing plan's weekly numbers. The web
 * app stores first-touch UTM tags in a cookie and copies them onto the profile
 * at sign-up (handle_new_user, migration 005), along with the optional
 * "How did you hear about us?" answer.
 */

/**
 * The "How did you hear about us?" choices. The values must match the CHECK
 * on profiles.heard_from and the list in handle_new_user (migration 005).
 */
export const HEARD_FROM_OPTIONS = [
  { label: "Reddit", value: "reddit" },
  { label: "A friend", value: "friend" },
  { label: "News or a blog", value: "press" },
  { label: "Search", value: "search" },
  { label: "Somewhere else", value: "other" },
] as const;

export type HeardFrom = (typeof HEARD_FROM_OPTIONS)[number]["value"];

export function isHeardFrom(value: unknown): value is HeardFrom {
  return HEARD_FROM_OPTIONS.some((option) => option.value === value);
}

/**
 * The opt-in wording, stored with each waitlist row as the CASL consent
 * record. It covers general news, not only the app launch, because the
 * marketing plan sends a monthly update; consent only reaches as far as
 * the wording does. Changing it changes what new sign-ups agreed to, which is fine;
 * old rows keep the text they saw.
 */
export const APP_NEWS_CONSENT_TEXT = `Email me ${BRAND.name} news, including when the iPhone and Android apps launch. Unsubscribe any time.`;

/** First-party cookie holding first-touch UTM tags, as JSON. */
export const ATTRIBUTION_COOKIE = "cv_attribution";
export const ATTRIBUTION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface Attribution {
  utm_campaign?: string;
  utm_medium?: string;
  utm_source?: string;
}

const UTM_KEYS = ["utm_campaign", "utm_medium", "utm_source"] as const;
const MAX_LENGTH = 100;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_LENGTH);
  return trimmed || undefined;
}

/** The UTM tags in a URL's query string, or null when it has none. */
export function attributionFromParams(
  params: URLSearchParams,
): Attribution | null {
  const result: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = clean(params.get(key));
    if (value) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Reads the cookie's value back, ignoring anything malformed. */
export function parseAttribution(raw: string | undefined | null): Attribution {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return {};
    const result: Attribution = {};
    for (const key of UTM_KEYS) {
      const value = clean((data as Record<string, unknown>)[key]);
      if (value) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}
