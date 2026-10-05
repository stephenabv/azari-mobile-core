import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SIZING_STRATEGIES,
  type PropertyClass,
  type SystemPurpose,
} from '../../domain/calculation/SizingStrategy';
import type { EngineResult } from '../../domain/calculation/SolarMath';
import { Units } from '../../domain/units/Units';
import type { TabScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Notice,
  Screen,
  SegmentedControl,
  Slider,
} from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BillUpload } from './BillUpload';
import { useCalculatorDraft, type CalculatorDraft } from './CalculatorDraft';
import { LoadProfile } from './LoadProfile';
import { NumberField } from './NumberField';
import { OptionCard } from './OptionCard';
import { StepLabel } from './StepLabel';
import { SystemResult, formatResult } from './SystemResult';
import { WizardProgress } from './WizardProgress';

const PROPERTY_TYPES: ReadonlyArray<{
  title: PropertyClass;
  description: string;
  icon: IconName;
}> = [
  {
    title: 'Residential',
    description:
      'Standard detached housing or townhouses. Optimized for rooftop efficiency.',
    icon: 'home',
  },
  {
    title: 'Commercial',
    description:
      'Office buildings, retail spaces, and warehouses. Higher load capacity sizing.',
    icon: 'shop',
  },
  {
    title: 'Industrial',
    description:
      'Manufacturing plants and large facilities. High-voltage integration focused.',
    icon: 'factory',
  },
];

const PURPOSE_ICONS: Record<SystemPurpose, IconName> = {
  'monthly-savings': 'leaf',
  'peak-shaving': 'bolt',
  'zero-bill': 'battery',
};

const BILL_OPTIONS = [
  { value: 'yes' as const, label: 'I have a bill' },
  { value: 'no' as const, label: 'No bill yet' },
];

const SYSTEM_TYPES = [
  { value: 'hybrid' as const, label: 'Hybrid' },
  { value: 'grid-tied' as const, label: 'Grid-Tied' },
];

/** Range of the monthly bill slider; the number field still takes any amount. */
const BILL_SLIDER = { min: 1000, max: 50000, step: 500 } as const;

/** The wizard: the original numbered sections, grouped into three steps. */
const STEPS = [
  {
    name: 'Property',
    title: 'What kind of property?',
    subtitle: 'Pick your property and what the system should do.',
    next: 'Continue',
  },
  {
    name: 'Usage',
    title: 'Your energy use',
    subtitle: 'Tell us about your bill and loads so we can size the system.',
    next: 'See my system',
  },
  {
    name: 'System',
    title: 'Your recommended system',
    subtitle: 'Sized from your inputs. Request a proposal to make it yours.',
    next: null,
  },
] as const;

const LAST_STEP = STEPS.length - 1;

export function CalculatorScreen({
  navigation,
  route,
}: TabScreenProps<'Calculator'>) {
  const styles = useThemedStyles(createStyles);
  const draft = useCalculatorDraft();
  const { size } = useResponsive();
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const { values, applySeed } = draft;
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

  const goTo = (next: number) => {
    setFormError(null);
    setStep(next);
  };

  const goNext = () => {
    // Same readiness check the proposal request runs, surfaced before the result.
    if (step === LAST_STEP - 1) {
      const error = draft.readinessError();
      setFormError(error);
      if (error) return;
      setStep(LAST_STEP);
      return;
    }
    goTo(Math.min(LAST_STEP, step + 1));
  };

  const requestProposal = () => {
    const error = draft.readinessError();
    setFormError(error);
    if (!error) navigation.navigate('ProposalRequest');
  };

  const wide = size === 'expanded';
  const current = STEPS[step] ?? STEPS[0];
  const onResult = step === LAST_STEP;

  const stepBody = [
    <PropertyStep
      key="property"
      draft={draft}
      onChange={() => setFormError(null)}
    />,
    <UsageStep
      key="usage"
      draft={draft}
      onChange={() => setFormError(null)}
      onEditAppliance={id =>
        navigation.navigate(
          'ApplianceEditor',
          id ? { applianceId: id } : undefined,
        )
      }
    />,
    <SystemResult
      key="system"
      result={draft.result}
      property={values.property}
      purpose={draft.strategy.label}
      columns={wide ? 4 : 2}
    />,
  ][step];

  return (
    <Screen
      padTop
      keyboardAware
      footer={
        <WizardFooter
          step={step}
          result={draft.result}
          livePreview={!wide && !onResult}
          onBack={() => goTo(Math.max(0, step - 1))}
          onNext={goNext}
          onRequest={requestProposal}
        />
      }
      testID="calculator-screen"
    >
      <AppText variant="display" accessibilityRole="header">
        Solar Power System Calculator
      </AppText>
      <AppText tone="muted" style={styles.sub}>
        Configure your institutional-grade solar system.
      </AppText>
      <WizardProgress
        steps={STEPS.map(s => s.name)}
        current={step}
        onSelect={goTo}
      />

      <View style={wide && !onResult ? styles.columns : null}>
        <FadeIn
          key={step}
          direction="left"
          distance={24}
          style={wide && !onResult ? styles.main : null}
        >
          <AppText
            variant="title"
            accessibilityRole="header"
            style={styles.stepTitle}
          >
            {current.title}
          </AppText>
          <AppText variant="label" tone="muted" style={styles.stepSub}>
            {current.subtitle}
          </AppText>
          {stepBody}
          {formError ? (
            <View style={styles.notice}>
              <Notice tone="danger" text={formError} />
            </View>
          ) : null}
        </FadeIn>
        {wide && !onResult ? (
          <View style={styles.aside}>
            <AppText variant="label" tone="muted" style={styles.asideLabel}>
              Live estimate
            </AppText>
            <SystemResult
              result={draft.result}
              property={values.property}
              purpose={draft.strategy.label}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/** Step 1: property class and system purpose (sections 01 and 02). */
function PropertyStep({
  draft,
  onChange,
}: {
  draft: CalculatorDraft;
  onChange: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { values, update } = draft;
  return (
    <>
      <StepLabel index={1} title="Property Classification" />
      <View style={styles.options}>
        {PROPERTY_TYPES.map((p, i) => (
          <FadeIn key={p.title} index={i} style={styles.propertyCell}>
            <OptionCard
              title={p.title}
              description={p.description}
              icon={p.icon}
              selected={values.property === p.title}
              onPress={() => draft.setProperty(p.title)}
            />
          </FadeIn>
        ))}
      </View>

      <StepLabel index={2} title="System Purpose" />
      <View style={styles.options}>
        {SIZING_STRATEGIES.filter(s => s.isAvailableFor(values.property)).map(
          (s, i) => (
            <FadeIn key={s.purpose} index={i} style={styles.purposeCell}>
              <OptionCard
                title={s.label}
                description={s.description}
                icon={PURPOSE_ICONS[s.purpose]}
                selected={values.purpose === s.purpose}
                onPress={() => {
                  update({ purpose: s.purpose });
                  onChange();
                }}
              />
            </FadeIn>
          ),
        )}
      </View>
    </>
  );
}

/** Step 2: bill question plus the selected purpose's fields (sections 03+). */
function UsageStep({
  draft,
  onChange,
  onEditAppliance,
}: {
  draft: CalculatorDraft;
  onChange: () => void;
  onEditAppliance: (id?: string) => void;
}) {
  const { values, update } = draft;
  return (
    <>
      <SegmentedControl
        options={BILL_OPTIONS}
        value={values.hasBill ? 'yes' : 'no'}
        onChange={v => {
          update({ hasBill: v === 'yes' });
          onChange();
        }}
        accessibilityLabel="Do you have an electricity bill"
      />
      <PurposeFields draft={draft} onEditAppliance={onEditAppliance} />
    </>
  );
}

/** Big peso readout with a slider, kept in sync with the exact number field. */
function BillSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.billCard}>
      <AppText variant="caption" tone="muted" align="center">
        Average Monthly Bill
      </AppText>
      <AppText style={styles.billValue} align="center">
        {Units.peso(value, 0)}
      </AppText>
      <Slider
        value={Math.min(BILL_SLIDER.max, Math.max(BILL_SLIDER.min, value))}
        min={BILL_SLIDER.min}
        max={BILL_SLIDER.max}
        step={BILL_SLIDER.step}
        onChange={onChange}
        accessibilityLabel="Monthly bill"
        formatValue={v => Units.peso(v, 0)}
        testID="bill-slider"
      />
      <View style={styles.billRange}>
        <AppText variant="caption" tone="muted">
          {Units.peso(BILL_SLIDER.min, 0)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {Units.peso(BILL_SLIDER.max, 0)}
        </AppText>
      </View>
    </View>
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
              <BillSlider
                value={values.monthlyBill}
                onChange={monthlyBill => update({ monthlyBill })}
              />
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

/** Pinned bar: live estimate (phones), Back, and Continue / Request Proposal. */
function WizardFooter({
  step,
  result,
  livePreview,
  onBack,
  onNext,
  onRequest,
}: {
  step: number;
  result: EngineResult | null;
  livePreview: boolean;
  onBack: () => void;
  onNext: () => void;
  onRequest: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const r = formatResult(result);
  const next = (STEPS[step] ?? STEPS[0]).next;
  return (
    <View style={styles.footer}>
      {livePreview ? (
        <View
          style={styles.preview}
          accessible
          accessibilityLabel={`Live estimate: ${r.solar}, ${r.inverter}, ${r.storage}`}
        >
          <View style={styles.previewIcon}>
            <Icon name="sun" size={16} color={colors.onAccent} />
          </View>
          <View style={styles.previewText}>
            <AppText variant="label" numberOfLines={1}>
              {r.solar}
            </AppText>
            <AppText
              variant="caption"
              tone="muted"
              numberOfLines={1}
            >{`${r.inverter} · ${r.storage}`}</AppText>
          </View>
        </View>
      ) : null}
      <View style={styles.navRow}>
        {step > 0 ? (
          <View style={styles.backCell}>
            <Button label="Back" variant="secondary" onPress={onBack} />
          </View>
        ) : null}
        <View style={styles.nextCell}>
          {next ? (
            <Button
              label={next}
              variant="night"
              icon="arrowRight"
              onPress={onNext}
              testID="calculator-next"
            />
          ) : (
            <Button
              label="Request Proposal"
              icon="arrowRight"
              onPress={onRequest}
              testID="request-proposal"
            />
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    sub: { marginTop: t.spacing(1) },
    stepTitle: { marginTop: t.spacing(6) },
    stepSub: { marginTop: t.spacing(1), marginBottom: t.spacing(2) },
    columns: {
      flexDirection: 'row',
      gap: t.spacing(8),
      alignItems: 'flex-start',
    },
    main: { flex: 1 },
    aside: { width: 340, marginTop: t.spacing(6) },
    asideLabel: { marginBottom: t.spacing(2) },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(3) },
    propertyCell: { flexGrow: 1, flexBasis: 150 },
    purposeCell: { flexGrow: 1, flexBasis: 220 },
    notice: { marginTop: t.spacing(4) },
    billCard: {
      padding: t.spacing(5),
      paddingBottom: t.spacing(3),
      marginBottom: t.spacing(3),
      borderRadius: t.radius.xl,
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    billValue: {
      ...t.type.display,
      color: t.colors.text,
      marginTop: t.spacing(1),
      marginBottom: t.spacing(2),
    },
    billRange: { flexDirection: 'row', justifyContent: 'space-between' },
    footer: { gap: t.spacing(3) },
    preview: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(3) },
    previewIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    previewText: { flex: 1 },
    navRow: { flexDirection: 'row', gap: t.spacing(3) },
    backCell: { flex: 1 },
    nextCell: { flex: 2 },
  });
