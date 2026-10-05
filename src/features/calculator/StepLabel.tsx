import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

/** Numbered sub-heading ("01  Property Classification") used through the calculator. */
export function StepLabel({ index, title }: { index: number; title: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={styles.badge}>
        <AppText variant="caption" tone="accent">
          {String(index).padStart(2, '0')}
        </AppText>
      </View>
      <AppText variant="heading">{title}</AppText>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2),
      marginTop: t.spacing(6),
      marginBottom: t.spacing(3),
    },
    badge: {
      minWidth: 28,
      height: 22,
      paddingHorizontal: t.spacing(1.5),
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
    },
  });
