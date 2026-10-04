import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import type { SiteContentBundle } from '../../data/CatalogRepository';
import { AppText, Button } from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

/** Contact details, socials, legal links and the admin disclaimer from site content. */
export function Footer({ content }: { content: SiteContentBundle }) {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const footer = content.get('footer');
  const disclaimer = content.get('legalDisclaimer');
  const socials = Object.values(footer.socials).filter(
    s => s && ExternalLinks.isAllowed(s.url),
  );

  return (
    <View style={styles.footer}>
      <AppText variant="heading">Azari Solar</AppText>
      <View style={styles.links}>
        {footer.email ? (
          <Button
            label={footer.email}
            variant="ghost"
            compact
            onPress={() =>
              void ExternalLinks.open(ExternalLinks.email(footer.email))
            }
          />
        ) : null}
        {footer.phone ? (
          <Button
            label={footer.phone}
            variant="ghost"
            compact
            onPress={() =>
              void ExternalLinks.open(ExternalLinks.phone(footer.phone))
            }
          />
        ) : null}
      </View>
      {socials.length ? (
        <View style={styles.links}>
          {socials.map(s => (
            <Button
              key={s.name}
              label={s.name}
              variant="secondary"
              compact
              onPress={() => void ExternalLinks.open(s.url)}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.links}>
        <Button
          label="Privacy Policy"
          variant="ghost"
          compact
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <Button
          label="Terms and Conditions"
          variant="ghost"
          compact
          onPress={() => navigation.navigate('TermsConditions')}
        />
      </View>
      {disclaimer.enabled && disclaimer.text ? (
        <AppText variant="caption" tone="muted" style={styles.disclaimer}>
          {disclaimer.text}
        </AppText>
      ) : null}
      <AppText
        variant="caption"
        tone="muted"
      >{`© ${new Date().getFullYear()} Azari Solar. All rights reserved.`}</AppText>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
      paddingTop: t.spacing(6),
      gap: t.spacing(3),
    },
    links: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(2) },
    disclaimer: { marginTop: t.spacing(2) },
  });
