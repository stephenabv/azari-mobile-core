import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/components';
import { SunRays } from '../../ui/brand';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';

export type CommercialInquiry = 'quote' | 'consultation';

interface CtaAction {
  label: string;
  inquiryType: CommercialInquiry;
  icon: IconName;
  primary: boolean;
}

const ACTIONS: readonly CtaAction[] = [
  {
    label: 'Contact Our C&I Team',
    inquiryType: 'quote',
    icon: 'factory',
    primary: true,
  },
  {
    label: 'Schedule a Consultation',
    inquiryType: 'consultation',
    icon: 'chat',
    primary: false,
  },
];

/** Dark commercial and industrial call to action at the foot of Packages. */
export function CommercialCta({
  onSelect,
}: {
  onSelect: (inquiryType: CommercialInquiry) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <FadeIn style={styles.card}>
      <View style={styles.rays} pointerEvents="none">
        <SunRays
          size={180}
          color={theme.colors.sun}
          withCore={false}
          rayOpacity={0.18}
        />
      </View>
      <AppText variant="title" tone="onNight" accessibilityRole="header">
        <AppText variant="title" style={styles.sun}>
          Future-proof
        </AppText>{' '}
        your business infrastructure.
      </AppText>
      <AppText variant="label" tone="onNightMuted" style={styles.copy}>
        Commercial and industrial energy demands require sophisticated, scalable
        engineering. Get in touch with our specialist team for a comprehensive
        energy audit, financial feasibility breakdown, and custom system design.
      </AppText>
      <View style={styles.actions}>
        {ACTIONS.map(action => {
          const fg = action.primary
            ? theme.colors.onAccent
            : theme.colors.onNight;
          return (
            <PressableScale
              key={action.inquiryType}
              onPress={() => onSelect(action.inquiryType)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={[
                styles.action,
                action.primary ? styles.primary : styles.secondary,
              ]}
            >
              <Icon name={action.icon} size={16} color={fg} strokeWidth={2} />
              <AppText
                variant="label"
                numberOfLines={2}
                style={[styles.actionText, { color: fg }]}
              >
                {action.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </FadeIn>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      marginTop: t.spacing(2),
      borderRadius: t.radius.xl,
      backgroundColor: t.colors.night,
      padding: t.spacing(5),
      overflow: 'hidden',
    },
    rays: { position: 'absolute', right: -60, top: -60 },
    sun: { color: t.colors.sun },
    copy: { marginTop: t.spacing(2), fontFamily: FONTS.regular },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(2.5),
      marginTop: t.spacing(4),
    },
    action: {
      flexGrow: 1,
      flexBasis: 140,
      minHeight: 44,
      borderRadius: t.radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing(2),
      paddingHorizontal: t.spacing(4),
      paddingVertical: t.spacing(2),
    },
    primary: { backgroundColor: t.colors.accent },
    secondary: { backgroundColor: 'rgba(255,255,255,0.1)' },
    actionText: { flexShrink: 1, textAlign: 'center' },
  });
