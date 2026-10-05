import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '../icons';
import { PressableScale } from '../motion/PressableScale';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { FONTS, type Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  /** Shorthand for a leading stroke icon. */
  icon?: IconName;
  accessibilityHint?: string;
}

/** Selectable pill used for filters and option pickers. */
export function Chip({
  label,
  selected = false,
  onPress,
  leading,
  icon,
  accessibilityHint,
}: ChipProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const fg = selected ? theme.colors.background : theme.colors.text;
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[styles.chip, selected && styles.selected]}
    >
      {leading}
      {icon ? <Icon name={icon} size={15} color={fg} strokeWidth={2} /> : null}
      <AppText variant="label" numberOfLines={1} style={{ color: fg }}>
        {label}
      </AppText>
    </PressableScale>
  );
}

/** Small non-interactive label, e.g. "Recommended". */
export function Badge({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'muted' | 'sun';
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <AppText
        variant="caption"
        tone={tone === 'muted' ? 'muted' : 'inverse'}
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
      gap: t.spacing(1.5),
      minHeight: 36,
      paddingHorizontal: t.spacing(3.5),
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    selected: {
      backgroundColor: t.colors.text,
      borderColor: t.colors.text,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: t.spacing(2),
      paddingVertical: 2,
      borderRadius: t.radius.pill,
    },
    badge_accent: { backgroundColor: t.colors.accent },
    badge_sun: { backgroundColor: t.colors.sun },
    badge_muted: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    badgeText: { fontFamily: FONTS.bold, fontSize: 11, lineHeight: 15 },
  });
