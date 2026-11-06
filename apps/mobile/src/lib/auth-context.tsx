import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { clearRegionCache } from "./profile";
import { identifyPurchaser } from "./purchases";
import {
  cancelReminders,
  clearReminderHistory,
  setRemindersEnabled,
} from "./reminders";
import { supabase } from "./supabase";

interface AuthContextValue {
  /** Current Supabase session, or null when signed out. */
  session: Session | null;
  /** True until the initial session check resolves. */
  initializing: boolean;
  /**
   * Emails a password reset link. Resolves the same way whether or not the
   * email has an account; throws only for errors such as rate limiting.
   */
  requestPasswordReset: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Permanently deletes the member's account through the delete-account Edge
   * Function, then signs out on this device. Throws if the server refuses.
   */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // RevenueCat's App User ID is the Supabase user id; the purchase webhooks
  // rely on it to find the member. Follows sign-in, sign-out and launch.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (initializing) return;
    identifyPurchaser(userId).catch((err) =>
      console.warn("Could not identify the member with RevenueCat:", err),
    );
  }, [initializing, userId]);

  async function requestPasswordReset(email: string) {
    // The link opens the web app's /reset-password page (set by the Supabase
    // "Reset password" email template), so mobile needs no deep link; the
    // member sets the new password there and signs in here with it.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error?.status === 429) {
      throw new Error(
        "Too many reset requests. Wait a few minutes and try again.",
      );
    }
    if (error) console.warn("resetPasswordForEmail failed:", error.message);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  /** Otherwise the next account to sign in on this device inherits these. */
  async function clearDeviceState() {
    clearRegionCache();
    await Promise.all([
      cancelReminders(),
      clearReminderHistory(),
      setRemindersEnabled(false),
    ]).catch((err) =>
      console.warn("Could not clear reminders on sign-out:", err),
    );
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await clearDeviceState();
  }

  async function deleteAccount() {
    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });
    if (error) throw error;
    // The user no longer exists, so a global sign-out would fail; clearing
    // the local session is all that's left. It also fires SIGNED_OUT, which
    // sends the root layout back to the auth screens.
    await supabase.auth.signOut({ scope: "local" });
    await clearDeviceState();
  }

  return (
    <AuthContext.Provider
      value={{
        deleteAccount,
        initializing,
        requestPasswordReset,
        session,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
AuthProvider.displayName = "AuthProvider";

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { AuthProvider, useAuth };
