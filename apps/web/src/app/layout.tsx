import type { Metadata, Viewport } from "next";
import { Oswald, Public_Sans } from "next/font/google";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import { BRAND, BRAND_COLORS } from "@/types";

import "./globals.css";

/** Store-signage display face: headings, the logo, shelf labels. */
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

// Env-driven until cornervideo.app is registered and pointed at the Worker.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cornervideo.app";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  applicationName: BRAND.name,
  description: BRAND.description,
  metadataBase: new URL(siteUrl),
  openGraph: {
    description: BRAND.positioning,
    siteName: BRAND.name,
    title: `${BRAND.name}: your neighbourhood video store, reopened`,
    type: "website",
    url: "/",
  },
  title: {
    default: `Movie & TV Watchlist & Premiere Tracker | ${BRAND.name}`,
    template: `%s | ${BRAND.name}`,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { color: BRAND_COLORS.light.bg, media: "(prefers-color-scheme: light)" },
    { color: BRAND_COLORS.dark.bg, media: "(prefers-color-scheme: dark)" },
  ],
};

/**
 * Deliberately synchronous and cookie-free.
 *
 * This layout used to await `supabase.auth.getUser()` to pass an email into the
 * header. Reading cookies in the root layout opts *every* route in the app out
 * of static rendering, so nothing could be CDN-cached and each page view cost a
 * function invocation — enough to exhaust the plan's monthly allowance. The
 * header now resolves the session in the browser instead; keep server-side auth
 * reads inside the routes that actually gate on them.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${oswald.variable} ${publicSans.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
