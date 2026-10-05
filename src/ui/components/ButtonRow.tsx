import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { Button, type ButtonProps } from './Button';

export type ButtonRowAction = Omit<ButtonProps, 'style' | 'compact'> & {
  key: string;
};

export interface ButtonRowProps {
  actions: readonly ButtonRowAction[];
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Call-to-action buttons side by side at equal widths on every screen size.
 * Labels stay on one line (Button shrinks a label slightly rather than
 * wrapping), so a pair never stacks on a small phone.
 */
export function ButtonRow({ actions, compact = false, style }: ButtonRowProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.row, style]}>
      {actions.map(({ key, ...action }) => (
        <Button
          key={key}
          {...action}
          compact={compact}
          style={[styles.item, compact && styles.itemCompact]}
        />
      ))}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: t.spacing(2), alignSelf: 'stretch' },
    item: { flex: 1, flexBasis: 0, paddingHorizontal: t.spacing(3) },
    itemCompact: { minHeight: 44, paddingHorizontal: t.spacing(2) },
  });
