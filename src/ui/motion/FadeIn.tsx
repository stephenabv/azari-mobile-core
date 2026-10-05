import React, { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { MOTION, staggerDelay } from './tokens';
import { useReducedMotion } from './useReducedMotion';

export type FadeDirection = 'up' | 'left' | 'none';

export interface FadeInProps {
  /** Position in a list; turns into a capped stagger delay. */
  index?: number;
  /** Extra delay in ms on top of the stagger. */
  delay?: number;
  direction?: FadeDirection;
  distance?: number;
  /** Starting scale, for a pop-in. 1 disables scaling. */
  fromScale?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Entrance animation (opacity, slide, optional scale) on the native driver. */
export function FadeIn({
  children,
  index = 0,
  delay = 0,
  direction = 'up',
  distance = 14,
  fromScale = 1,
  duration = MOTION.duration.slow,
  style,
  testID,
}: PropsWithChildren<FadeInProps>) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: delay + staggerDelay(index),
      easing: MOTION.easing.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, duration, delay, index]);

  const offset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });
  const scale =
    fromScale === 1
      ? null
      : progress.interpolate({
          inputRange: [0, 1],
          outputRange: [fromScale, 1],
        });
  const transform = [
    ...(direction === 'up' ? [{ translateY: offset }] : []),
    ...(direction === 'left' ? [{ translateX: offset }] : []),
    ...(scale ? [{ scale }] : []),
  ];

  return (
    <Animated.View
      testID={testID}
      style={[style, { opacity: progress, transform }]}
    >
      {children}
    </Animated.View>
  );
}
