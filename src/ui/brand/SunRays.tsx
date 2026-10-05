import React from 'react';
import Svg, { Circle, G, Line } from 'react-native-svg';

const RAYS: ReadonlyArray<readonly [number, number, number, number]> = [
  [100, 20, 100, 48],
  [100, 152, 100, 180],
  [20, 100, 48, 100],
  [152, 100, 180, 100],
  [43, 43, 63, 63],
  [137, 137, 157, 157],
  [43, 157, 63, 137],
  [137, 63, 157, 43],
];

export interface SunRaysProps {
  size: number;
  color: string;
  /** Draw the solid sun disc in the middle. */
  withCore?: boolean;
  rayOpacity?: number;
}

/** Decorative sun used behind the hero card and on the splash screen. */
export function SunRays({
  size,
  color,
  withCore = true,
  rayOpacity = 0.55,
}: SunRaysProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {withCore ? <Circle cx={100} cy={100} r={34} fill={color} /> : null}
      <G
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={rayOpacity}
      >
        {RAYS.map(([x1, y1, x2, y2]) => (
          <Line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </G>
    </Svg>
  );
}
