import { BRAND } from "@/types";

function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm sm:px-6 md:flex-row md:items-baseline md:justify-between lg:px-8">
        <p>
          <span className="font-display text-foreground mr-2 text-base font-semibold tracking-wide uppercase">
            {BRAND.name}
          </span>
          {BRAND.tagline}
        </p>
        <p>
          Movie and TV data from{" "}
          <a
            className="hover:text-foreground underline underline-offset-4"
            href="https://www.themoviedb.org/"
            rel="noopener noreferrer"
            target="_blank"
          >
            TMDB
          </a>
          . Not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}

Footer.displayName = "Footer";

export { Footer };
