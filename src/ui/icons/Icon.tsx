import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { ICON_PATHS, type IconName } from './paths';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Stroke icon drawn from the path registry. Decorative by default: the
 * control that holds it carries the accessibility label.
 */
export function Icon({ name, size = 22, color, strokeWidth = 1.9 }: IconProps) {
  const theme = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {ICON_PATHS[name].map(d => (
        <Path
          key={d}
          d={d}
          stroke={color ?? theme.colors.text}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
