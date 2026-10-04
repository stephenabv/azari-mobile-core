import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Appliance } from '../../domain/quotation/Appliance';
import { Units } from '../../domain/units/Units';
import { AppText, Button, Card } from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
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
  const total = appliances.reduce((s, a) => s + a.usage, 0);
  return (
    <View>
      <AppText tone="muted" style={styles.hint}>
        Optional. Add your main appliances to size the system around your actual
        usage.
      </AppText>
      {appliances.map(a => (
        <Card key={a.id} style={styles.row}>
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
        </Card>
      ))}
      {appliances.length ? (
        <AppText
          variant="label"
          style={styles.total}
        >{`Total daily usage: ${Units.grouped(total)} Wh`}</AppText>
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
      gap: t.spacing(2),
      marginBottom: t.spacing(2),
      padding: t.spacing(3),
    },
    info: { flex: 1, minWidth: 200, gap: 2 },
    actions: { flexDirection: 'row' },
    total: { marginVertical: t.spacing(3) },
  });
