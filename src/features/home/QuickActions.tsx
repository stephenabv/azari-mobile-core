import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import type { HomeActions, HomeSectionProps } from './sections';

interface QuickAction {
  label: string;
  icon: IconName;
  run: (actions: HomeActions) => void;
}

/**
 * Shortcut tiles. Labels deliberately differ from the tab names so the tab
 * buttons stay the only controls called "Packages" or "More".
 */
const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: 'Browse packages', icon: 'bag', run: a => a.openPackages() },
  {
    label: 'Savings calculator',
    icon: 'calculator',
    run: a => a.openCalculator(),
  },
  { label: 'Our projects', icon: 'image', run: a => a.openProjects() },
  { label: 'Ask an expert', icon: 'chat', run: a => a.talkToExpert() },
];

export function QuickActions({ actions }: HomeSectionProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      {QUICK_ACTIONS.map((item, index) => (
        <FadeIn
          key={item.label}
          index={index}
          delay={120}
          fromScale={0.9}
          style={styles.cell}
        >
          <PressableScale
            onPress={() => item.run(actions)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={styles.action}
          >
            <View style={styles.tile}>
              <Icon
                name={item.icon}
                size={22}
                color={theme.colors.accentText}
              />
            </View>
            <AppText
              variant="caption"
              align="center"
              numberOfLines={2}
              style={styles.label}
            >
              {item.label}
            </AppText>
          </PressableScale>
        </FadeIn>
      ))}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: t.spacing(2.5),
      justifyContent: 'space-between',
      marginBottom: t.spacing(7),
    },
    cell: { flex: 1, maxWidth: 120 },
    action: { alignItems: 'center', gap: t.spacing(2) },
    tile: {
      width: 54,
      height: 54,
      borderRadius: t.radius.md + 2,
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
    label: { fontFamily: t.type.label.fontFamily },
  });
