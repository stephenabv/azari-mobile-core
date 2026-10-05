import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, ButtonRow } from '../../ui/components';
import { SunRays } from '../../ui/brand';
import { FadeIn } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';

export type CommercialInquiry = 'quote' | 'consultation';

interface CtaAction {
  label: string;
  inquiryType: CommercialInquiry;
  primary: boolean;
}

const ACTIONS: readonly CtaAction[] = [
  {
    label: 'Contact Our C&I Team',
    inquiryType: 'quote',
    primary: true,
  },
  {
    label: 'Schedule a Consultation',
    inquiryType: 'consultation',
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
      <ButtonRow
        style={styles.actions}
        compact
        actions={ACTIONS.map(action => ({
          key: action.inquiryType,
          label: action.label,
          variant: action.primary ? 'primary' : 'onNight',
          onPress: () => onSelect(action.inquiryType),
        }))}
      />
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
    actions: { marginTop: t.spacing(4) },
  });
