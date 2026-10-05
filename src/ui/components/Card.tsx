import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from '../motion/PressableScale';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';

export type CardTone = 'raised' | 'flat' | 'night';

export interface CardProps {
  style?: StyleProp<ViewStyle>;
  highlighted?: boolean;
  /** raised (default) floats on a soft shadow; flat sits on the page tint; night is the dark hero surface. */
  tone?: CardTone;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function Card({
  children,
  style,
  highlighted,
  tone = 'raised',
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: PropsWithChildren<CardProps>) {
  const styles = useThemedStyles(createStyles);
  const content = [
    styles.card,
    styles[tone],
    highlighted && styles.highlighted,
    style,
  ];
  if (!onPress) {
    return (
      <View style={content} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      pressedScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={content}
    >
      {children}
    </PressableScale>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: t.radius.lg,
      padding: t.spacing(4),
    },
    raised: {
      backgroundColor: t.colors.surfaceRaised,
      // Light mode floats on a shadow; dark mode needs an edge instead.
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    flat: { backgroundColor: t.colors.surface },
    night: { backgroundColor: t.colors.night, overflow: 'hidden' },
    highlighted: { borderColor: t.colors.accent, borderWidth: 2 },
  });
