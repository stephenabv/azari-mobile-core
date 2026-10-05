import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import type { RootStackParamList } from '../../navigation/types';
import { AppText, Card } from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

/** Stack screens a menu row can open (all take no params). */
export type MenuRoute = Extract<
  keyof RootStackParamList,
  | 'ClientJourney'
  | 'TalkToExpert'
  | 'PrivacyPolicy'
  | 'TermsConditions'
  | 'ConnectWithUs'
>;
export type TileTone = 'accent' | 'sun' | 'night' | 'muted';

export type MenuTarget = { route: MenuRoute } | { url: string };

export interface MenuItem {
  key: string;
  label: string;
  description?: string;
  /** Stroke icon on a toned tile; `leading` replaces both, e.g. a logo. */
  icon?: IconName;
  tone?: TileTone;
  leading?: ReactNode;
  /** In-app destination, or an https / mailto / tel link opened outside. */
  target: MenuTarget;
}

export interface MenuGroup {
  /** Identifies the group; groups show no visible heading. */
  label: string;
  items: readonly MenuItem[];
}

export function createMenuOpener(
  navigate: (route: MenuRoute) => void,
): (target: MenuTarget) => void {
  return target =>
    'url' in target
      ? void ExternalLinks.open(target.url)
      : navigate(target.route);
}

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
  const web =
    'url' in item.target && ExternalLinks.classify(item.target.url) === 'web';
  const tile = {
    accent: { bg: theme.colors.accentSoft, fg: theme.colors.accentText },
    sun: { bg: theme.colors.sun, fg: '#0A0A0A' },
    night: { bg: theme.colors.night, fg: theme.colors.onNight },
    muted: { bg: theme.colors.surface, fg: theme.colors.text },
  }[item.tone ?? 'muted'];

  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.98}
      accessibilityRole={'url' in item.target ? 'link' : 'button'}
      accessibilityLabel={item.label}
      accessibilityHint={item.description}
      style={[styles.row, !last && styles.rowDivider]}
    >
      {item.leading ?? (
        <View style={[styles.tile, { backgroundColor: tile.bg }]}>
          <Icon
            name={item.icon ?? 'chevronRight'}
            size={18}
            color={tile.fg}
            strokeWidth={2}
          />
        </View>
      )}
      <View style={styles.rowText}>
        <AppText variant="label" numberOfLines={1} style={styles.rowLabel}>
          {item.label}
        </AppText>
        {item.description ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {item.description}
          </AppText>
        ) : null}
      </View>
      <Icon
        name={web ? 'external' : 'chevronRight'}
        size={16}
        color={theme.colors.textMuted}
        strokeWidth={2.2}
      />
    </PressableScale>
  );
}

/** Menu groups as cards of rows, separated by spacing only. */
export function MenuList({
  groups,
  onOpen,
  startIndex = 0,
}: {
  groups: readonly MenuGroup[];
  onOpen: (target: MenuTarget) => void;
  /** Stagger offset for the entrance animation. */
  startIndex?: number;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <>
      {groups
        .filter(group => group.items.length > 0)
        .map((group, g) => (
          <FadeIn key={group.label} index={g + startIndex} style={styles.group}>
            <Card style={styles.groupCard}>
              {group.items.map((item, i) => (
                <MenuRow
                  key={item.key}
                  item={item}
                  last={i === group.items.length - 1}
                  onPress={() => onOpen(item.target)}
                />
              ))}
            </Card>
          </FadeIn>
        ))}
    </>
  );
}

export const MENU_TILE_SIZE = 38;

const createStyles = (t: Theme) =>
  StyleSheet.create({
    group: { marginBottom: t.spacing(4) },
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
      width: MENU_TILE_SIZE,
      height: MENU_TILE_SIZE,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1, gap: 1 },
    rowLabel: { fontSize: 14 },
  });
