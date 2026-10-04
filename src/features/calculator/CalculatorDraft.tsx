import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { UploadFile } from '../../core/http/RequestBody';
import {
  strategyFor,
  type PropertyClass,
  type SizingInput,
  type SizingStrategy,
  type SystemPurpose,
} from '../../domain/calculation/SizingStrategy';
import { ELECTRIC_RATE_CONFIG } from '../../domain/calculation/SolarConstants';
import {
  SolarMath,
  type EngineResult,
  type SystemType,
} from '../../domain/calculation/SolarMath';
import type { Appliance } from '../../domain/quotation/Appliance';
import type { CalculatorSeed } from '../../navigation/types';

/** Raw calculator inputs; everything else is derived. */
export interface DraftValues {
  property: PropertyClass;
  purpose: SystemPurpose;
  systemType: SystemType;
  hasBill: boolean;
  savingsTarget: number;
  savingsRate: number;
  monthlyBill: number;
  billRate: number;
  peakPowerKw: number;
  allowedGridPowerKw: number;
  peakDurationHours: number;
  appliances: Appliance[];
  bill: UploadFile | null;
}

const INITIAL: DraftValues = {
  property: 'Residential',
  purpose: 'monthly-savings',
  systemType: 'hybrid',
  hasBill: true,
  savingsTarget: 0,
  savingsRate: ELECTRIC_RATE_CONFIG.min,
  monthlyBill: 5000,
  billRate: ELECTRIC_RATE_CONFIG.defaultValue,
  peakPowerKw: 0,
  allowedGridPowerKw: 0,
  peakDurationHours: 0,
  appliances: [],
  bill: null,
};

export interface CalculatorDraft {
  values: DraftValues;
  strategy: SizingStrategy;
  input: SizingInput;
  result: EngineResult | null;
  /** The bill is only sent while its section is shown (zero bill, with a bill). */
  billApplies: boolean;
  update: (patch: Partial<DraftValues>) => void;
  setProperty: (property: PropertyClass) => void;
  saveAppliance: (appliance: Appliance) => void;
  removeAppliance: (id: string) => void;
  applySeed: (seed: CalculatorSeed) => void;
  /** First reason the proposal cannot be requested yet, or null. */
  readinessError: () => string | null;
  reset: () => void;
}

const DraftContext = createContext<CalculatorDraft | null>(null);

/**
 * Calculator state shared by the calculator tab and its modal editors
 * (appliance editor, proposal form), so each screen stays small.
 */
export function CalculatorDraftProvider({ children }: PropsWithChildren) {
  const [values, setValues] = useState<DraftValues>(INITIAL);

  const update = useCallback(
    (patch: Partial<DraftValues>) => setValues(v => ({ ...v, ...patch })),
    [],
  );

  const setProperty = useCallback(
    (property: PropertyClass) =>
      setValues(v => ({
        ...v,
        property,
        // Zero bill is residential only, as on the website.
        purpose: strategyFor(v.purpose).isAvailableFor(property)
          ? v.purpose
          : 'monthly-savings',
      })),
    [],
  );

  const saveAppliance = useCallback(
    (appliance: Appliance) =>
      setValues(v => {
        const exists = v.appliances.some(a => a.id === appliance.id);
        return {
          ...v,
          appliances: exists
            ? v.appliances.map(a => (a.id === appliance.id ? appliance : a))
            : [...v.appliances, appliance],
        };
      }),
    [],
  );

  const removeAppliance = useCallback(
    (id: string) =>
      setValues(v => ({
        ...v,
        appliances: v.appliances.filter(a => a.id !== id),
      })),
    [],
  );

  const applySeed = useCallback(
    (seed: CalculatorSeed) =>
      setValues(v => ({
        ...v,
        savingsTarget: seed.estimatedMonthlySavings ?? v.savingsTarget,
        savingsRate: seed.electricRate ?? v.savingsRate,
        monthlyBill: seed.monthlyBill ?? v.monthlyBill,
        billRate: seed.electricRate ?? v.billRate,
      })),
    [],
  );

  const reset = useCallback(
    () =>
      setValues(v => ({
        ...INITIAL,
        property: v.property,
        purpose: v.purpose,
        systemType: v.systemType,
        hasBill: v.hasBill,
      })),
    [],
  );

  const derived = useMemo(() => {
    const strategy = strategyFor(values.purpose);
    const isZeroBill = values.purpose === 'zero-bill';
    const input: SizingInput = {
      property: values.property,
      systemType: values.systemType,
      hasBill: values.hasBill,
      savingsTarget: values.savingsTarget,
      electricRate: isZeroBill ? values.billRate : values.savingsRate,
      monthlyBill: values.monthlyBill,
      peakPowerKw: values.peakPowerKw,
      allowedGridPowerKw: values.allowedGridPowerKw,
      peakDurationHours: values.peakDurationHours,
      applianceCount: values.appliances.length,
      load: SolarMath.loadMetrics(values.appliances),
    };
    return {
      strategy,
      input,
      result: strategy.compute(input),
      billApplies: isZeroBill && values.hasBill,
    };
  }, [values]);

  const readinessError = useCallback(
    () =>
      derived.strategy.validate(derived.input) ??
      (derived.result
        ? null
        : 'Unable to compute system size. Please check your inputs.'),
    [derived],
  );

  const draft = useMemo<CalculatorDraft>(
    () => ({
      values,
      ...derived,
      update,
      setProperty,
      saveAppliance,
      removeAppliance,
      applySeed,
      readinessError,
      reset,
    }),
    [
      values,
      derived,
      update,
      setProperty,
      saveAppliance,
      removeAppliance,
      applySeed,
      readinessError,
      reset,
    ],
  );

  return (
    <DraftContext.Provider value={draft}>{children}</DraftContext.Provider>
  );
}

export function useCalculatorDraft(): CalculatorDraft {
  const draft = useContext(DraftContext);
  if (!draft)
    throw new Error(
      'useCalculatorDraft must be used inside CalculatorDraftProvider',
    );
  return draft;
}
