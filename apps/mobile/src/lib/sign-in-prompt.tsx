import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "expo-router";
import { Modal, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignInPromptPanel } from "@/components/sign-in-prompt-panel";

import { useAuth } from "./auth-context";

type AuthRoute = "/login" | "/signup";

interface SignInPromptContextValue {
  /**
   * Runs `action` now when signed in. For a guest, opens the sign-in prompt
   * instead and keeps `action` to run once they sign in from it — so "Add to
   * shelf" as a guest ends with the title on their shelf. Write the action to
   * cope with an account that already has data (a title already shelved).
   */
  runWithAccount: (action: () => void) => void;
  /**
   * Drops the kept action if the sign-in screens close without a session, so
   * a later, unrelated sign-in doesn't replay it. Called by `(auth)/_layout`.
   */
  cancelPendingIfSignedOut: () => void;
}

const SignInPromptContext = createContext<SignInPromptContextValue | undefined>(
  undefined,
);

/**
 * The guest-to-member bridge. Must sit inside the router (it navigates to the
 * `(auth)` screens) and inside `AuthProvider`.
 */
function SignInPromptProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  // Where to go once the sheet has finished closing: iOS can't present the
  // sign-in modal while the sheet's own modal is still animating away.
  const nextRoute = useRef<AuthRoute | null>(null);
  // A layout effect, so it is current before any screen's unmount cleanup
  // (cancelPendingIfSignedOut) can read it.
  const signedIn = useRef(session !== null);
  useLayoutEffect(() => {
    signedIn.current = session !== null;
  }, [session]);

  const runWithAccount = useCallback((action: () => void) => {
    if (signedIn.current) {
      action();
      return;
    }
    pending.current = action;
    setVisible(true);
  }, []);

  const cancelPendingIfSignedOut = useCallback(() => {
    if (!signedIn.current) pending.current = null;
  }, []);

  // Sign-in removes the (auth) screens (Stack.Protected in the root layout),
  // which returns the member to the screen they were on; finish what they
  // started there.
  useEffect(() => {
    if (!session || !pending.current) return;
    const action = pending.current;
    pending.current = null;
    action();
  }, [session]);

  function close() {
    setVisible(false);
    pending.current = null;
  }

  function goTo(route: AuthRoute) {
    setVisible(false);
    if (Platform.OS === "ios") {
      nextRoute.current = route;
    } else {
      router.push(route);
    }
  }

  function onDismissed() {
    const route = nextRoute.current;
    nextRoute.current = null;
    if (route) router.push(route);
  }

  const value = useMemo(
    () => ({ cancelPendingIfSignedOut, runWithAccount }),
    [cancelPendingIfSignedOut, runWithAccount],
  );

  return (
    <SignInPromptContext.Provider value={value}>
      {children}
      <Modal
        animationType="slide"
        onDismiss={onDismissed}
        onRequestClose={close}
        transparent
        visible={visible}
      >
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityLabel="Not now"
            accessibilityRole="button"
            className="absolute inset-0 bg-black/60"
            onPress={close}
          />
          <View
            accessibilityViewIsModal
            className="rounded-t-3xl bg-surface px-6 pt-3"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="mb-5 h-1 w-10 self-center rounded-full bg-line" />
            <SignInPromptPanel
              onCreateAccount={() => goTo("/signup")}
              onDismiss={close}
              onSignIn={() => goTo("/login")}
            />
          </View>
        </View>
      </Modal>
    </SignInPromptContext.Provider>
  );
}
SignInPromptProvider.displayName = "SignInPromptProvider";

function useSignInPrompt() {
  const ctx = useContext(SignInPromptContext);
  if (!ctx) {
    throw new Error(
      "useSignInPrompt must be used within a SignInPromptProvider",
    );
  }
  return ctx;
}

export { SignInPromptProvider, useSignInPrompt };
