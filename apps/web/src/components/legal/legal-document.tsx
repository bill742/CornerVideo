import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title: string;
  /** Shown as "Last updated …"; change it whenever the text changes. */
  updated: string;
}

/**
 * The shared frame for the Privacy Policy and Terms: one H1, a date, and
 * readable long-form text. There's no typography plugin, so the section
 * styles are set here for the plain h2/p/ul children the pages write.
 */
function LegalDocument({ children, title, updated }: Props) {
  return (
    <article className="text-foreground [&_h2]:font-display mx-auto max-w-3xl py-10 leading-relaxed [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-wide [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="font-display text-4xl font-semibold tracking-wide md:text-5xl">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">Last updated {updated}</p>
      {children}
    </article>
  );
}

LegalDocument.displayName = "LegalDocument";

export { LegalDocument };
