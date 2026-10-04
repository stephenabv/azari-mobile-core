import React, { type PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';

export interface CardProps {
  style?: StyleProp<ViewStyle>;
  highlighted?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export function Card({
  children,
  style,
  highlighted,
  onPress,
  accessibilityLabel,
  testID,
}: PropsWithChildren<CardProps>) {
  const styles = useThemedStyles(createStyles);
  const content = [styles.card, highlighted && styles.highlighted, style];
  if (!onPress) {
    return (
      <View style={content} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...content, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surfaceRaised,
      borderRadius: t.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: t.spacing(4),
      overflow: 'hidden',
    },
    highlighted: { borderColor: t.colors.accent, borderWidth: 2 },
    pressed: { opacity: 0.85 },
  });
