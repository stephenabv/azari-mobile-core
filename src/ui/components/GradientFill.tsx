import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export interface GradientFillProps {
  /** Colour stops, spread evenly from the top-left to the bottom-right. */
  colors: readonly string[];
}

/**
 * Absolute-fill diagonal gradient (the website's 135deg) behind a surface's
 * content. The parent sets the shape: give it a radius and overflow hidden.
 */
export function GradientFill({ colors }: GradientFillProps) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const last = Math.max(colors.length - 1, 1);
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {colors.map((color, i) => (
            <Stop key={`${color}${i}`} offset={i / last} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
