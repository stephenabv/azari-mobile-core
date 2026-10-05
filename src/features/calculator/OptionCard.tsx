import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../ui/icons';
import { AppText } from '../../ui/components';
import { PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export interface OptionCardProps {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  /** Decorative icon shown in a tile at the top of the card. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Radio-style card for property class and system purpose. Size it with a wrapping cell. */
export function OptionCard({
  title,
  description,
  selected,
  onPress,
  icon,
  style,
}: OptionCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      accessibilityHint={description}
      style={[styles.card, selected && styles.selected, style]}
    >
      <View style={styles.top}>
        {icon ? (
          <View style={[styles.iconTile, selected && styles.iconTileOn]}>
            <Icon
              name={icon}
              size={22}
              color={selected ? colors.onAccent : colors.text}
            />
          </View>
        ) : null}
        <View style={[styles.check, selected && styles.checkOn]}>
          {selected ? (
            <Icon name="check" size={12} color={colors.onAccent} />
          ) : null}
        </View>
      </View>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {description}
      </AppText>
    </PressableScale>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      minHeight: 120,
      gap: t.spacing(1),
      padding: t.spacing(4),
      borderRadius: t.radius.lg,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark ? { borderColor: t.colors.border } : t.elevation),
    },
    selected: {
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accentSoft,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: t.spacing(2),
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
    },
    iconTileOn: { backgroundColor: t.colors.accent },
    check: {
      width: 20,
      height: 20,
      marginLeft: 'auto',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { borderColor: t.colors.accent, backgroundColor: t.colors.accent },
  });
