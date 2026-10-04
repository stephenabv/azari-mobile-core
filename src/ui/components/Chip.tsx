import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  accessibilityHint?: string;
}

/** Selectable pill used for filters and option pickers. */
export function Chip({
  label,
  selected = false,
  onPress,
  leading,
  accessibilityHint,
}: ChipProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {leading}
      <AppText
        variant="label"
        tone={selected ? 'inverse' : 'default'}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/** Small non-interactive label, e.g. "Recommended". */
export function Badge({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'muted';
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.badge, tone === 'muted' && styles.badgeMuted]}>
      <AppText
        variant="caption"
        tone={tone === 'accent' ? 'inverse' : 'muted'}
        style={styles.badgeText}
      >
        {label}
      </AppText>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2),
      minHeight: 36,
      paddingHorizontal: t.spacing(3.5),
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    selected: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
    pressed: { opacity: 0.75 },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: t.spacing(2),
      paddingVertical: 2,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accent,
    },
    badgeMuted: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    badgeText: { fontWeight: '700' },
  });
