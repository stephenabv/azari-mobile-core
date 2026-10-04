import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/components';

/** "01  Property Classification" heading used through the calculator. */
export function StepLabel({ index, title }: { index: number; title: string }) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <AppText variant="label" tone="accent">
        {String(index).padStart(2, '0')}
      </AppText>
      <AppText variant="heading">{title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 28,
    marginBottom: 12,
  },
});
