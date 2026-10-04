import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={styles.track}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.selected]}
          >
            <AppText
              variant="label"
              tone={selected ? 'inverse' : 'default'}
              align="center"
              numberOfLines={2}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      minHeight: 40,
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing(2),
    },
    selected: { backgroundColor: t.colors.accent },
  });
