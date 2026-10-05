import React, { type PropsWithChildren, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Screen } from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useScreenCaptureProtection } from '../../ui/hooks/useScreenCaptureProtection';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';

export interface FormSheetProps {
  title: string;
  subtitle?: string;
  /** Optional icon shown in a tinted tile beside the title. */
  icon?: IconName;
  footer: ReactElement;
  testID?: string;
}

/**
 * Layout for modal forms that collect personal details: keyboard aware,
 * pinned submit bar, narrower column on tablets, and screen capture blocked.
 */
export function FormSheet({
  title,
  subtitle,
  icon,
  footer,
  children,
  testID,
}: PropsWithChildren<FormSheetProps>) {
  useScreenCaptureProtection();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  return (
    <Screen keyboardAware footer={footer} testID={testID}>
      <View style={size === 'compact' ? null : styles.narrow}>
        <FadeIn style={styles.header}>
          {icon ? (
            <View style={styles.iconTile}>
              <Icon name={icon} size={20} color={theme.colors.accentText} />
            </View>
          ) : null}
          <View style={styles.headerText}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText tone="muted" style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </FadeIn>
        {children}
      </View>
    </Screen>
  );
}

export interface FormSectionProps {
  title: string;
  icon?: IconName;
  /** Position among the sections, for the staggered entrance. */
  index?: number;
}

/** Card grouping related fields of a form under a small heading. */
export function FormSection({
  title,
  icon,
  index = 0,
  children,
}: PropsWithChildren<FormSectionProps>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <FadeIn index={index + 1} style={styles.section}>
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          {icon ? (
            <Icon
              name={icon}
              size={15}
              color={theme.colors.accentText}
              strokeWidth={2.2}
            />
          ) : null}
          <AppText
            variant="caption"
            tone="muted"
            accessibilityRole="header"
            style={styles.sectionTitle}
          >
            {title}
          </AppText>
        </View>
        {children}
      </Card>
    </FadeIn>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    narrow: { width: '100%', maxWidth: 640, alignSelf: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      marginBottom: t.spacing(5),
    },
    iconTile: {
      width: 44,
      height: 44,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
    },
    headerText: { flex: 1 },
    subtitle: { marginTop: 2 },
    section: { marginBottom: t.spacing(4) },
    sectionCard: { paddingBottom: 0 },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(1.5),
      marginBottom: t.spacing(3),
    },
    sectionTitle: { fontFamily: FONTS.semibold, letterSpacing: 0.3 },
  });
