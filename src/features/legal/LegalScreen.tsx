import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSiteContent } from '../../data/queries';
import { AppText, ErrorView, LoadingView, Screen } from '../../ui/components';

export type LegalContentKey = 'privacyPolicy' | 'termsConditions';

/** Privacy policy or terms, edited by the admin and served as site content. */
export function LegalScreen({ contentKey }: { contentKey: LegalContentKey }) {
  const query = useSiteContent();
  if (query.isPending) return <LoadingView />;
  if (!query.data)
    return (
      <ErrorView error={query.error} onRetry={() => void query.refetch()} />
    );
  const doc = query.data.get(contentKey);

  return (
    <Screen testID={`legal-${contentKey}`}>
      <View style={styles.column}>
        <AppText variant="display" accessibilityRole="header">
          {doc.title}
        </AppText>
        {doc.effectiveDate ? (
          <AppText
            variant="caption"
            tone="muted"
            style={styles.meta}
          >{`Effective date: ${doc.effectiveDate}`}</AppText>
        ) : null}
        {doc.lastUpdated ? (
          <AppText
            variant="caption"
            tone="muted"
          >{`Last updated: ${doc.lastUpdated}`}</AppText>
        ) : null}
        {doc.intro ? <AppText style={styles.intro}>{doc.intro}</AppText> : null}
        {doc.sections.map((section, i) => (
          <View key={`${section.heading}-${i}`} style={styles.section}>
            {section.heading ? (
              <AppText variant="heading" accessibilityRole="header">
                {section.heading}
              </AppText>
            ) : null}
            <AppText style={styles.body}>{section.body}</AppText>
          </View>
        ))}
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

const styles = StyleSheet.create({
  column: { maxWidth: 760, width: '100%', alignSelf: 'center' },
  meta: { marginTop: 8 },
  intro: { marginTop: 16 },
  section: { marginTop: 24 },
  body: { marginTop: 8 },
});
