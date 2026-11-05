"use client";

import { type ComponentProps, useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * A password field with a Show / Hide button, so members can check what they
 * typed instead of entering it twice. The button's accessible name starts
 * with its visible text ("Show password"), so voice control works with what's
 * on screen.
 */
function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type">) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <Input {...props} className="pr-16" type={shown ? "text" : "password"} />
      <button
        aria-controls={props.id}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 rounded-r-md px-3 text-sm font-medium"
        onClick={() => setShown((value) => !value)}
        type="button"
      >
        {shown ? "Hide" : "Show"}
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
