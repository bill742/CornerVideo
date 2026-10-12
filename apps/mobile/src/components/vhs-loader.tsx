import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useBrand } from "@/lib/theme";

/**
 * Drawn on the web loader's 200×116 grid (apps/web/src/components/brand/
 * vhs-loader.tsx) and scaled by K, so the two apps show the same tape. Built
 * from Views rather than SVG to avoid a native dependency for one graphic.
 */
const K = 1.12;
const u = (n: number) => n * K;

// Fixed tape colours: a cassette is black plastic in either theme.
const SHELL = "#1C1A17";
const LABEL = "#F6EFE0";
const WINDOW = "#0C0B09";
const TAPE = "#3B2C1E";

const REELS = [70, 130];
const REEL_Y = 73;
const PACK_R = 20;
const HUB_R = 8;

interface VhsLoaderProps {
  /** Read to screen readers; the caption on screen is decorative. */
  label?: string;
}

/**
 * The house loading state: a rental tape winding behind its window. Fades in
 * after a short delay so a quick load shows nothing at all. Use it for
 * full-screen loads; small inline spinners (buttons, settings rows) stay as
 * ActivityIndicator.
 */
function VhsLoader({ label = "Loading" }: VhsLoaderProps) {
  const { colors } = useBrand();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const spin = useSharedValue(0);
  const wind = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 250 }));

    if (!reduceMotion) {
      spin.value = withRepeat(
        withTiming(-360, { duration: 1100, easing: Easing.linear }),
        -1,
      );
      wind.value = withRepeat(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(spin);
      cancelAnimation(wind);
    };
  }, [opacity, reduceMotion, spin, wind]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const hubStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));
  // One pack empties as the other fills.
  const leftPackStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.5 * wind.value }],
  }));
  const rightPackStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.5 + 0.5 * wind.value }],
  }));

  return (
    <Animated.View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessible
      // Plain style, not className: NativeWind doesn't reliably style
      // Reanimated components.
      style={[
        { alignItems: "center", flex: 1, gap: 16, justifyContent: "center" },
        fadeStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: SHELL,
          borderColor: colors.line,
          borderRadius: u(7),
          borderWidth: 2,
          height: u(116),
          width: u(200),
        }}
      >
        {/* Spine label, the store's own sticker on the tape */}
        <View
          style={{
            alignItems: "center",
            backgroundColor: LABEL,
            borderRadius: 2,
            height: u(26),
            justifyContent: "flex-end",
            left: u(16),
            overflow: "hidden",
            paddingBottom: u(3),
            position: "absolute",
            top: u(8),
            width: u(164),
          }}
        >
          <View
            style={{
              backgroundColor: colors.primary,
              height: u(6),
              left: 0,
              position: "absolute",
              right: 0,
              top: 0,
            }}
          />
          <Text
            style={{
              color: SHELL,
              fontFamily: "Oswald_600SemiBold",
              fontSize: u(11),
              letterSpacing: 1.5,
            }}
          >
            CORNER VIDEO
          </Text>
        </View>

        {/* Window onto the reels */}
        <View
          style={{
            backgroundColor: WINDOW,
            borderRadius: u(6),
            height: u(50),
            left: u(30),
            position: "absolute",
            top: u(46),
            width: u(136),
          }}
        />

        {REELS.map((cx, index) => (
          <Animated.View
            key={`pack-${cx}`}
            style={[
              {
                backgroundColor: TAPE,
                borderRadius: u(PACK_R),
                height: u(PACK_R * 2),
                left: u(cx - 2 - PACK_R),
                position: "absolute",
                top: u(REEL_Y - 2 - PACK_R),
                width: u(PACK_R * 2),
              },
              index === 0 ? leftPackStyle : rightPackStyle,
            ]}
          />
        ))}

        {/* Tape running across the bottom of the window */}
        <View
          style={{
            backgroundColor: TAPE,
            height: u(2),
            left: u(50),
            position: "absolute",
            top: u(93),
            width: u(96),
          }}
        />

        {REELS.map((cx) => (
          <Animated.View
            key={`hub-${cx}`}
            style={[
              {
                backgroundColor: LABEL,
                borderRadius: u(HUB_R),
                height: u(HUB_R * 2),
                left: u(cx - 2 - HUB_R),
                position: "absolute",
                top: u(REEL_Y - 2 - HUB_R),
                width: u(HUB_R * 2),
              },
              hubStyle,
            ]}
          >
            {/* Three spokes, each drawn at the top of a rotated layer */}
            {[0, 120, 240].map((angle) => (
              <View
                key={angle}
                style={{
                  height: u(HUB_R * 2),
                  position: "absolute",
                  transform: [{ rotate: `${angle}deg` }],
                  width: u(HUB_R * 2),
                }}
              >
                <View
                  style={{
                    backgroundColor: WINDOW,
                    height: u(5),
                    left: u(HUB_R - 1.25),
                    position: "absolute",
                    top: 0,
                    width: u(2.5),
                  }}
                />
              </View>
            ))}
            <View
              style={{
                backgroundColor: WINDOW,
                borderRadius: u(2.5),
                height: u(5),
                left: u(HUB_R - 2.5),
                position: "absolute",
                top: u(HUB_R - 2.5),
                width: u(5),
              }}
            />
          </Animated.View>
        ))}
      </View>
      <Text
        className="font-display text-base tracking-wide text-muted"
        importantForAccessibility="no"
      >
        Rewinding…
      </Text>
    </Animated.View>
  );
}
VhsLoader.displayName = "VhsLoader";

export { VhsLoader };
