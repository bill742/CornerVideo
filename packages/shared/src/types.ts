// ─── TMDB — Movies ────────────────────────────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  release_dates: { type: number }[];
  genres: Genre[];
  runtime: number;
  overview: string;
  vote_average?: number;
  vote_count?: number;
}

export interface MovieListProps {
  movies: Movie[];
  heading: string;
}

export interface MoviePreviewProps {
  movie: Movie;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface CastAndCrew {
  name: string;
  profile_path: string | null;
  id: number;
  character?: string;
  job?: string;
}

export interface Person {
  name: string;
  profile_path: string | null;
  biography: string;
  imdb_id: string;
}

export interface PersonMovieCredit {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  character?: string;
  job?: string;
  department?: string;
}

/** One entry from /person/{id}/tv_credits — a show, not an episode. */
export interface PersonTVCredit {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  episode_count?: number;
  character?: string;
  job?: string;
  department?: string;
}

// ─── TMDB — TV ────────────────────────────────────────────────────────────────

export interface TVEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface TVSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  poster_path: string | null;
  episode_count: number;
  air_date: string | null;
  overview: string;
}

export interface TVSeason {
  id: number;
  season_number: number;
  name: string;
  poster_path: string | null;
  air_date: string | null;
  overview: string;
  episodes: TVEpisode[];
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genres: Genre[];
  overview: string;
  vote_average?: number;
  vote_count?: number;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  next_episode_to_air: TVEpisode | null;
  last_episode_to_air: TVEpisode | null;
  seasons: TVSeasonSummary[];
}

/** Normalized item for the /search/multi TMDB endpoint. */
export interface MultiSearchItem {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average?: number;
}

// ─── Shared display types ─────────────────────────────────────────────────────

/** Normalized form used by MediaCard — works for both Movie and TVShow. */
export interface MediaCardItem {
  id: number;
  title: string;
  poster_path: string | null;
  date: string | null;
  vote_average?: number;
  media_type: MediaType;
}

/** Normalized form used by HeroBanner — works for both Movie and TVShow. */
export interface FeaturedItem {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  media_type: MediaType;
}

// ─── Region context ───────────────────────────────────────────────────────────

export interface RegionContextType {
  region: string;
}

// ─── User / auth ──────────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";

/** Selectable themes, in the order they should appear in pickers. */
export const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: "System default", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  region: string;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export type MediaType = "movie" | "tv";

export type WatchStatus =
  | "want_to_watch"
  | "watching"
  | "watched"
  | "dropped";

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  status: WatchStatus;
  added_at: string;
  updated_at: string;
}

// ─── Episode tracking ─────────────────────────────────────────────────────────

export interface EpisodeWatch {
  id: string;
  user_id: string;
  show_tmdb_id: number;
  season_number: number;
  episode_number: number;
  watched_at: string;
}

// ─── Custom lists (premium) ───────────────────────────────────────────────────

export interface CustomList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomListItem {
  id: string;
  list_id: string;
  tmdb_id: number;
  media_type: MediaType;
  sort_order: number | null;
  added_at: string;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "cancelled"
  | "past_due";

export type SubscriptionPlatform = "stripe" | "apple" | "google";

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  platform: SubscriptionPlatform;
  external_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Regions ──────────────────────────────────────────────────────────────────

export interface Region {
  /** ISO 3166-1 alpha-2, as TMDB expects it. */
  code: string;
  flag: string;
  /** Full name, for settings screens. */
  label: string;
  /** Abbreviation, for the compact header picker. */
  short: string;
}

/** Regions offered for release-date filtering, in display order. */
export const REGIONS: Region[] = [
  { code: "US", flag: "🇺🇸", label: "United States", short: "US" },
  { code: "GB", flag: "🇬🇧", label: "United Kingdom", short: "GB" },
  { code: "CA", flag: "🇨🇦", label: "Canada", short: "CAN" },
  { code: "AU", flag: "🇦🇺", label: "Australia", short: "AU" },
  { code: "DE", flag: "🇩🇪", label: "Germany", short: "DE" },
  { code: "FR", flag: "🇫🇷", label: "France", short: "FR" },
];

export const DEFAULT_REGION = "US";

// ─── Watch status display ─────────────────────────────────────────────────────

/** Human-readable labels for each watch status. */
export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  dropped: "Dropped",
  want_to_watch: "Want to watch",
  watched: "Watched",
  watching: "Watching",
};

/** Selectable statuses, in the order they should appear in pickers. */
export const WATCH_STATUS_OPTIONS: WatchStatus[] = [
  "want_to_watch",
  "watching",
  "watched",
  "dropped",
];

// ─── Free-tier limits ─────────────────────────────────────────────────────────

export const FREE_WATCHLIST_LIMIT = 25;
