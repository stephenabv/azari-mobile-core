import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Shown under the label, e.g. "450W each". */
  detail?: string;
}

/** − value + control used by the package configurator. */
export function Stepper({
  label,
  value,
  min,
  max,
  onDecrement,
  onIncrement,
  detail,
}: StepperProps) {
  const styles = useThemedStyles(createStyles);
  const button = (
    glyph: string,
    onPress: () => void,
    disabled: boolean,
    hint: string,
  ) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${hint} ${label}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="heading">{glyph}</AppText>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="label">{label}</AppText>
        {detail ? (
          <AppText variant="caption" tone="muted">
            {detail}
          </AppText>
        ) : null}
      </View>
      <View style={styles.controls} accessibilityLabel={`${label}: ${value}`}>
        {button('−', onDecrement, value <= min, 'Decrease')}
        <AppText
          variant="heading"
          style={styles.value}
          accessibilityLiveRegion="polite"
        >
          {value}
        </AppText>
        {button('+', onIncrement, value >= max, 'Increase')}
      </View>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: t.spacing(1.5),
      gap: t.spacing(3),
    },
    text: { flex: 1 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(2) },
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
    },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.35 },
    value: { minWidth: 28, textAlign: 'center' },
  });
