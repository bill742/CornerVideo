import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The first-launch welcome screen shows until the person signs in or chooses
 * to browse as a guest; after that it never comes back on this device, even
 * after signing out (they land in the guest app instead).
 */
const SEEN_KEY = "welcome:seen";

/** Read while the splash is up, so the first screen is already the right one. */
async function readWelcomeSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SEEN_KEY)) === "true";
  } catch {
    // Unreadable storage: skip the welcome rather than show it every launch.
    return true;
  }
}

interface WelcomeContextValue {
  seen: boolean;
  markSeen: () => void;
}

const WelcomeContext = createContext<WelcomeContextValue | undefined>(
  undefined,
);

function WelcomeProvider({
  children,
  initialSeen,
}: {
  children: ReactNode;
  initialSeen: boolean;
}) {
  const [seen, setSeen] = useState(initialSeen);

  const markSeen = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(SEEN_KEY, "true").catch((err) =>
      console.warn("Could not save the welcome screen as seen:", err),
    );
  }, []);

  const value = useMemo(() => ({ markSeen, seen }), [markSeen, seen]);

  return (
    <WelcomeContext.Provider value={value}>{children}</WelcomeContext.Provider>
  );
}
WelcomeProvider.displayName = "WelcomeProvider";

function useWelcome() {
  const ctx = useContext(WelcomeContext);
  if (!ctx) throw new Error("useWelcome must be used within a WelcomeProvider");
  return ctx;
}

export { readWelcomeSeen, useWelcome, WelcomeProvider };
