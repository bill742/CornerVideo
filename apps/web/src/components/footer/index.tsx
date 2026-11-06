import Link from "next/link";

import { BRAND } from "@/types";

const LINK_CLASS = "hover:text-foreground underline-offset-4 hover:underline";

function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <p>
            <span className="font-display text-foreground mr-2 text-base font-semibold tracking-wide uppercase">
              {BRAND.name}
            </span>
            {BRAND.tagline}
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li>
                <Link className={LINK_CLASS} href="/privacy">
                  Privacy
                </Link>
              </li>
              <li>
                <Link className={LINK_CLASS} href="/terms">
                  Terms
                </Link>
              </li>
              <li>
                <a className={LINK_CLASS} href={`mailto:${BRAND.contactEmail}`}>
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
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
