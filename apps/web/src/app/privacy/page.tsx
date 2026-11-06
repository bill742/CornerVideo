import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument } from "@/components/legal/legal-document";

import { BRAND } from "@/types";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description: `What ${BRAND.name} collects, why, who it's shared with, and how to see or delete your data.`,
  title: "Privacy Policy",
};

/**
 * Plain copy only (brand guide: privacy text has no video-store jokes).
 * Written from what the web and mobile apps actually do; when a feature
 * starts collecting something new (the waitlist, sign-up attribution), update
 * this page and its date in the same PR.
 */
export default function PrivacyPage() {
  const email = BRAND.contactEmail;

  return (
    <LegalDocument title="Privacy Policy" updated="November 5, 2026">
      <p>
        {BRAND.name} is a movie and TV watchlist for the web, iPhone and
        Android. This policy explains what we collect when you use it, why, who
        we share it with, and the choices you have. We collect only what the app
        needs to work, we don&apos;t sell your information, and we don&apos;t
        show ads.
      </p>

      <h2>Who we are</h2>
      <p>
        {BRAND.name} is run by 742 Studios, the business name of Bill Dean, a
        sole proprietor in Ontario, Canada. Bill is responsible for how{" "}
        {BRAND.name} handles personal information. You can reach him at{" "}
        <a href={`mailto:${email}`}>{email}</a>.
      </p>

      <h2>What we collect</h2>
      <h3>When you create an account</h3>
      <ul>
        <li>
          Your email address and a password. The password is stored only in a
          hashed form by our authentication provider; we can&apos;t read it.
        </li>
        <li>
          If you sign in with Google or Apple on the web, the email address and
          basic profile details that service shares with us. With Apple, you can
          choose to hide your real email address.
        </li>
      </ul>

      <h3>When you use the app</h3>
      <ul>
        <li>
          The movies and shows on your shelf, their status, and the episodes you
          mark as watched.
        </li>
        <li>
          Your settings: region (used to show the right release dates) and light
          or dark theme.
        </li>
      </ul>

      <h3>When you subscribe to Premium</h3>
      <ul>
        <li>
          Your subscription&apos;s status, which store or service it was bought
          through, and when it renews or ends.
        </li>
        <li>
          On the web, a customer ID from Stripe, our payment processor. Your
          card details go directly to Stripe; we never see or store them.
        </li>
        <li>
          In the iPhone and Android apps, purchases are handled by Apple or
          Google. RevenueCat tells us whether your subscription is active, using
          your account&apos;s ID rather than your name or email.
        </li>
      </ul>

      <h3>Automatically</h3>
      <ul>
        <li>
          Our hosting and database providers keep standard server logs, such as
          IP address, browser type and the pages requested, to keep the service
          running and secure.
        </li>
        <li>
          We use Cloudflare Web Analytics to count visits. It doesn&apos;t use
          cookies or follow you across other sites, and it doesn&apos;t identify
          you.
        </li>
      </ul>

      <h3>Only on your device</h3>
      <ul>
        <li>
          In the mobile apps, New release alerts are scheduled on your phone as
          local notifications. Whether they&apos;re on, and which alerts
          you&apos;ve already received, is stored on the device and not sent to
          us.
        </li>
        <li>
          Your browser or phone stores your sign-in session and theme so you
          stay signed in and the app looks the way you chose.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and keep your shelf in sync across devices.</li>
        <li>To show release dates and new release alerts for your titles.</li>
        <li>To provide Premium and manage your subscription.</li>
        <li>To answer you when you contact us.</li>
        <li>To keep the service secure and fix problems.</li>
        <li>
          To send emails you need, such as confirming your address or resetting
          your password.
        </li>
      </ul>
      <p>
        We don&apos;t sell or rent your personal information, use it for
        advertising, or share it with anyone except the service providers below.
      </p>

      <h2>Who we share it with</h2>
      <p>
        These companies process information for us, only to provide {BRAND.name}
        :
      </p>
      <ul>
        <li>
          <strong>Supabase:</strong> accounts, sign-in, sign-up and password
          emails, and the database that holds your shelf.
        </li>
        <li>
          <strong>Cloudflare:</strong> hosts the website, counts visits with Web
          Analytics, and forwards email sent to our address.
        </li>
        <li>
          <strong>Stripe:</strong> takes payment for Premium on the web.
        </li>
        <li>
          <strong>Apple, Google and RevenueCat:</strong> in-app purchases in the
          mobile apps, and Google or Apple sign-in if you choose it.
        </li>
        <li>
          <strong>TMDB (The Movie Database):</strong> supplies the movie and TV
          information and images. Your browser or phone loads posters directly
          from TMDB, so TMDB receives your IP address. We don&apos;t send TMDB
          anything about your account.
        </li>
      </ul>
      <p>
        These providers may store or process information outside Canada,
        including in the United States, where it is subject to local law.
      </p>
      <p>
        We may also disclose information if the law requires it, or to protect
        the safety of our users or the service.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account information for as long as your account is open.
        When you delete your account, your account, shelf, watched history and
        settings are deleted straight away, along with your Stripe customer
        record and your RevenueCat purchase record. Copies in our database
        backups expire within 30 days. Payment records held by Stripe, Apple or
        Google are kept as long as tax and accounting law requires.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>
          <strong>See or correct your information.</strong> Most of it is on
          your shelf and Membership page. Ask us for a copy of anything else.
        </li>
        <li>
          <strong>Delete your account.</strong> Choose{" "}
          <strong>Delete account</strong> on your Membership page or the
          Membership tab in the app. You can also email{" "}
          <a href={`mailto:${email}`}>{email}</a> from the address on your
          account and we&apos;ll do it for you.
        </li>
        <li>
          <strong>Turn off alerts.</strong> New release alerts can be switched
          off on the Membership tab or in your phone&apos;s settings.
        </li>
        <li>
          <strong>Cancel Premium.</strong> See our{" "}
          <Link href="/terms">Terms of Service</Link> for how to cancel on each
          platform.
        </li>
      </ul>
      <p>
        We answer requests within 30 days. If you&apos;re not satisfied with our
        answer, you can contact the{" "}
        <a
          href="https://www.priv.gc.ca/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Office of the Privacy Commissioner of Canada
        </a>
        .
      </p>

      <h2>Security</h2>
      <p>
        Information is sent over encrypted connections, and each member&apos;s
        data can be read only by that member. No service is perfectly secure, so
        please use a password you don&apos;t use anywhere else.
      </p>

      <h2>Children</h2>
      <p>
        {BRAND.name} isn&apos;t meant for children under 13, and we don&apos;t
        knowingly collect information from them. If you believe a child has
        given us information, contact us and we&apos;ll delete it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        When this policy changes, we&apos;ll update the date at the top. If a
        change affects how we use information you&apos;ve already given us,
        we&apos;ll tell you by email or in the app before it takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalDocument>
  );
}
