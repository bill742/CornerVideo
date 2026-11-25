"use client";

import { useActionState } from "react";

import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type WaitlistState, joinWaitlist } from "@/lib/actions/waitlist";
import { APP_NEWS_CONSENT_TEXT } from "@/types";

const INITIAL: WaitlistState = { message: null, status: "idle" };

interface Props {
  /** Where on the site this form sits, stored with each sign-up. */
  source: string;
}

/**
 * The app waitlist. Plain copy (it's a consent form): an email, an unticked
 * box carrying the exact wording we store (CASL), and a hidden honeypot.
 * Works without JavaScript too, since it's a form action.
 */
function WaitlistForm({ source }: Props) {
  const [state, formAction, pending] = useActionState(joinWaitlist, INITIAL);

  if (state.status === "success") {
    return (
      <p className="flex items-start gap-2 text-sm font-medium" role="status">
        <CircleCheck
          aria-hidden
          className="text-new-release mt-0.5 size-5 shrink-0"
        />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <input name="source" type="hidden" value={source} />
      {/* Honeypot: hidden from people and screen readers, so only a bot that
          fills every field fills it. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor={`website-${source}`}>Website</label>
        <input
          autoComplete="off"
          id={`website-${source}`}
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`waitlist-email-${source}`}>Email</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            autoComplete="email"
            className="sm:flex-1"
            id={`waitlist-email-${source}`}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <Button disabled={pending} type="submit">
            {pending ? "Adding…" : "Notify me"}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input
          className="accent-primary mt-0.5 size-4 shrink-0"
          id={`waitlist-consent-${source}`}
          name="consent"
          required
          type="checkbox"
        />
        <Label
          className="leading-snug font-normal"
          htmlFor={`waitlist-consent-${source}`}
        >
          {APP_NEWS_CONSENT_TEXT}
        </Label>
      </div>

      {state.status === "error" && (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

WaitlistForm.displayName = "WaitlistForm";

export { WaitlistForm };
