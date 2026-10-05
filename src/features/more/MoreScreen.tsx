import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import { SiteContentBundle } from '../../data/CatalogRepository';
import { useSiteContent } from '../../data/queries';
import type {
  RootStackParamList,
  TabScreenProps,
} from '../../navigation/types';
import { BrandMark, SunRays } from '../../ui/brand';
import { AppText, Card, Screen } from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { Footer } from '../shared/Footer';

type MenuRoute = Extract<
  keyof RootStackParamList,
  'ClientJourney' | 'TalkToExpert' | 'PrivacyPolicy' | 'TermsConditions'
>;
type TileTone = 'accent' | 'sun' | 'night' | 'muted';

interface MenuItem {
  key: string;
  label: string;
  description: string;
  icon: IconName;
  tone: TileTone;
  /** In-app destination, or an external URL opened in the browser. */
  target: { route: MenuRoute } | { url: string };
}

interface MenuGroup {
  title: string;
  items: readonly MenuItem[];
}

/** Menu entries are data; a new destination is one row. */
const MENU: readonly MenuGroup[] = [
  {
    title: 'Get started',
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
    title: 'Legal',
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
    title: 'Website',
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

function MenuRow({
  item,
  last,
  onPress,
}: {
  item: MenuItem;
  last: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const external = 'url' in item.target;
  const tile = {
    accent: { bg: theme.colors.accentSoft, fg: theme.colors.accentText },
    sun: { bg: theme.colors.sun, fg: '#15161A' },
    night: { bg: theme.colors.night, fg: theme.colors.onNight },
    muted: { bg: theme.colors.surface, fg: theme.colors.text },
  }[item.tone];

  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.98}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={item.label}
      accessibilityHint={item.description}
      style={[styles.row, !last && styles.rowDivider]}
    >
      <View style={[styles.tile, { backgroundColor: tile.bg }]}>
        <Icon name={item.icon} size={18} color={tile.fg} strokeWidth={2} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="label" style={styles.rowLabel}>
          {item.label}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {item.description}
        </AppText>
      </View>
      <Icon
        name={external ? 'external' : 'chevronRight'}
        size={16}
        color={theme.colors.textMuted}
        strokeWidth={2.2}
      />
    </PressableScale>
  );
}

export function MoreScreen({ navigation }: TabScreenProps<'More'>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  const { config } = useServices();
  const content = useSiteContent().data ?? SiteContentBundle.empty();

  const open = (target: MenuItem['target']) =>
    'url' in target
      ? void ExternalLinks.open(target.url)
      : navigation.navigate(target.route);

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

        {MENU.map((group, g) => (
          <FadeIn key={group.title} index={g + 2} style={styles.group}>
            <AppText variant="caption" tone="muted" style={styles.groupTitle}>
              {group.title.toUpperCase()}
            </AppText>
            <Card style={styles.groupCard}>
              {group.items.map((item, i) => (
                <MenuRow
                  key={item.key}
                  item={item}
                  last={i === group.items.length - 1}
                  onPress={() => open(item.target)}
                />
              ))}
            </Card>
          </FadeIn>
        ))}

        <Footer content={content} />
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
    group: { marginBottom: t.spacing(6) },
    groupTitle: {
      letterSpacing: 1,
      marginBottom: t.spacing(2),
      marginLeft: t.spacing(1),
    },
    groupCard: { paddingVertical: 0, paddingHorizontal: t.spacing(3.5) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      minHeight: 64,
      paddingVertical: t.spacing(3),
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    tile: {
      width: 38,
      height: 38,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1, gap: 1 },
    rowLabel: { fontSize: 14 },
  });
