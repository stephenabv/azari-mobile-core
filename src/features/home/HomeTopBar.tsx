import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandMark } from '../../ui/brand';
import { AppText } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

/** Compact brand bar at the top of the Home tab with a quick chat shortcut. */
export function HomeTopBar({ onTalkToExpert }: { onTalkToExpert: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <FadeIn direction="none" style={styles.bar}>
      <View style={styles.brand}>
        <BrandMark size={28} />
        <AppText variant="title" accessibilityRole="header">
          Azari Solar
        </AppText>
      </View>
      <PressableScale
        onPress={onTalkToExpert}
        accessibilityRole="button"
        accessibilityLabel="Chat with an expert"
        hitSlop={6}
        style={styles.chat}
      >
        <Icon name="chat" size={20} color={theme.colors.text} />
      </PressableScale>
    </FadeIn>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: t.spacing(4),
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(2) },
    chat: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
  });
