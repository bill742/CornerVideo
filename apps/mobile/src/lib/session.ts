import { supabase } from "./supabase";

/**
 * Thrown by a write made without a session. Guests can browse, so the UI gates
 * writes behind the sign-in prompt (`useRequireAccount`); this is the backstop
 * if one slips through, with a message fit to show.
 */
class SignInRequiredError extends Error {
  constructor() {
    super("Sign in to keep a shelf.");
    this.name = "SignInRequiredError";
  }
}

/**
 * The signed-in user's id, or null for a guest. Reads the local session only
 * (no network), so reads can return their empty value for a guest cheaply.
 * Writes use `requireUserId`, which asks the server.
 */
async function signedInUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

/** The server-verified user id; throws `SignInRequiredError` for a guest. */
async function requireUserId(): Promise<string> {
  if (!(await signedInUserId())) throw new SignInRequiredError();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new SignInRequiredError();
  return user.id;
}

export { requireUserId, SignInRequiredError, signedInUserId };
