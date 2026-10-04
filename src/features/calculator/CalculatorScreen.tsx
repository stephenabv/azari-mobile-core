import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SIZING_STRATEGIES,
  type PropertyClass,
} from '../../domain/calculation/SizingStrategy';
import type { EngineResult } from '../../domain/calculation/SolarMath';
import type { TabScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  Notice,
  Screen,
  SegmentedControl,
} from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BillUpload } from './BillUpload';
import { useCalculatorDraft, type CalculatorDraft } from './CalculatorDraft';
import { LoadProfile } from './LoadProfile';
import { NumberField } from './NumberField';
import { OptionCard } from './OptionCard';
import { StepLabel } from './StepLabel';

const PROPERTY_TYPES: ReadonlyArray<{
  title: PropertyClass;
  description: string;
}> = [
  {
    title: 'Residential',
    description:
      'Standard detached housing or townhouses. Optimized for rooftop efficiency.',
  },
  {
    title: 'Commercial',
    description:
      'Office buildings, retail spaces, and warehouses. Higher load capacity sizing.',
  },
  {
    title: 'Industrial',
    description:
      'Manufacturing plants and large facilities. High-voltage integration focused.',
  },
];

const BILL_OPTIONS = [
  { value: 'yes' as const, label: 'I have a bill' },
  { value: 'no' as const, label: 'No bill yet' },
];

const SYSTEM_TYPES = [
  { value: 'hybrid' as const, label: 'Hybrid' },
  { value: 'grid-tied' as const, label: 'Grid-Tied' },
];

export function CalculatorScreen({
  navigation,
  route,
}: TabScreenProps<'Calculator'>) {
  const styles = useThemedStyles(createStyles);
  const draft = useCalculatorDraft();
  const { size } = useResponsive();
  const [formError, setFormError] = useState<string | null>(null);
  const { values, update, applySeed } = draft;
  const seed = route.params;

  useEffect(() => {
    if (!seed) return;
    applySeed(seed);
    navigation.setParams({
      monthlyBill: undefined,
      electricRate: undefined,
      estimatedMonthlySavings: undefined,
    });
  }, [seed, applySeed, navigation]);

  const requestProposal = () => {
    const error = draft.readinessError();
    setFormError(error);
    if (!error) navigation.navigate('ProposalRequest');
  };

  const wide = size === 'expanded';
  const summary = (
    <SummaryCard result={draft.result} onRequest={requestProposal} />
  );

  return (
    <Screen
      padTop
      keyboardAware
      footer={
        wide ? null : (
          <CompactFooter result={draft.result} onRequest={requestProposal} />
        )
      }
      testID="calculator-screen"
    >
      <AppText variant="display" accessibilityRole="header">
        Solar Power System Calculator
      </AppText>
      <AppText tone="muted" style={styles.sub}>
        Configure your institutional-grade solar system.
      </AppText>
      <SegmentedControl
        options={BILL_OPTIONS}
        value={values.hasBill ? 'yes' : 'no'}
        onChange={v => {
          update({ hasBill: v === 'yes' });
          setFormError(null);
        }}
        accessibilityLabel="Do you have an electricity bill"
      />

      <View style={wide ? styles.columns : null}>
        <View style={wide ? styles.main : null}>
          <StepLabel index={1} title="Property Classification" />
          <View style={styles.options}>
            {PROPERTY_TYPES.map(p => (
              <OptionCard
                key={p.title}
                title={p.title}
                description={p.description}
                selected={values.property === p.title}
                onPress={() => draft.setProperty(p.title)}
              />
            ))}
          </View>

          <StepLabel index={2} title="System Purpose" />
          <View style={styles.options}>
            {SIZING_STRATEGIES.filter(s =>
              s.isAvailableFor(values.property),
            ).map(s => (
              <OptionCard
                key={s.purpose}
                title={s.label}
                description={s.description}
                selected={values.purpose === s.purpose}
                onPress={() => {
                  update({ purpose: s.purpose });
                  setFormError(null);
                }}
              />
            ))}
          </View>

          <PurposeFields
            draft={draft}
            onEditAppliance={id =>
              navigation.navigate(
                'ApplianceEditor',
                id ? { applianceId: id } : undefined,
              )
            }
          />

          {formError ? <Notice tone="danger" text={formError} /> : null}
        </View>
        {wide ? <View style={styles.aside}>{summary}</View> : null}
      </View>
      {wide ? null : <View style={styles.inlineSummary}>{summary}</View>}
    </Screen>
  );
}

/** Fields of the selected purpose; numbering continues from the shared steps. */
function PurposeFields({
  draft,
  onEditAppliance,
}: {
  draft: CalculatorDraft;
  onEditAppliance: (id?: string) => void;
}) {
  const { values, update, removeAppliance } = draft;
  const loadProfile = (index: number) => (
    <>
      <StepLabel index={index} title="Load Profile" />
      <LoadProfile
        appliances={values.appliances}
        onAdd={() => onEditAppliance()}
        onEdit={id => onEditAppliance(id)}
        onRemove={removeAppliance}
      />
    </>
  );

  switch (values.purpose) {
    case 'monthly-savings':
      return (
        <>
          <StepLabel index={3} title="System Type" />
          <SegmentedControl
            options={SYSTEM_TYPES}
            value={values.systemType}
            onChange={systemType => update({ systemType })}
            accessibilityLabel="System type"
          />
          <StepLabel index={4} title="Monthly Savings Target" />
          <NumberField
            label="Target Monthly Savings"
            prefix="₱"
            decimals={0}
            value={values.savingsTarget}
            onChangeValue={savingsTarget => update({ savingsTarget })}
            helper="The amount you want to reduce from your monthly bill."
          />
          <StepLabel index={5} title="Electricity Rate" />
          <NumberField
            label="Electricity Rate"
            prefix="₱"
            suffix="/ kWh"
            value={values.savingsRate}
            onChangeValue={savingsRate => update({ savingsRate })}
          />
          {loadProfile(6)}
        </>
      );
    case 'peak-shaving':
      return (
        <>
          <StepLabel index={3} title="Peak Shaving Parameters" />
          <NumberField
            label="Peak Power Demand"
            suffix="kW"
            value={values.peakPowerKw}
            onChangeValue={peakPowerKw => update({ peakPowerKw })}
            helper="Your facility's maximum power demand during peak hours."
          />
          <NumberField
            label="Allowed Grid Power"
            suffix="kW"
            value={values.allowedGridPowerKw}
            onChangeValue={allowedGridPowerKw => update({ allowedGridPowerKw })}
            helper="Maximum grid draw allowed. Battery covers the rest."
          />
          <NumberField
            label="Peak Duration"
            suffix="hrs"
            max={24}
            value={values.peakDurationHours}
            onChangeValue={peakDurationHours => update({ peakDurationHours })}
            helper="Decimals count as minutes (e.g. 1.5 = 1h 30m). Max 24 hrs."
          />
        </>
      );
    case 'zero-bill':
      return (
        <>
          {values.hasBill ? (
            <>
              <StepLabel index={3} title="Consumption Data" />
              <BillUpload
                file={values.bill}
                onChange={bill => update({ bill })}
              />
              <NumberField
                label="Average Monthly Bill"
                prefix="₱"
                decimals={0}
                value={values.monthlyBill}
                onChangeValue={monthlyBill => update({ monthlyBill })}
                helper="Based on your recent electricity bill."
              />
              <StepLabel index={4} title="Typical Electricity Rate" />
              <NumberField
                label="Electricity Rate"
                prefix="₱"
                suffix="/ kWh"
                value={values.billRate}
                onChangeValue={billRate => update({ billRate })}
              />
            </>
          ) : null}
          {loadProfile(values.hasBill ? 5 : 3)}
        </>
      );
  }
}

const formatResult = (result: EngineResult | null) => ({
  inverter: result
    ? `${result.inverterKw}kW ${
        result.systemType === 'grid-tied' ? 'Grid-Tie' : 'Hybrid'
      }`
    : '—',
  solar: result ? `~${result.solarKwp.toFixed(1)} kWp` : '—',
  storage: result
    ? result.storageKwh > 0
      ? `${result.storageKwh} kWh`
      : 'No Battery'
    : '—',
});

function SummaryCard({
  result,
  onRequest,
}: {
  result: EngineResult | null;
  onRequest: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const r = formatResult(result);
  return (
    <Card
      style={styles.summary}
      accessibilityLabel="Recommended system specifications"
    >
      <AppText variant="heading">Recommended System Specifications</AppText>
      {(
        [
          ['Inverter Capacity and Types', r.inverter],
          ['Solar Panel Capacity', r.solar],
          ['Storage Capacity', r.storage],
        ] as const
      ).map(([label, value]) => (
        <View key={label}>
          <AppText variant="caption" tone="muted">
            {label}
          </AppText>
          <AppText variant="title">{value}</AppText>
        </View>
      ))}
      <Button
        label="Request Proposal"
        onPress={onRequest}
        testID="request-proposal"
      />
    </Card>
  );
}

function CompactFooter({
  result,
  onRequest,
}: {
  result: EngineResult | null;
  onRequest: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const r = formatResult(result);
  return (
    <View style={styles.footer}>
      <View style={styles.footerText}>
        <AppText variant="label" numberOfLines={1}>
          {r.solar}
        </AppText>
        <AppText
          variant="caption"
          tone="muted"
          numberOfLines={1}
        >{`${r.inverter} · ${r.storage}`}</AppText>
      </View>
      <Button label="Request Proposal" onPress={onRequest} />
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    sub: { marginTop: t.spacing(2), marginBottom: t.spacing(4) },
    columns: {
      flexDirection: 'row',
      gap: t.spacing(8),
      alignItems: 'flex-start',
    },
    main: { flex: 1 },
    aside: { width: 340, marginTop: t.spacing(7) },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(3) },
    inlineSummary: { marginTop: t.spacing(8) },
    summary: { gap: t.spacing(3), padding: t.spacing(5) },
    footer: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(3) },
    footerText: { flex: 1 },
  });
