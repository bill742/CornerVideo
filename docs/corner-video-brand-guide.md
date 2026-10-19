# Corner Video — Brand Guide

Oct 9, 2026 · @Bill Dean

## Brand at a glance

Corner Video is a movie and TV watchlist app for web, iOS and Android, styled as the neighbourhood video store you used to walk to on a Friday night. The app is the store, each list is a shelf, and the AI assistant, Staff Picks, is the clerk who knows your taste.

| Element | Value |
| --- | --- |
| App name | Corner Video (two words, both capitalized; never CornerVideo in copy) |
| AI assistant | Staff Picks (roadmap: natural-language search and recommendation chat) |
| Tagline | Your neighbourhood video store, minus the late fees. |
| Positioning line | One shelf for every movie and show you want to see, with premiere dates so nothing slips by. |
| Audience | People who watch both film and TV across several streaming services and lose track of what's coming |
| Domain | cornervideo.app (to register) |
| Replaces | Movie Watchlist (placeholder) |

The theme is the place, not the medium, so film and TV get equal weight everywhere.

## Voice and tone

Corner Video sounds like the friendly clerk who has seen everything and is happy to help: warm, specific and a little playful, never pushy.

| Do | Don't |
| --- | --- |
| Short, plain sentences: "Premieres Friday." | Hype: "The ultimate entertainment hub!" |
| Light video-store nods in headings and empty states | Nostalgia jokes on every screen, or in error messages |
| Name the specific thing: "3 new episodes this week" | Vague counts: "New content available" |
| Treat movies and TV equally ("movies and shows") | Default to "films" or "movies" only |
| Canadian spelling: neighbourhood, colour, favourite | Mixed spellings across screens |

Keep themed wording out of anything functional or stressful: sign-in, errors, settings, payments and privacy copy stay plain.

## Vocabulary map

Use these terms for visible UI labels. Accessible names (`aria-label`, `accessibilityLabel`) match the visible label, so voice-control users can say what they see (WCAG 2.5.3); only icon-only controls need their own label, and it uses the same vocabulary ("Remove Heat from shelf"). Keep the generic term in search keywords and store metadata, where people search for "watchlist".

| Generic term | Corner Video term | Notes |
| --- | --- | --- |
| Watchlist | My Shelf | Default list |
| Custom list | Shelf | "New shelf", "Rename shelf" |
| Add to watchlist | Add to shelf | Button label |
| Remove from watchlist | Remove from shelf | Button label once the title is on the shelf |
| Mark as watched | Watched | Keep plain; a small "returned" stamp can be the visual |
| Watch history | Rental history | Profile section |
| Upcoming premieres | Coming Soon | The premiere-date view; works for movies and seasons. Not "New Releases", which reads like the "New on Digital" row beside it |
| Premiere reminder | New release alert | Notification setting |
| Browse / discover | Browse the aisles | Section heading only; nav label stays "Browse" |
| Genre | Section | e.g. "Horror section" |
| Recommendations | Staff Picks | Reserved for the AI assistant once it ships |
| Account / profile | Membership | "Your membership card" in profile; sign-up button stays "Create account" |
| Search | Search | Unchanged |

## Staff Picks assistant

Staff Picks is the AI assistant for natural-language search and streaming recommendations. It is on the roadmap, not in v1, so the app name and launch copy must not depend on it.

- **Role:** the clerk behind the counter who hands you something perfect and tells you why.
- **Entry points:** an "Ask Staff Picks" button in Search and on the home screen; a chat sheet on mobile, a side panel on desktop.
- **Answer pattern:** three picks at most, each with title, year, movie or show, where it streams in the user's region, and a one-line reason. Picks render as handwritten-style shelf cards.
- **Personality:** warm and specific; asks one clarifying question only when the request is truly open ("Movie or show?"); never gushes.
- **Honesty:** clearly labelled as AI, never presented as a person. Footer line: "Staff Picks is an AI assistant and can get things wrong."
- **Sample prompts:** "Something cozy under 90 minutes", "A show like Slow Horses on a service I have", "What's premiering this weekend that I'd like?"
- **Empty state:** "Tell us what you're in the mood for, and we'll pull something off the shelf."

## Store listings

The subtitle carries the descriptive keywords the name leaves out, so nobody mistakes Corner Video for a streaming service. Character counts are measured.

| Field | Copy | Length / limit |
| --- | --- | --- |
| App Store name | Corner Video | 12 / 30 |
| App Store subtitle | Watchlist & New Release Alerts | 30 / 30 |
| App Store keywords | watchlist,movies,tv shows,tracker,premieres,release dates,streaming,what to watch,calendar,series | 97 / 100 |
| Google Play title | Corner Video: Watchlist | 23 / 30 |
| Google Play short description | Track movies and TV shows, get premiere alerts, and find your next watch. | 73 / 80 |

**Long description (both stores):**

Your neighbourhood video store, minus the late fees.

Corner Video keeps every movie and show you want to see on one shelf, and tells you when new ones arrive.

- Build shelves for movies and TV shows, side by side
- See premiere dates for upcoming films and new seasons on the Coming Soon wall
- Get a new release alert the day something on your shelf comes out
- Keep your rental history of everything you've watched
- Sync across web, iPhone and Android

Corner Video is a watchlist and tracker. It doesn't stream video; it helps you decide what to watch and when.

Add a Staff Picks line here once the assistant ships.

## Web metadata

The title leads with the searched words and ends with the brand; social tags get the warmer hook. Lengths are measured.

| Tag | Copy | Chars |
| --- | --- | --- |
| `<title>` | Movie & TV Watchlist & Premiere Tracker \| Corner Video | 54 |
| Meta description | Track movies and TV shows in one watchlist, see premiere dates for what's coming, and find your next watch. Your neighbourhood video store, minus the late fees. | 160 |
| `og:title` | Corner Video: your neighbourhood video store, reopened | 54 |
| `og:description` | One shelf for every movie and show you want to see, with premiere dates so nothing slips by. | 92 |
| `og:site_name` | Corner Video | 12 |
| Web app manifest `name` / `short_name` | Corner Video / Corner Video | 12 |

Next.js App Router root layout (`app/layout.tsx`). Set `metadataBase` to the final domain once it is registered:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://cornervideo.app"),
  title: {
    default: "Movie & TV Watchlist & Premiere Tracker | Corner Video",
    template: "%s | Corner Video",
  },
  description:
    "Track movies and TV shows in one watchlist, see premiere dates for what's coming, and find your next watch. Your neighbourhood video store, minus the late fees.",
  applicationName: "Corner Video",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Corner Video",
    title: "Corner Video: your neighbourhood video store, reopened",
    description:
      "One shelf for every movie and show you want to see, with premiere dates so nothing slips by.",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};
```

JSON-LD for the home page:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Corner Video",
  "url": "https://cornervideo.app",
  "description": "A movie and TV watchlist with premiere dates and new release alerts.",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web, iOS, Android"
}
```

Add `offers` and ratings only once pricing and store reviews exist; don't publish placeholder values.

## Visual direction

The look is a small independent video store: cream tape-sleeve paper, rental-sticker red, shelves of spines and handwritten staff cards. Every text pair below passes WCAG 2.1 AA for normal text; ratios were calculated.

| Token | Light | Dark | Use | Contrast on background (light / dark) |
| --- | --- | --- | --- | --- |
| `--bg` | #F6EFE0 | #15130F | Page background | — |
| `--text` | #1C1A17 | #F6EFE0 | Body text | 15.2:1 / 16.2:1 |
| `--muted` | #6B6358 | #A89F91 | Secondary text, meta | 5.2:1 / 7.1:1 |
| `--primary` | #B3261E | #F28B82 | Buttons, links, the rental sticker | 5.7:1 / 7.8:1 |
| `--accent` | #0F766E | #5EEAD4 | Coming Soon, alerts, focus ring | 4.8:1 / 12.5:1 |
| `--highlight` | #E8A33A | #E8A33A | Background fill only (badges, Staff Picks cards) with #1C1A17 text on top | 8.1:1 text-on-fill |

Never use `--highlight` as a text colour on the light background. Avoid a royal-blue-and-yellow pairing, which reads as Blockbuster's trade dress.

**Type**

- Display: a bold condensed sans that recalls store signage, such as Archivo (condensed width) or Oswald from Google Fonts.
- Body: a clear humanist sans such as Public Sans or Source Sans 3.
- Staff Picks cards: a handwriting face such as Caveat, for card headlines of a few words only, never body text.

**Motifs**

- Shelves: rows of posters with a thin shelf line beneath, like tape spines facing out.
- Rental sticker: a round red badge for dates and states ("Fri", "New", "S2").
- Staff Picks cards: a slightly rotated index card on the amber fill.
- App icon: a corner storefront with a striped awning, or a red rental sticker reading "CV". Test it at 29 px before committing.

## Implementation checklist

This doc lives in the repo at `docs/corner-video-brand-guide.md` and is referenced from `CLAUDE.md`, so Claude Code uses it on every redesign task.

**Codebase**

- [ ] Replace every "Movie Watchlist" and "MovieWatchlist" string, including the header logo text
- [ ] Update root layout metadata and add the JSON-LD (see Web metadata)
- [ ] Add the colour tokens as CSS variables with light and dark values, and map them into the Tailwind theme
- [ ] Add an `opengraph-image` route using the palette and tagline
- [ ] Update the web app manifest name, short name, theme colour and icons
- [ ] Rename UI labels per the vocabulary map; accessible names match the visible labels
- [ ] Re-run contrast and keyboard checks after the restyle

**Launch housekeeping**

- [ ] Register cornervideo.app (and a .com variant if available)
- [ ] Reserve "Corner Video" in App Store Connect and the Google Play Console
- [ ] Claim matching social handles
- [x] Point the domain at the Cloudflare Worker and retire moviewatchlist.742designs.workers.dev
- [ ] File a trademark application (CIPO first; USPTO before a US launch)
