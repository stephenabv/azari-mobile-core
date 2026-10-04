import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  compact = false,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={compact ? 8 : 0}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? styles.onPrimary.color
              : styles.onOther.color
          }
        />
      ) : (
        <AppText
          variant="label"
          style={variant === 'primary' ? styles.onPrimary : styles.onOther}
          numberOfLines={2}
          align="center"
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 48,
      paddingHorizontal: t.spacing(5),
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compact: { minHeight: 36, paddingHorizontal: t.spacing(4) },
    primary: { backgroundColor: t.colors.accent },
    primaryPressed: { backgroundColor: t.colors.accentPressed },
    secondary: {
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    secondaryPressed: { backgroundColor: t.colors.surface },
    ghost: { backgroundColor: 'transparent' },
    ghostPressed: { opacity: 0.6 },
    disabled: { opacity: 0.5 },
    onPrimary: { color: t.colors.onAccent, fontSize: 15 },
    onOther: { color: t.colors.text, fontSize: 15 },
  });
