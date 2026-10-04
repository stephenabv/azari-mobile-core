import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export interface OptionCardProps {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

/** Radio-style card for property class and system purpose. */
export function OptionCard({
  title,
  description,
  selected,
  onPress,
}: OptionCardProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      accessibilityHint={description}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.check, selected && styles.checkOn]} />
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {description}
      </AppText>
    </Pressable>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      flexGrow: 1,
      flexBasis: 220,
      gap: t.spacing(1),
      padding: t.spacing(4),
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    selected: { borderColor: t.colors.accent, borderWidth: 2 },
    pressed: { opacity: 0.85 },
    check: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: t.colors.border,
      marginBottom: t.spacing(1),
    },
    checkOn: { borderColor: t.colors.accent, backgroundColor: t.colors.accent },
  });
