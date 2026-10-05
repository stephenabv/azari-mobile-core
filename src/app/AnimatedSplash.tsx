import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { BrandMark, SunRays } from '../ui/brand';
import { AppText } from '../ui/components';
import { FadeIn, MOTION, Pulse, Spin, useReducedMotion } from '../ui/motion';
import { useThemedStyles } from '../ui/theme/ThemeContext';
import type { Theme } from '../ui/theme/theme';

/** How long the brand moment holds before revealing the app. */
const HOLD_MS = 1400;
const LOGO = 88;
const BAR_WIDTH = 72;

/**
 * Brand intro shown over the first frame of the app. It starts on the same
 * night colour and centered logo as the native launch screen, so the hand-off
 * is seamless, then animates and fades out. It never blocks touches once the
 * fade begins and is removed from the tree afterwards.
 */
export function AnimatedSplash() {
  const styles = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const hold = reduced ? MOTION.duration.base : HOLD_MS;
    const loading = Animated.timing(progress, {
      toValue: 1,
      duration: hold,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: MOTION.duration.base,
      easing: MOTION.easing.out,
      useNativeDriver: true,
    });
    loading.start(({ finished }) => {
      if (!finished) return;
      setLeaving(true);
      exit.start(() => setVisible(false));
    });
    return () => {
      loading.stop();
      exit.stop();
    };
  }, [opacity, progress, reduced]);

  if (!visible) return null;

  const barScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 1],
  });

  return (
    <Animated.View
      pointerEvents={leaving ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.root, { opacity }]}
      testID="animated-splash"
    >
      <View style={styles.stage}>
        <Pulse
          style={styles.halo}
          minScale={0.9}
          maxScale={1.1}
          duration={1800}
        >
          <View style={styles.haloFill} />
        </Pulse>
        <Spin style={styles.rays} duration={24000}>
          <SunRays
            size={260}
            color={styles.sun.color}
            withCore={false}
            rayOpacity={0.35}
          />
        </Spin>
        <FadeIn
          direction="none"
          fromScale={0.7}
          duration={MOTION.duration.splash}
        >
          <BrandMark size={LOGO} />
        </FadeIn>
      </View>
      <FadeIn delay={250} distance={10} style={styles.wordmark}>
        <AppText variant="display" tone="onNight" align="center">
          Azari Solar
        </AppText>
      </FadeIn>
      <View style={styles.track}>
        <Animated.View
          style={[styles.bar, { transform: [{ scaleX: barScale }] }]}
        />
      </View>
    </Animated.View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    // The native launch screens use the same night colour in both themes.
    root: {
      backgroundColor: '#121318',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      elevation: 100,
    },
    stage: {
      width: 260,
      height: 260,
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: { position: 'absolute' },
    haloFill: {
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: t.colors.sun,
      opacity: 0.16,
    },
    rays: { position: 'absolute' },
    sun: { color: t.colors.sun },
    wordmark: { marginTop: t.spacing(2) },
    track: {
      marginTop: t.spacing(6),
      width: BAR_WIDTH,
      height: 3,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.14)',
      overflow: 'hidden',
    },
    bar: {
      width: BAR_WIDTH,
      height: 3,
      borderRadius: 2,
      backgroundColor: t.colors.accent,
    },
  });
