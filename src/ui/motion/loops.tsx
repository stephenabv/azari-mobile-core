import React, { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

interface LoopProps {
  style?: StyleProp<ViewStyle>;
}

function useLoop(duration: number, reverse: boolean): Animated.Value {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      value.setValue(0);
      return;
    }
    const step = Animated.timing(value, {
      toValue: 1,
      duration,
      easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear,
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      reverse
        ? Animated.sequence([
            step,
            Animated.timing(value, {
              toValue: 0,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        : step,
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, reverse, reduced]);
  return value;
}

/** Slow continuous rotation, e.g. the sun rays behind the hero. */
export function Spin({
  children,
  style,
  duration = 40000,
}: PropsWithChildren<LoopProps & { duration?: number }>) {
  const value = useLoop(duration, false);
  const rotate = value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  return (
    <Animated.View style={[style, { transform: [{ rotate }] }]}>
      {children}
    </Animated.View>
  );
}

/** Gentle breathing scale and opacity, e.g. a halo or a story ring. */
export function Pulse({
  children,
  style,
  duration = 1500,
  minScale = 1,
  maxScale = 1.12,
  minOpacity = 0.35,
  maxOpacity = 0.9,
}: PropsWithChildren<
  LoopProps & {
    duration?: number;
    minScale?: number;
    maxScale?: number;
    minOpacity?: number;
    maxOpacity?: number;
  }
>) {
  const value = useLoop(duration, true);
  const scale = value.interpolate({
    inputRange: [0, 1],
    outputRange: [minScale, maxScale],
  });
  const opacity = value.interpolate({
    inputRange: [0, 1],
    outputRange: [maxOpacity, minOpacity],
  });
  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** Light sweep across a surface, for image placeholders while loading. */
export function Shimmer({ width, style }: LoopProps & { width: number }) {
  const value = useLoop(1600, false);
  const translateX = value.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width * 1.5],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { transform: [{ translateX }] }]}
    />
  );
}
