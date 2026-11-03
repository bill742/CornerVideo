"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface BillingSubmitButtonProps {
  children: React.ReactNode;
  name?: string;
  value?: string;
  variant?: "default" | "outline";
}

/**
 * Submit button for the billing forms. Creating a Stripe session takes a
 * moment before the redirect, so the button disables itself meanwhile rather
 * than inviting a second click (and a second Checkout Session).
 */
function BillingSubmitButton({
  children,
  name,
  value,
  variant = "default",
}: BillingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-disabled={pending}
      disabled={pending}
      name={name}
      type="submit"
      value={value}
      variant={variant}
    >
      {children}
    </Button>
  );
}

BillingSubmitButton.displayName = "BillingSubmitButton";

export { BillingSubmitButton };
