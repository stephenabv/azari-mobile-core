import React, { type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../icons';
import { FadeIn } from '../motion/FadeIn';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface SectionAction {
  label: string;
  onPress: () => void;
}

export interface SectionProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  /** Link on the right of the title, e.g. "See all". */
  action?: SectionAction;
  /** Skip the entrance animation (e.g. inside a list that animates itself). */
  still?: boolean;
  testID?: string;
}

/** Titled block of a page with consistent vertical rhythm. */
export function Section({
  title,
  eyebrow,
  subtitle,
  action,
  still = false,
  children,
  testID,
}: PropsWithChildren<SectionProps>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      {eyebrow ? (
        <AppText variant="caption" tone="accent" style={styles.eyebrow}>
          {eyebrow.toUpperCase()}
        </AppText>
      ) : null}
      {title || action ? (
        <View style={styles.head}>
          {title ? (
            <AppText
              variant="title"
              accessibilityRole="header"
              style={styles.title}
            >
              {title}
            </AppText>
          ) : null}
          {action ? (
            <Pressable
              onPress={action.onPress}
              accessibilityRole="link"
              accessibilityLabel={action.label}
              hitSlop={10}
              style={styles.action}
            >
              <AppText variant="label" tone="accent">
                {action.label}
              </AppText>
              <Icon
                name="chevronRight"
                size={14}
                color={theme.colors.accentText}
                strokeWidth={2.2}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {subtitle ? (
        <AppText tone="muted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={title || subtitle ? styles.body : null}>{children}</View>
    </>
  );
  if (still) {
    return (
      <View style={styles.section} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <FadeIn style={styles.section} testID={testID}>
      {content}
    </FadeIn>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    section: { marginBottom: t.spacing(8) },
    eyebrow: { marginBottom: t.spacing(1), letterSpacing: 1 },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing(3),
    },
    title: { flexShrink: 1 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    subtitle: { marginTop: t.spacing(1) },
    body: { marginTop: t.spacing(3) },
  });
