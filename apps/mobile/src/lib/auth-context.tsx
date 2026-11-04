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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Otherwise the next account to sign in on this device inherits these.
    clearRegionCache();
    await Promise.all([
      cancelReminders(),
      clearReminderHistory(),
      setRemindersEnabled(false),
    ]).catch((err) =>
      console.warn("Could not clear reminders on sign-out:", err),
    );
  }

  return (
    <AuthContext.Provider
      value={{ initializing, session, signIn, signOut, signUp }}
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
