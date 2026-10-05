import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import type { TabScreenProps } from '../../navigation/types';
import { BrandMark, SunRays } from '../../ui/brand';
import { AppText, Card, Screen } from '../../ui/components';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { MenuList, createMenuOpener, type MenuGroup } from './MenuList';

/** Menu entries are data; a new destination is one row. */
const MENU: readonly MenuGroup[] = [
  {
    label: 'Get started',
    items: [
      {
        key: 'journey',
        label: 'Client Journey',
        description: 'From consultation to energy independence',
        icon: 'route',
        tone: 'accent',
        target: { route: 'ClientJourney' },
      },
      {
        key: 'talk',
        label: 'Talk to an Expert',
        description: 'Questions, quotations and consultations',
        icon: 'chat',
        tone: 'sun',
        target: { route: 'TalkToExpert' },
      },
    ],
  },
  {
    label: 'Connect',
    items: [
      {
        key: 'connect',
        label: 'Connect with Us',
        description: 'Email, phone and social media',
        icon: 'phone',
        tone: 'accent',
        target: { route: 'ConnectWithUs' },
      },
    ],
  },
  {
    label: 'Legal',
    items: [
      {
        key: 'privacy',
        label: 'Privacy Policy',
        description: 'How we handle your information',
        icon: 'shield',
        tone: 'muted',
        target: { route: 'PrivacyPolicy' },
      },
      {
        key: 'terms',
        label: 'Terms and Conditions',
        description: 'Terms of using our services',
        icon: 'document',
        tone: 'muted',
        target: { route: 'TermsConditions' },
      },
    ],
  },
  {
    label: 'Website',
    items: [
      {
        key: 'website',
        label: 'Visit azari.solar',
        description: 'Open the website in your browser',
        icon: 'globe',
        tone: 'night',
        target: { url: 'https://azari.solar' },
      },
    ],
  },
];

export function MoreScreen({ navigation }: TabScreenProps<'More'>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  const { config } = useServices();

  return (
    <Screen padTop testID="more-screen">
      <View style={size === 'compact' ? null : styles.narrow}>
        <FadeIn>
          <AppText
            variant="display"
            accessibilityRole="header"
            style={styles.title}
          >
            More
          </AppText>
        </FadeIn>

        <FadeIn index={1} fromScale={0.97}>
          <Card tone="night" style={styles.brand}>
            <View style={styles.rays} pointerEvents="none">
              <SunRays size={150} color={theme.colors.sun} rayOpacity={0.18} />
            </View>
            <View style={styles.brandMark}>
              <BrandMark size={30} />
            </View>
            <View style={styles.rowText}>
              <AppText variant="title" tone="onNight">
                Azari Solar
              </AppText>
              <AppText
                variant="caption"
                tone="onNightMuted"
              >{`Version ${config.appVersion}`}</AppText>
            </View>
          </Card>
        </FadeIn>

        <MenuList
          groups={MENU}
          startIndex={2}
          onOpen={createMenuOpener(route => navigation.navigate(route))}
        />
      </View>
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    narrow: { width: '100%', maxWidth: 640, alignSelf: 'center' },
    title: { marginBottom: t.spacing(4) },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      marginBottom: t.spacing(6),
    },
    rays: { position: 'absolute', right: -40, top: -50 },
    brandMark: {
      width: 48,
      height: 48,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    rowText: { flex: 1, gap: 1 },
  });
