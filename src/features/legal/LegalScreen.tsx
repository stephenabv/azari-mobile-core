import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSiteContent } from '../../data/queries';
import {
  AppText,
  Card,
  ErrorView,
  LoadingView,
  Screen,
} from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';

export type LegalContentKey = 'privacyPolicy' | 'termsConditions';

const ICONS: Record<LegalContentKey, IconName> = {
  privacyPolicy: 'shield',
  termsConditions: 'document',
};

/** Privacy policy or terms, edited by the admin and served as site content. */
export function LegalScreen({ contentKey }: { contentKey: LegalContentKey }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const query = useSiteContent();
  if (query.isPending) return <LoadingView />;
  if (!query.data)
    return (
      <ErrorView error={query.error} onRetry={() => void query.refetch()} />
    );
  const doc = query.data.get(contentKey);
  const dates = [
    doc.effectiveDate ? `Effective date: ${doc.effectiveDate}` : null,
    doc.lastUpdated ? `Last updated: ${doc.lastUpdated}` : null,
  ].filter((d): d is string => !!d);

  return (
    <Screen testID={`legal-${contentKey}`}>
      <View style={styles.column}>
        <FadeIn style={styles.header}>
          <View style={styles.iconTile}>
            <Icon
              name={ICONS[contentKey]}
              size={22}
              color={theme.colors.accentText}
            />
          </View>
          <AppText variant="display" accessibilityRole="header">
            {doc.title}
          </AppText>
          {dates.length ? (
            <View style={styles.dates}>
              {dates.map(d => (
                <View key={d} style={styles.datePill}>
                  <AppText variant="caption" tone="muted">
                    {d}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </FadeIn>
        {doc.intro ? (
          <FadeIn index={1}>
            <Card tone="flat" style={styles.intro}>
              <AppText>{doc.intro}</AppText>
            </Card>
          </FadeIn>
        ) : null}
        {doc.sections.length ? (
          <FadeIn index={2}>
            <Card style={styles.sections}>
              {doc.sections.map((section, i) => (
                <View
                  key={`${section.heading}-${i}`}
                  style={[styles.section, i > 0 && styles.sectionDivider]}
                >
                  {section.heading ? (
                    <View style={styles.sectionHead}>
                      <View style={styles.sectionNumber}>
                        <AppText variant="caption" style={styles.numberText}>
                          {String(i + 1)}
                        </AppText>
                      </View>
                      <AppText
                        variant="heading"
                        accessibilityRole="header"
                        style={styles.flex}
                      >
                        {section.heading}
                      </AppText>
                    </View>
                  ) : null}
                  <AppText style={styles.body}>{section.body}</AppText>
                </View>
              ))}
            </Card>
          </FadeIn>
        ) : null}
      </View>
    </Screen>
  );
}

export const PrivacyPolicyScreen = () => (
  <LegalScreen contentKey="privacyPolicy" />
);
export const TermsConditionsScreen = () => (
  <LegalScreen contentKey="termsConditions" />
);

const createStyles = (t: Theme) =>
  StyleSheet.create({
    column: { maxWidth: 760, width: '100%', alignSelf: 'center' },
    flex: { flex: 1 },
    header: { gap: t.spacing(2), marginBottom: t.spacing(5) },
    iconTile: {
      width: 44,
      height: 44,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
      marginBottom: t.spacing(1),
    },
    dates: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(2) },
    datePill: {
      paddingHorizontal: t.spacing(2.5),
      paddingVertical: t.spacing(1),
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
    },
    intro: { marginBottom: t.spacing(4) },
    sections: { paddingVertical: t.spacing(1) },
    section: { paddingVertical: t.spacing(4) },
    sectionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2.5),
    },
    sectionNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    numberText: { color: t.colors.onAccent, fontFamily: FONTS.bold },
    body: { marginTop: t.spacing(2) },
  });
