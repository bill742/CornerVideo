import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument } from "@/components/legal/legal-document";

import { BRAND, FREE_WATCHLIST_LIMIT } from "@/types";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  description: `The terms for using ${BRAND.name}, including accounts, Premium subscriptions and cancellation.`,
  title: "Terms of Service",
};

/** Plain copy only (brand guide: payments and legal text have no jokes). */
export default function TermsPage() {
  const email = BRAND.contactEmail;

  return (
    <LegalDocument title="Terms of Service" updated="November 5, 2026">
      <p>
        These terms are an agreement between you and 742 Studios, the business
        name of Bill Dean, a sole proprietor in Ontario, Canada (&quot;we&quot;
        or &quot;us&quot;). They cover your use of {BRAND.name} on the web,
        iPhone and Android. By creating an account or using {BRAND.name}, you
        agree to them. Our <Link href="/privacy">Privacy Policy</Link> explains
        how we handle your information.
      </p>

      <h2>What {BRAND.name} is</h2>
      <p>
        {BRAND.name} helps you keep track of movies and TV shows you want to see
        and have watched, and shows when they&apos;re released. It doesn&apos;t
        stream or sell video. Titles, dates, images and other details come from
        The Movie Database (TMDB) and may be incomplete or change. {BRAND.name}{" "}
        uses the TMDB API but is not endorsed or certified by TMDB, and
        isn&apos;t affiliated with any studio, streaming service or video store.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>
          You need to be at least 13 to use {BRAND.name}. If you&apos;re under
          the age of majority where you live, you need a parent or
          guardian&apos;s permission.
        </li>
        <li>
          Give a real email address you can receive mail at, and keep your
          password to yourself. You&apos;re responsible for activity on your
          account.
        </li>
        <li>
          An account is for one person. Tell us at{" "}
          <a href={`mailto:${email}`}>{email}</a> if you think someone else has
          used yours.
        </li>
      </ul>

      <h2>Free accounts and Premium</h2>
      <p>
        A free account keeps up to {FREE_WATCHLIST_LIMIT} titles on your shelf.
        Premium is an optional paid subscription that removes that limit and
        adds features described where you buy it. We may change what each plan
        includes; if we take away a Premium feature you&apos;re paying for,
        we&apos;ll tell you first.
      </p>

      <h3>Billing and renewal</h3>
      <ul>
        <li>
          On the web, Premium is billed by Stripe. In the iPhone and Android
          apps, it&apos;s billed to your Apple Account or Google Play account.
        </li>
        <li>
          Premium renews automatically at the end of each monthly or yearly
          period, at the price shown when you subscribed, until you cancel.
        </li>
        <li>
          If a plan starts with a free trial, you&apos;re charged when the trial
          ends unless you cancel before then. Free trials are for new
          subscribers only.
        </li>
        <li>
          If the price changes, we&apos;ll tell you before your next renewal,
          and you can cancel before the new price applies.
        </li>
      </ul>

      <h3>Cancelling</h3>
      <ul>
        <li>
          Web: on your Membership page, choose <strong>Manage billing</strong>
          to open Stripe&apos;s billing portal.
        </li>
        <li>
          iPhone: Settings, then your name, then Subscriptions. Android: Google
          Play, then Payments and subscriptions.
        </li>
        <li>
          Cancelling stops the next renewal. You keep Premium until the end of
          the period you&apos;ve paid for. If your shelf has more titles than
          the free limit, they stay on it, but you can&apos;t add more until
          you&apos;re back under the limit.
        </li>
      </ul>

      <h3>Refunds</h3>
      <p>
        For web subscriptions, email us within 14 days of a charge and
        we&apos;ll consider a refund. Purchases made through Apple or Google
        follow their refund policies, and refund requests go to them. Nothing
        here limits a refund you&apos;re entitled to by law.
      </p>
      <p>
        Purchases through the App Store are also subject to Apple&apos;s{" "}
        <a
          href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Licensed Application End User License Agreement
        </a>
        .
      </p>

      <h2>Using {BRAND.name} fairly</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>
          scrape, copy or bulk-download the service or its data, or use it to
          build a competing database;
        </li>
        <li>
          get around the free limit, Premium checks or other technical limits;
        </li>
        <li>
          interfere with the service, try to access other people&apos;s
          accounts, or probe it for weaknesses without our permission;
        </li>
        <li>use it for anything illegal.</li>
      </ul>
      <p>
        We may suspend or close an account that breaks these rules. Unless
        it&apos;s urgent or the law prevents it, we&apos;ll tell you why first.
      </p>

      <h2>Ownership</h2>
      <p>
        The {BRAND.name} name, design and software belong to us. Movie and TV
        information and images belong to TMDB and the companies that own those
        titles. Your shelf is yours; you can ask for a copy at any time.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using {BRAND.name} at any time. To delete your account,
        choose <strong>Delete account</strong> on your Membership page or the
        Membership tab in the app, or email{" "}
        <a href={`mailto:${email}`}>{email}</a> from the address on the account.
        Deleting your account cancels a web Premium subscription straight away,
        but not one billed by Apple or Google; cancel that in your store
        settings first.
      </p>

      <h2>Changes to the service and these terms</h2>
      <p>
        {BRAND.name} will change over time, and we may update these terms. If a
        change matters, we&apos;ll tell you by email or in the app before it
        takes effect. If you keep using {BRAND.name} after that, the new terms
        apply.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        {BRAND.name} is provided as is. We work to keep it accurate and
        available, but we can&apos;t promise that release dates and other
        details will be correct, or that the service will never be interrupted.
      </p>
      <p>
        To the extent the law allows, we&apos;re not liable for indirect or
        consequential losses, and our total liability to you is limited to the
        amount you paid us for Premium in the 12 months before the claim.
        Nothing in these terms takes away rights you have under consumer
        protection law that can&apos;t be waived.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of Ontario and the federal laws of
        Canada that apply there. If you live elsewhere, you also keep any
        protections your local law gives you.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalDocument>
  );
}
