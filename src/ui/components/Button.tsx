import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from '../icons';
import { PressableScale } from '../motion/PressableScale';
import { useThemedStyles } from '../theme/ThemeContext';
import { GRADIENTS, type Theme } from '../theme/theme';
import { AppText } from './AppText';
import { GradientFill } from './GradientFill';

/**
 * Labels always stay on one line; a label that would not fit shrinks a
 * little instead of wrapping or clipping.
 */
const MIN_FONT_SCALE = 0.8;

/** `onNight` is the outlined button for dark hero and call-to-action cards. */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'night'
  | 'onNight';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  /** Optional trailing icon, e.g. an arrow on a call to action. */
  icon?: IconName;
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
  icon,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || loading;
  const textStyle = styles[`${variant}Text`];
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={compact ? 8 : 0}
      style={[
        styles.base,
        compact && styles.compact,
        styles[variant],
        inactive && styles.disabled,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <GradientFill colors={GRADIENTS.action} />
      ) : null}
      {loading ? (
        <ActivityIndicator color={textStyle.color} />
      ) : (
        <View style={styles.row}>
          <AppText
            variant="label"
            style={[styles.text, compact && styles.textCompact, textStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={MIN_FONT_SCALE}
            align="center"
          >
            {label}
          </AppText>
          {icon ? (
            <Icon
              name={icon}
              size={compact ? 16 : 18}
              color={textStyle.color}
              strokeWidth={2.2}
            />
          ) : null}
        </View>
      )}
    </PressableScale>
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
      overflow: 'hidden',
    },
    compact: { minHeight: 36, paddingHorizontal: t.spacing(4) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing(2),
      maxWidth: '100%',
    },
    text: { fontSize: 14, flexShrink: 1 },
    textCompact: { fontSize: 13 },
    primary: { backgroundColor: t.colors.accent },
    secondary: {
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    ghost: { backgroundColor: 'transparent' },
    night: { backgroundColor: t.colors.night },
    onNight: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    disabled: { opacity: 0.5 },
    primaryText: { color: t.colors.onAccent },
    secondaryText: { color: t.colors.text },
    ghostText: { color: t.colors.accentText },
    nightText: { color: t.colors.onNight },
    onNightText: { color: t.colors.onNight },
  });
