import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import { SiteContentBundle } from '../../data/CatalogRepository';
import { useSiteContent } from '../../data/queries';
import type { TabScreenProps } from '../../navigation/types';
import { AppText, Screen } from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { Footer } from '../shared/Footer';

interface MenuItem {
  label: string;
  description: string;
  route: 'ClientJourney' | 'TalkToExpert' | 'PrivacyPolicy' | 'TermsConditions';
}

/** Menu entries are data; a new destination is one row. */
const MENU: readonly MenuItem[] = [
  {
    label: 'Client Journey',
    description: 'From consultation to energy independence',
    route: 'ClientJourney',
  },
  {
    label: 'Talk to an Expert',
    description: 'Questions, quotations and consultations',
    route: 'TalkToExpert',
  },
  {
    label: 'Privacy Policy',
    description: 'How we handle your information',
    route: 'PrivacyPolicy',
  },
  {
    label: 'Terms and Conditions',
    description: 'Terms of using our services',
    route: 'TermsConditions',
  },
];

export function MoreScreen({ navigation }: TabScreenProps<'More'>) {
  const styles = useThemedStyles(createStyles);
  const { config } = useServices();
  const content = useSiteContent().data ?? SiteContentBundle.empty();

  return (
    <Screen padTop testID="more-screen">
      <AppText
        variant="display"
        accessibilityRole="header"
        style={styles.title}
      >
        More
      </AppText>
      <View style={styles.list}>
        {MENU.map(item => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            accessibilityRole="button"
            accessibilityHint={item.description}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={styles.itemText}>
              <AppText variant="heading">{item.label}</AppText>
              <AppText variant="caption" tone="muted">
                {item.description}
              </AppText>
            </View>
            <AppText tone="muted">›</AppText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => void ExternalLinks.open('https://azari.solar')}
          accessibilityRole="link"
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={styles.itemText}>
            <AppText variant="heading">Visit azari.solar</AppText>
            <AppText variant="caption" tone="muted">
              Open the website in your browser
            </AppText>
          </View>
          <AppText tone="muted">↗</AppText>
        </Pressable>
      </View>
      <Footer content={content} />
      <AppText
        variant="caption"
        tone="muted"
        style={styles.version}
      >{`Version ${config.appVersion}`}</AppText>
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    title: { marginBottom: t.spacing(4) },
    list: {
      marginBottom: t.spacing(8),
      borderRadius: t.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      minHeight: 64,
      paddingHorizontal: t.spacing(4),
      paddingVertical: t.spacing(3),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    pressed: { backgroundColor: t.colors.surface },
    itemText: { flex: 1, gap: 2 },
    version: { marginTop: t.spacing(4) },
  });
