import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface SectionProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  testID?: string;
}

/** Titled block of a page with consistent vertical rhythm. */
export function Section({
  title,
  eyebrow,
  subtitle,
  children,
  testID,
}: PropsWithChildren<SectionProps>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section} testID={testID}>
      {eyebrow ? (
        <AppText variant="label" tone="accent" style={styles.eyebrow}>
          {eyebrow.toUpperCase()}
        </AppText>
      ) : null}
      {title ? (
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {subtitle ? (
        <AppText tone="muted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={title || subtitle ? styles.body : null}>{children}</View>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    section: { marginBottom: t.spacing(10) },
    eyebrow: { marginBottom: t.spacing(1) },
    subtitle: { marginTop: t.spacing(1) },
    body: { marginTop: t.spacing(4) },
  });
