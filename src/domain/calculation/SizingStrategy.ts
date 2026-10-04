import { SOLAR_CONSTANTS } from './SolarConstants';
import {
  SolarMath,
  type EngineResult,
  type LoadMetrics,
  type SystemType,
} from './SolarMath';

export type SystemPurpose = 'monthly-savings' | 'peak-shaving' | 'zero-bill';
export type PropertyClass = 'Residential' | 'Commercial' | 'Industrial';

/** Everything the calculator form collects; each strategy reads what it needs. */
export interface SizingInput {
  property: PropertyClass;
  systemType: SystemType;
  hasBill: boolean;
  savingsTarget: number;
  electricRate: number;
  monthlyBill: number;
  peakPowerKw: number;
  allowedGridPowerKw: number;
  peakDurationHours: number;
  applianceCount: number;
  load: LoadMetrics;
}

/**
 * One system purpose: its copy, which fields it shows and how it sizes the
 * system. Adding a purpose means adding a subclass and registering it.
 */
export abstract class SizingStrategy {
  abstract readonly purpose: SystemPurpose;
  abstract readonly label: string;
  abstract readonly description: string;

  /** Whether the user may pick this purpose for a property class. */
  isAvailableFor(_property: PropertyClass): boolean {
    return true;
  }

  /** Whether the system type (hybrid / grid-tied) toggle applies. */
  get usesSystemType(): boolean {
    return false;
  }

  /** First problem with the input, phrased for the user, or null. */
  abstract validate(input: SizingInput): string | null;

  /** Recommended system, or null while the input is incomplete. */
  abstract compute(input: SizingInput): EngineResult | null;

  /** Monthly savings figure reported with the proposal. */
  abstract reportedMonthlySavings(input: SizingInput): number;
}

export class MonthlySavingsStrategy extends SizingStrategy {
  readonly purpose = 'monthly-savings' as const;
  readonly label = 'Monthly Savings';
  readonly description =
    'Target a specific monthly savings amount. Size the system to offset a portion of your electricity bill.';

  override get usesSystemType(): boolean {
    return true;
  }

  validate(input: SizingInput): string | null {
    if (input.savingsTarget <= 0)
      return 'Please enter a monthly savings target.';
    if (input.electricRate <= 0)
      return 'Please enter a valid electricity rate.';
    return null;
  }

  compute(input: SizingInput): EngineResult | null {
    const dpt = SolarMath.dailyTarget(input.savingsTarget, input.electricRate);
    if (dpt <= 0) return null;
    const { duec } = input.load;
    const yieldPerKwp = SOLAR_CONSTANTS.dailyYieldPerKwp;

    if (input.systemType === 'grid-tied') {
      const solarKwp =
        dpt < duec ? dpt / yieldPerKwp : (dpt - duec) / 2 + duec / yieldPerKwp;
      return {
        solarKwp,
        inverterKw: SolarMath.roundInverterSize(solarKwp),
        storageKwh: 0,
        systemType: 'grid-tied',
      };
    }

    const solarKwp =
      dpt < duec
        ? dpt / yieldPerKwp
        : SolarMath.solarForDailyTarget(Math.max(dpt, duec));
    const storageKwh =
      dpt < duec
        ? SolarMath.roundStorageCapacity(0)
        : SolarMath.roundStorageCapacity(
            (dpt - duec) / SOLAR_CONSTANTS.systemEfficiency,
          );
    return {
      solarKwp,
      inverterKw: SolarMath.roundInverterSize(solarKwp),
      storageKwh,
      systemType: 'hybrid',
    };
  }

  reportedMonthlySavings(input: SizingInput): number {
    return input.savingsTarget;
  }
}

export class PeakShavingStrategy extends SizingStrategy {
  readonly purpose = 'peak-shaving' as const;
  readonly label = 'Peak Shaving';
  readonly description =
    'Reduce peak demand charges. Battery discharges during peak hours to lower your maximum grid draw.';

  validate(input: SizingInput): string | null {
    if (input.peakPowerKw <= 0) return 'Please enter your peak power demand.';
    if (input.peakPowerKw <= input.allowedGridPowerKw) {
      return 'Peak power must be greater than the allowed grid power.';
    }
    if (input.peakDurationHours <= 0 || input.peakDurationHours > 24) {
      return 'Please enter a valid peak duration (between 0 and 24 hours).';
    }
    return null;
  }

  compute(input: SizingInput): EngineResult | null {
    if (this.validate(input)) return null;
    const inverterKw = SolarMath.roundInverterSize(
      input.peakPowerKw - input.allowedGridPowerKw,
    );
    const storageKwh = SolarMath.roundStorageCapacity(
      (inverterKw * input.peakDurationHours) / SOLAR_CONSTANTS.systemEfficiency,
    );
    // kWp needed to recharge the battery within one solar day.
    const solarKwp =
      Math.round((storageKwh / SOLAR_CONSTANTS.dailyYieldPerKwp) * 100) / 100;
    return { solarKwp, inverterKw, storageKwh, systemType: 'hybrid' };
  }

  reportedMonthlySavings(): number {
    return 0;
  }
}

export class ZeroBillStrategy extends SizingStrategy {
  readonly purpose = 'zero-bill' as const;
  readonly label = 'Zero Bill / Off-Grid';
  readonly description =
    'Eliminate your electricity bill completely. Covers full day and night load with solar and battery.';

  override isAvailableFor(property: PropertyClass): boolean {
    return property === 'Residential';
  }

  validate(input: SizingInput): string | null {
    if (!input.hasBill && input.applianceCount === 0) {
      return 'Please enter a bill or add appliances to size the system.';
    }
    if (input.hasBill) {
      if (input.monthlyBill <= 0)
        return 'Please enter your monthly electricity bill.';
      if (input.electricRate <= 0)
        return 'Please enter a valid electricity rate.';
    }
    return null;
  }

  compute(input: SizingInput): EngineResult | null {
    const { duec, nwec } = input.load;
    const hasProfile = input.applianceCount > 0;
    const hybrid = (solarKwp: number, storageKwh: number): EngineResult => ({
      solarKwp,
      inverterKw: SolarMath.roundInverterSize(solarKwp),
      storageKwh,
      systemType: 'hybrid',
    });

    if (input.hasBill) {
      if (input.monthlyBill <= 0 || input.electricRate <= 0) return null;
      const dpt = SolarMath.dailyTarget(input.monthlyBill, input.electricRate);
      if (!hasProfile) {
        const solarKwp = SolarMath.solarForDailyTarget(dpt);
        return hybrid(
          solarKwp,
          SolarMath.roundStorageCapacity(
            solarKwp * SOLAR_CONSTANTS.zeroBillStorageRatio,
          ),
        );
      }
      const storageKwh = SolarMath.roundStorageCapacity(
        nwec / SOLAR_CONSTANTS.systemEfficiency,
      );
      const solarKwp =
        dpt >= storageKwh
          ? SolarMath.solarForDailyTarget(Math.max(dpt, nwec))
          : storageKwh / SOLAR_CONSTANTS.dailyYieldPerKwp;
      return hybrid(solarKwp, storageKwh);
    }

    if (!hasProfile) return null;
    const solarKwp =
      Math.round(((duec + nwec) / SOLAR_CONSTANTS.dailyYieldPerKwp) * 100) /
      100;
    return hybrid(
      solarKwp,
      SolarMath.roundStorageCapacity(nwec / SOLAR_CONSTANTS.systemEfficiency),
    );
  }

  reportedMonthlySavings(input: SizingInput): number {
    return input.hasBill ? input.monthlyBill : 0;
  }
}

/** Display order matches the website. */
export const SIZING_STRATEGIES: readonly SizingStrategy[] = Object.freeze([
  new ZeroBillStrategy(),
  new MonthlySavingsStrategy(),
  new PeakShavingStrategy(),
]);

export function strategyFor(purpose: SystemPurpose): SizingStrategy {
  const strategy = SIZING_STRATEGIES.find(s => s.purpose === purpose);
  if (!strategy) throw new Error(`Unknown system purpose: ${purpose}`);
  return strategy;
}
