import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from '../motion/useReducedMotion';
import { BRAND_MARK_ASPECT, BrandMark } from './BrandMark';

/**
 * Timeline of the website's page loader (azari-client `logo-animated.svg`):
 * one 3.6s cycle that wipes the logo up from the bottom while it rises a
 * little (0-45%), holds (45-90%), then fades out (90-100%) and repeats.
 */
export const LOGO_LOADER_TIMING = Object.freeze({
  cycleMs: 3600,
  revealMs: 1620,
  holdMs: 1620,
  fadeMs: 360,
  /** Upward travel during the reveal, as a share of the logo height. */
  rise: 0.11,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
});

export interface LogoLoaderProps {
  /** Logo width in points; the height follows the artwork's aspect. */
  width: number;
  /** Accessible name; omit when the loader is purely decorative. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The website's loading animation as a native component: used full-screen by
 * the splash and, smaller, as the placeholder of every remote image. It runs
 * on the native driver and shows the finished logo, still, when the user has
 * asked for reduced motion.
 */
export function LogoLoader({
  width,
  accessibilityLabel,
  style,
  testID,
}: LogoLoaderProps) {
  const reduced = useReducedMotion();
  const reveal = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const height = width / BRAND_MARK_ASPECT;

  useEffect(() => {
    if (reduced) {
      reveal.setValue(1);
      opacity.setValue(1);
      return;
    }
    const { revealMs, holdMs, fadeMs, easing } = LOGO_LOADER_TIMING;
    const reset = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, { toValue, duration: 0, useNativeDriver: true });
    const cycle = Animated.loop(
      Animated.sequence([
        Animated.parallel([reset(reveal, 0), reset(opacity, 1)]),
        Animated.timing(reveal, {
          toValue: 1,
          duration: revealMs,
          easing,
          useNativeDriver: true,
        }),
        Animated.delay(holdMs),
        Animated.timing(opacity, {
          toValue: 0,
          duration: fadeMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    cycle.start();
    return () => cycle.stop();
  }, [reveal, opacity, reduced]);

  // A clipping window slides up from below while the artwork inside slides
  // the other way, so the logo is uncovered bottom-up as it rises into place.
  const hidden = Animated.subtract(1, reveal);
  const windowY = Animated.multiply(hidden, height);
  const artY = Animated.multiply(
    hidden,
    -(1 - LOGO_LOADER_TIMING.rise) * height,
  );

  return (
    <View
      style={[{ width, height }, style]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel ? 'yes' : 'no-hide-descendants'
      }
      testID={testID}
    >
      <Animated.View
        style={[
          styles.window,
          { width, height, opacity, transform: [{ translateY: windowY }] },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: artY }] }}>
          <BrandMark size={width} variant="gradient" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: { overflow: 'hidden' },
});
