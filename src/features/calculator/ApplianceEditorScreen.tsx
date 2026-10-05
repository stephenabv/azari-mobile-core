import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AlwaysOnUsage,
  Appliance,
  EstimatedUsage,
  RATING_UNITS,
  ScheduledUsage,
  type RatingUnit,
  type TimeWindow,
  type UsagePattern,
} from '../../domain/quotation/Appliance';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  Chip,
  Notice,
  Screen,
  SegmentedControl,
  TextField,
} from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { useCalculatorDraft } from './CalculatorDraft';
import { NumberField, normalizeDecimalInput } from './NumberField';

type PatternKind = 'scheduled' | 'estimate' | 'always-on';

const PATTERNS = [
  { value: 'scheduled' as const, label: 'Schedule' },
  { value: 'estimate' as const, label: 'Estimate per day' },
  { value: 'always-on' as const, label: 'Running 24/7' },
];

let sequence = 0;
const newId = () => `appliance-${Date.now().toString(36)}-${(sequence += 1)}`;

/** "1830" → "18:30" while typing. */
const formatTimeInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
};

function kindOf(pattern: UsagePattern | undefined): PatternKind {
  if (pattern instanceof AlwaysOnUsage) return 'always-on';
  if (pattern instanceof EstimatedUsage) return 'estimate';
  return 'scheduled';
}

export function ApplianceEditorScreen({
  navigation,
  route,
}: RootScreenProps<'ApplianceEditor'>) {
  const draft = useCalculatorDraft();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const editing =
    draft.values.appliances.find(a => a.id === route.params?.applianceId) ??
    null;

  const [name, setName] = useState(editing?.name ?? '');
  const [rating, setRating] = useState(editing ? editing.watts : 0);
  const [unit, setUnit] = useState<RatingUnit>('W');
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [kind, setKind] = useState<PatternKind>(kindOf(editing?.pattern));
  const [windows, setWindows] = useState<TimeWindow[]>(() =>
    editing?.pattern.windows().length
      ? editing.pattern.windows()
      : [{ from: '08:30', to: '18:00' }],
  );
  const [dayHours, setDayHours] = useState(
    editing?.pattern instanceof EstimatedUsage ? String(editing.dayHours) : '1',
  );
  const [nightHours, setNightHours] = useState(
    editing?.pattern instanceof EstimatedUsage
      ? String(editing.nightHours)
      : '1',
  );
  const [error, setError] = useState<string | null>(null);

  const pattern = useMemo<UsagePattern>(() => {
    switch (kind) {
      case 'always-on':
        return new AlwaysOnUsage();
      case 'estimate':
        return new EstimatedUsage(
          Number(dayHours) || 0,
          Number(nightHours) || 0,
        );
      case 'scheduled':
        return new ScheduledUsage(windows);
    }
  }, [kind, dayHours, nightHours, windows]);
  const hours = pattern.hours();
  const toWatts = RATING_UNITS.find(u => u.id === unit)?.toWatts ?? 1;

  const save = () => {
    const watts = rating * toWatts;
    const problem = Appliance.validate({ name, watts, quantity, pattern });
    setError(problem);
    if (problem) return;
    draft.saveAppliance(
      new Appliance(
        editing?.id ?? newId(),
        name.trim(),
        watts,
        quantity,
        pattern,
      ),
    );
    navigation.goBack();
  };

  const setWindow = (index: number, patch: Partial<TimeWindow>) =>
    setWindows(list =>
      list.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );

  return (
    <Screen
      keyboardAware
      footer={
        <Button
          label={editing ? 'Save Changes' : 'Add Appliance'}
          onPress={save}
          testID="appliance-save"
        />
      }
      testID="appliance-editor"
    >
      <FadeIn style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="bolt" size={22} color={colors.onAccent} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="title" accessibilityRole="header">
            {editing ? 'Edit Appliance' : 'Add Appliance'}
          </AppText>
          <AppText variant="label" tone="muted">
            This helps our engineers design a system sized perfectly to wipe out
            your monthly electricity bill.
          </AppText>
        </View>
      </FadeIn>
      {error ? <Notice tone="danger" text={error} /> : null}

      <FadeIn index={1}>
        <Card style={styles.card}>
          <AppText variant="heading" style={styles.cardTitle}>
            Appliance details
          </AppText>
          <TextField
            label="Appliance / Load Name"
            placeholder="Ex. 1.5HP Inverter Aircon"
            maxLength={80}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.row}>
            <View style={styles.grow}>
              <NumberField
                label={`Rating (${
                  RATING_UNITS.find(u => u.id === unit)?.label
                })`}
                value={rating}
                onChangeValue={setRating}
              />
            </View>
            <View style={styles.grow}>
              <NumberField
                label="Quantity"
                decimals={0}
                value={quantity}
                onChangeValue={v => setQuantity(Math.floor(v))}
              />
            </View>
          </View>
          <View style={styles.chips}>
            {RATING_UNITS.map(u => (
              <Chip
                key={u.id}
                label={u.label}
                selected={unit === u.id}
                onPress={() => setUnit(u.id)}
              />
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <Card style={styles.card}>
          <AppText variant="heading" style={styles.cardTitle}>
            Usage pattern
          </AppText>
          <SegmentedControl
            options={PATTERNS}
            value={kind}
            onChange={setKind}
            accessibilityLabel="Usage pattern"
          />

          {kind === 'scheduled' ? (
            <View style={styles.block}>
              {windows.map((w, i) => (
                <View key={i} style={styles.row}>
                  <View style={styles.grow}>
                    <TextField
                      label="From"
                      placeholder="HH:MM"
                      keyboardType="number-pad"
                      maxLength={5}
                      value={w.from}
                      onChangeText={v =>
                        setWindow(i, { from: formatTimeInput(v) })
                      }
                    />
                  </View>
                  <View style={styles.grow}>
                    <TextField
                      label="To"
                      placeholder="HH:MM"
                      keyboardType="number-pad"
                      maxLength={5}
                      value={w.to}
                      onChangeText={v =>
                        setWindow(i, { to: formatTimeInput(v) })
                      }
                    />
                  </View>
                  {windows.length > 1 ? (
                    <Button
                      label="Remove"
                      variant="ghost"
                      compact
                      onPress={() =>
                        setWindows(list => list.filter((_, j) => j !== i))
                      }
                      style={styles.remove}
                    />
                  ) : null}
                </View>
              ))}
              <AppText variant="caption" tone="muted">
                Use 24-hour time, e.g. 18:30.
              </AppText>
              <Button
                label="+ Add Schedule Usage"
                variant="ghost"
                compact
                onPress={() =>
                  setWindows(list => [...list, { from: '', to: '' }])
                }
              />
            </View>
          ) : null}

          {kind === 'estimate' ? (
            <View style={styles.block}>
              <View style={styles.row}>
                <View style={styles.grow}>
                  <TextField
                    label="Day Time Usage (08:00–18:00)"
                    suffix="hrs"
                    keyboardType="decimal-pad"
                    value={dayHours}
                    onChangeText={v => setDayHours(normalizeDecimalInput(v))}
                  />
                </View>
                <View style={styles.grow}>
                  <TextField
                    label="Night Time Usage (18:00–08:00)"
                    suffix="hrs"
                    keyboardType="decimal-pad"
                    value={nightHours}
                    onChangeText={v => setNightHours(normalizeDecimalInput(v))}
                  />
                </View>
              </View>
              <View style={styles.chips}>
                <Chip
                  label="Day only (10h)"
                  onPress={() => {
                    setDayHours('10');
                    setNightHours('0');
                  }}
                />
                <Chip
                  label="Night only (14h)"
                  onPress={() => {
                    setDayHours('0');
                    setNightHours('14');
                  }}
                />
              </View>
            </View>
          ) : null}
        </Card>
      </FadeIn>

      <View
        style={styles.totals}
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Day (08:00–18:00): ${hours.day.toFixed(
          1,
        )}h · Night (18:00–08:00): ${hours.night.toFixed(
          1,
        )}h · Total: ${hours.total.toFixed(1)}h`}
      >
        {(
          [
            ['sun', 'Day', '08:00–18:00', hours.day],
            ['sparkle', 'Night', '18:00–08:00', hours.night],
            ['bolt', 'Total', 'per day', hours.total],
          ] as ReadonlyArray<[IconName, string, string, number]>
        ).map(([icon, label, range, value], i) => (
          <FadeIn key={label} index={i + 3} style={styles.totalTile}>
            <Icon name={icon} size={16} color={colors.accentText} />
            <AppText
              variant="caption"
              tone="muted"
            >{`${label} · ${range}`}</AppText>
            <AppText variant="heading">{`${value.toFixed(1)}h`}</AppText>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing(3),
      marginBottom: t.spacing(5),
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    headerText: { flex: 1, gap: t.spacing(1) },
    card: { marginBottom: t.spacing(4), padding: t.spacing(4) },
    cardTitle: { marginBottom: t.spacing(3) },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(3),
      alignItems: 'flex-start',
    },
    grow: { flexGrow: 1, flexBasis: 140 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(2) },
    block: { marginTop: t.spacing(5) },
    remove: { marginTop: 26 },
    totals: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(3) },
    totalTile: {
      flexGrow: 1,
      flexBasis: 96,
      gap: t.spacing(1),
      padding: t.spacing(3),
      borderRadius: t.radius.md,
      backgroundColor: t.colors.accentSoft,
    },
  });
