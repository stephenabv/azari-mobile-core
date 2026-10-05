import React from 'react';
import Svg, { Path } from 'react-native-svg';

/** The Azari logo mark: three sun rays over three panel stripes. */
const RAYS = [
  'M18.279 19.0661L25.4282 2.18262L29.1316 10.9039L20.0826 20.2114C19.5262 19.7677 18.9223 19.383 18.279 19.0661Z',
  'M21.3994 21.4741L29.9058 12.7256L32.8181 19.584L22.8609 23.7081C22.474 22.8955 21.9815 22.1463 21.3994 21.4741Z',
  'M23.489 25.4208L33.5308 21.2627L36.1798 27.5009C36.297 27.7771 36.1669 27.9989 35.8916 27.9989H24.3473C24.3484 27.9944 24.3538 27.9831 24.3477 27.9831H23.8175C23.8178 27.974 23.8179 27.9672 23.8181 27.9581C23.8183 27.0822 23.7036 26.2311 23.489 25.4208Z',
] as const;
const PANELS = [
  'M20.009 10.264L16.8391 17.729C16.7628 17.9085 16.5565 18.0535 16.377 18.0535H4.53498C4.35554 18.0535 4.2713 17.9085 4.34752 17.729L7.51747 10.264C7.59368 10.0845 7.8011 9.93945 7.98054 9.93945H19.8226C20.002 9.93945 20.0852 10.0845 20.009 10.264Z',
  'M24.2395 0.32453L21.0695 7.78955C20.9933 7.96904 20.787 8.11408 20.6075 8.11408H8.76545C8.58601 8.11408 8.50177 7.96904 8.57799 7.78955L11.7479 0.32453C11.8242 0.145042 12.0316 0 12.211 0H24.0531C24.2325 0 24.3157 0.145042 24.2395 0.32453Z',
  'M15.8781 20.025L12.4914 28.0005H0.145695C0.0651501 28.0005 0.0274763 27.9356 0.0615348 27.8554L3.3866 20.025C3.42066 19.9448 3.5135 19.8799 3.59404 19.8799H15.794C15.8745 19.8799 15.9122 19.9448 15.8781 20.025Z',
] as const;

export const BRAND_MARK_COLORS = Object.freeze({
  rays: '#FFD600',
  panels: '#FA6E52',
});

export interface BrandMarkProps {
  size?: number;
  /** Accessible name; omit when a visible wordmark sits next to it. */
  accessibilityLabel?: string;
}

export function BrandMark({ size = 28, accessibilityLabel }: BrandMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 -4.5 37 37"
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
    >
      {RAYS.map(d => (
        <Path key={d} d={d} fill={BRAND_MARK_COLORS.rays} fillRule="evenodd" />
      ))}
      {PANELS.map(d => (
        <Path
          key={d}
          d={d}
          fill={BRAND_MARK_COLORS.panels}
          fillRule="evenodd"
        />
      ))}
    </Svg>
  );
}
