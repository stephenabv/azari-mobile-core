import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import type { SiteContentBundle } from '../../data/CatalogRepository';
import { BrandMark } from '../../ui/brand';
import { AppText, Chip } from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

interface ContactLink {
  key: string;
  label: string;
  icon: IconName;
  url: string;
}

/** Contact details, socials, legal links and the admin disclaimer from site content. */
export function Footer({ content }: { content: SiteContentBundle }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const footer = content.get('footer');
  const disclaimer = content.get('legalDisclaimer');
  const socials = Object.values(footer.socials).filter(
    s => s && ExternalLinks.isAllowed(s.url),
  );

  const contacts: ContactLink[] = [
    ...(footer.email
      ? [
          {
            key: 'email',
            label: footer.email,
            icon: 'chat' as IconName,
            url: ExternalLinks.email(footer.email),
          },
        ]
      : []),
    ...(footer.phone
      ? [
          {
            key: 'phone',
            label: footer.phone,
            icon: 'phone' as IconName,
            url: ExternalLinks.phone(footer.phone),
          },
        ]
      : []),
  ];

  const legal = [
    {
      label: 'Privacy Policy',
      open: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      label: 'Terms and Conditions',
      open: () => navigation.navigate('TermsConditions'),
    },
  ];

  return (
    <View style={styles.footer}>
      <View style={styles.brand}>
        <BrandMark size={24} />
        <AppText variant="heading">Azari Solar</AppText>
      </View>
      {contacts.length ? (
        <View style={styles.contacts}>
          {contacts.map(c => (
            <PressableScale
              key={c.key}
              onPress={() => void ExternalLinks.open(c.url)}
              accessibilityRole="link"
              accessibilityLabel={c.label}
              style={styles.contact}
            >
              <View style={styles.contactIcon}>
                <Icon name={c.icon} size={16} color={theme.colors.accentText} />
              </View>
              <AppText variant="label" numberOfLines={1} style={styles.shrink}>
                {c.label}
              </AppText>
            </PressableScale>
          ))}
        </View>
      ) : null}
      {socials.length ? (
        <View style={styles.links}>
          {socials.map(s => (
            <Chip
              key={s.name}
              label={s.name}
              icon="external"
              onPress={() => void ExternalLinks.open(s.url)}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.legal}>
        {legal.map(l => (
          <PressableScale
            key={l.label}
            onPress={l.open}
            accessibilityRole="link"
            accessibilityLabel={l.label}
            hitSlop={8}
          >
            <AppText variant="label" tone="accent">
              {l.label}
            </AppText>
          </PressableScale>
        ))}
      </View>
      {disclaimer.enabled && disclaimer.text ? (
        <AppText variant="caption" tone="muted">
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
      gap: t.spacing(4),
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(2) },
    contacts: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(2) },
    contact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2),
      paddingVertical: t.spacing(2),
      paddingLeft: t.spacing(2),
      paddingRight: t.spacing(4),
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      maxWidth: '100%',
    },
    contactIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shrink: { flexShrink: 1 },
    links: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(2) },
    legal: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(5) },
  });
