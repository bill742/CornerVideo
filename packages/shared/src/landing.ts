/**
 * Copy for the web landing page, kept here so the mobile app can reuse it on
 * a welcome screen. Brand voice: the friendly clerk, short and specific
 * (docs/corner-video-brand-guide.md → Voice and tone). Canadian spelling.
 */

export const LANDING_STEPS = [
  {
    body: "Search any movie or show, or browse what's in theatres, new on digital and coming soon.",
    title: "Find it",
  },
  {
    body: "Add it to My Shelf in one tap. Movies and shows sit side by side.",
    title: "Put it on the shelf",
  },
  {
    body: "Coming Soon shows when it arrives. Tick it off when you've watched it, down to the episode.",
    title: "Know when it lands",
  },
] as const;

export const LANDING_PILLARS = [
  {
    body: "Films and series on the same shelf. No second app for TV.",
    title: "Movies and shows, one shelf",
  },
  {
    body: "Release dates for the films and new seasons you care about, before they hit your streamer.",
    title: "See it on the Coming Soon wall",
  },
  {
    body: "Nothing to post and nobody to keep up with.",
    title: "No feed. No followers. Just your shelf.",
  },
] as const;
