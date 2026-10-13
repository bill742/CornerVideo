"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { DEFAULT_REGION, type RegionContextType } from "@/types";

const RegionContext = createContext<RegionContextType | undefined>(undefined);

/**
 * Region comes from the signed-in user's profile, set on the Profile page.
 * There was also a header dropdown that wrote to local state only, so the two
 * disagreed and neither survived a reload.
 *
 * Resolved in the browser rather than passed down from a server `getProfile()`
 * call. That call read cookies, which made the home page — the most-visited
 * route in the app — dynamic, so every visit cost a function invocation to
 * personalize a value that only client components ever read. Everything
 * downstream of `useRegion` already fetches its own data client-side, so the
 * default renders first and re-fetches once the real region arrives.
 */
function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<string>(DEFAULT_REGION);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function sync() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setRegion(DEFAULT_REGION);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("region")
        .eq("id", user.id)
        .maybeSingle();

      if (active) setRegion(data?.region ?? DEFAULT_REGION);
    }

    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      sync();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ region }), [region]);

  return (
    <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
  );
}

function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}

RegionProvider.displayName = "RegionProvider";

export { RegionProvider, useRegion };
