import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { LOGO_LOADER_TIMING, LogoLoader } from '../ui/brand';
import { MOTION, useReducedMotion } from '../ui/motion';
import { useTheme } from '../ui/theme/ThemeContext';
import { LOADER_SURFACE } from '../ui/theme/theme';

/** One full reveal plus a short hold before the app is shown. */
const HOLD_MS = LOGO_LOADER_TIMING.revealMs + 480;
/** Website sizing: clamp(64px, 14vmin, 112px). */
const LOGO_MIN = 64;
const LOGO_MAX = 112;
const LOGO_VMIN = 0.14;

export function splashLogoWidth(width: number, height: number): number {
  const vmin = Math.min(width, height) * LOGO_VMIN;
  return Math.round(Math.min(LOGO_MAX, Math.max(LOGO_MIN, vmin)));
}

/**
 * Brand intro shown over the first frame of the app: the website's page
 * loader on the same surface colour as the native launch screen, so the
 * hand-off is seamless. It stops blocking touches as soon as it starts to
 * fade and is removed from the tree afterwards.
 */
export function AnimatedSplash() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const exit = Animated.sequence([
      Animated.delay(reduced ? MOTION.duration.base : HOLD_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: MOTION.duration.base,
        easing: MOTION.easing.out,
        useNativeDriver: true,
      }),
    ]);
    const timer = setTimeout(
      () => setLeaving(true),
      reduced ? MOTION.duration.base : HOLD_MS,
    );
    exit.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => {
      clearTimeout(timer);
      exit.stop();
    };
  }, [opacity, reduced]);

  if (!visible) return null;

  const surface = theme.dark ? LOADER_SURFACE.dark : LOADER_SURFACE.light;
  return (
    <Animated.View
      pointerEvents={leaving ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { backgroundColor: surface, opacity },
      ]}
      testID="animated-splash"
    >
      <LogoLoader width={splashLogoWidth(width, height)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
});
