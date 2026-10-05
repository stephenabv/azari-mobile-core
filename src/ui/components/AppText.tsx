import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';

export type TextVariant = keyof Theme['type'];
export type TextTone =
  | 'default'
  | 'muted'
  | 'accent'
  | 'danger'
  | 'success'
  | 'inverse'
  | 'onNight'
  | 'onNightMuted';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

/** Themed Text. Font scaling stays on for accessibility, capped to keep layouts intact. */
export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const color = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    accent: theme.colors.accentText,
    danger: theme.colors.danger,
    success: theme.colors.success,
    inverse: theme.colors.onAccent,
    onNight: theme.colors.onNight,
    onNightMuted: theme.colors.onNightMuted,
  }[tone];
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        theme.type[variant],
        { color },
        align ? styles[align] : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});
