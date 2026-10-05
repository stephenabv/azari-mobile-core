import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Appliance } from '../../domain/quotation/Appliance';
import { Units } from '../../domain/units/Units';
import { AppText, Button } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export interface LoadProfileProps {
  appliances: readonly Appliance[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

/** Appliance list with day / night split and totals. */
export function LoadProfile({
  appliances,
  onAdd,
  onEdit,
  onRemove,
}: LoadProfileProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const total = appliances.reduce((s, a) => s + a.usage, 0);
  return (
    <View>
      <AppText tone="muted" style={styles.hint}>
        Optional. Add your main appliances to size the system around your actual
        usage.
      </AppText>
      {appliances.map((a, i) => (
        <FadeIn key={a.id} index={i} direction="left" style={styles.row}>
          <View style={styles.iconTile}>
            <Icon name="bolt" size={18} color={colors.accentText} />
          </View>
          <View style={styles.info}>
            <AppText variant="label">{`${a.name} × ${a.quantity}`}</AppText>
            <AppText variant="caption" tone="muted">
              {`${Units.grouped(a.watts)} W · ${a.hours} h/day · ${a.schedule}`}
            </AppText>
            <AppText variant="caption" tone="muted">
              {`${Units.grouped(a.usage)} Wh/day (day ${Units.grouped(
                a.dayUsage,
              )} · night ${Units.grouped(a.nightUsage)})`}
            </AppText>
          </View>
          <View style={styles.actions}>
            <Button
              label="Edit"
              variant="ghost"
              compact
              onPress={() => onEdit(a.id)}
            />
            <Button
              label="Remove"
              variant="ghost"
              compact
              onPress={() => onRemove(a.id)}
            />
          </View>
        </FadeIn>
      ))}
      {appliances.length ? (
        <View style={styles.total}>
          <Icon name="sun" size={16} color={colors.accentText} />
          <AppText variant="label">{`Total daily usage: ${Units.grouped(
            total,
          )} Wh`}</AppText>
        </View>
      ) : null}
      <Button
        label="Add appliance"
        variant="secondary"
        onPress={onAdd}
        testID="add-appliance"
      />
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    hint: { marginBottom: t.spacing(3) },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: t.spacing(3),
      marginBottom: t.spacing(2),
      padding: t.spacing(3),
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
    },
    info: { flex: 1, minWidth: 180, gap: 2 },
    actions: { flexDirection: 'row' },
    total: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: t.spacing(2),
      marginVertical: t.spacing(3),
      paddingHorizontal: t.spacing(3),
      paddingVertical: t.spacing(1.5),
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentSoft,
    },
  });
