import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MOTION } from './tokens';
import { useReducedMotion } from './useReducedMotion';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed; defaults to the shared press scale. */
  pressedScale?: number;
}

/** Pressable that springs down slightly while touched, like native buttons. */
export function PressableScale({
  style,
  pressedScale = MOTION.pressScale,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = useCallback(
    (toValue: number) =>
      Animated.spring(scale, {
        toValue,
        ...MOTION.spring.press,
        useNativeDriver: true,
      }).start(),
    [scale],
  );

  const handleIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!reduced) springTo(pressedScale);
      onPressIn?.(event);
    },
    [reduced, springTo, pressedScale, onPressIn],
  );
  const handleOut = useCallback(
    (event: GestureResponderEvent) => {
      springTo(1);
      onPressOut?.(event);
    },
    [springTo, onPressOut],
  );

  return (
    <Pressable {...rest} onPressIn={handleIn} onPressOut={handleOut}>
      {state => (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
