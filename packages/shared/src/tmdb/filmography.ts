import type {
  MediaCardItem,
  MediaType,
  PersonMovieCredit,
  PersonTVCredit,
} from "../types";

/** A person's credits for one media type, ready for poster rows. */
export interface Filmography {
  acting: MediaCardItem[];
  /** Crew credits by department, in DEPARTMENT_ORDER. */
  crew: [string, MediaCardItem[]][];
}

interface Credit {
  department?: string;
  item: MediaCardItem;
}

/** "Creator" only appears on TV credits, where it is the headline credit. */
const DEPARTMENT_ORDER = [
  "Creator",
  "Directing",
  "Writing",
  "Production",
  "Camera",
  "Editing",
  "Sound",
  "Music",
  "Art",
  "Costume & Make-Up",
  "Visual Effects",
  "Crew",
];

/**
 * TMDB genres for talk and news shows. A guest spot on a talk show is listed
 * as an acting credit ("Self"), and a busy actor has dozens of them, which
 * would bury the shows they actually starred in.
 */
const NON_FILMOGRAPHY_TV_GENRES = new Set([10763, 10767]);

/** Newest first; undated (usually unannounced) titles go last. */
function sortByDateDesc(credits: Credit[]): Credit[] {
  return [...credits].sort((a, b) => {
    if (!a.item.date) return 1;
    if (!b.item.date) return -1;
    return new Date(b.item.date).getTime() - new Date(a.item.date).getTime();
  });
}

/**
 * TMDB can list one title twice for a person (two roles, or two jobs in one
 * department), which would otherwise repeat the card and its key.
 */
function deduplicateById(credits: Credit[]): Credit[] {
  const seen = new Set<number>();
  return credits.filter(({ item }) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function toItems(credits: Credit[]): MediaCardItem[] {
  return sortByDateDesc(deduplicateById(credits)).map(({ item }) => item);
}

function buildFilmography(cast: Credit[], crew: Credit[]): Filmography {
  const grouped: Record<string, Credit[]> = {};
  for (const credit of crew) {
    const dept = credit.department ?? "Crew";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(credit);
  }

  return {
    acting: toItems(cast),
    crew: Object.entries(grouped)
      .map(([dept, deptCredits]): [string, MediaCardItem[]] => [
        dept,
        toItems(deptCredits),
      ])
      .sort(([a], [b]) => {
        const ai = DEPARTMENT_ORDER.indexOf(a);
        const bi = DEPARTMENT_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }),
  };
}

function fromMovieCredit(credit: PersonMovieCredit): Credit {
  return {
    department: credit.department,
    item: {
      date: credit.release_date || null,
      id: credit.id,
      media_type: "movie",
      poster_path: credit.poster_path,
      title: credit.title,
      vote_average: credit.vote_average,
    },
  };
}

function fromTVCredit(credit: PersonTVCredit): Credit {
  return {
    department: credit.department,
    item: {
      date: credit.first_air_date || null,
      id: credit.id,
      media_type: "tv",
      poster_path: credit.poster_path,
      title: credit.name,
      vote_average: credit.vote_average,
    },
  };
}

export function movieFilmography(credits: {
  cast: PersonMovieCredit[];
  crew: PersonMovieCredit[];
}): Filmography {
  return buildFilmography(
    credits.cast.map(fromMovieCredit),
    credits.crew.map(fromMovieCredit),
  );
}

/** Talk and news shows are left out of the acting credits; see above. */
export function tvFilmography(credits: {
  cast: PersonTVCredit[];
  crew: PersonTVCredit[];
}): Filmography {
  return buildFilmography(
    credits.cast
      .filter(
        (credit) =>
          !credit.genre_ids?.some((genre) =>
            NON_FILMOGRAPHY_TV_GENRES.has(genre),
          ),
      )
      .map(fromTVCredit),
    credits.crew.map(fromTVCredit),
  );
}

/** How many distinct titles a filmography lists, across every section. */
export function filmographySize({ acting, crew }: Filmography): number {
  return new Set(
    [...acting, ...crew.flatMap(([, items]) => items)].map((item) => item.id),
  ).size;
}

/**
 * Which tab a person page opens on: whichever medium the person has more
 * titles in, so a TV actor doesn't land on a near-empty Movies tab.
 */
export function defaultFilmographyTab(
  movies: Filmography,
  tv: Filmography,
): MediaType {
  return filmographySize(tv) > filmographySize(movies) ? "tv" : "movie";
}
