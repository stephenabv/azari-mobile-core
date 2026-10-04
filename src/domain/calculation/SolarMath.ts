import {
  AVERAGE_SAVINGS_RATE,
  DAY_BOUNDARY,
  INVERTER_STEPS,
  SOLAR_CONSTANTS,
} from './SolarConstants';

export type SystemType = 'hybrid' | 'grid-tied';

export interface EngineResult {
  solarKwp: number;
  inverterKw: number;
  storageKwh: number;
  systemType: SystemType;
}

export interface ApplianceLoad {
  watts: number;
  quantity: number;
  dayHours: number;
  nightHours: number;
  usage: number;
}

export interface LoadMetrics {
  /** Daytime usable energy consumption (kWh/day). */
  duec: number;
  /** Night-time energy consumption (kWh/day). */
  nwec: number;
  totalDailyUsageWh: number;
}

export interface SavingsEstimate {
  monthlyKwh: number;
  systemSize: number;
  estimatedMonthlySavings: number;
  projectedSavings: number;
  projectionMonths: number;
}

/** Pure sizing formulas shared by every calculator screen. */
export class SolarMath {
  static roundInverterSize(rawKw: number): number {
    const first = INVERTER_STEPS[0] ?? 3.6;
    if (rawKw <= 0) return first;
    if (rawKw >= 20) return Math.ceil(rawKw / 10) * 10;
    return (
      INVERTER_STEPS.find(step => step >= rawKw) ?? Math.ceil(rawKw / 10) * 10
    );
  }

  static roundStorageCapacity(rawKwh: number): number {
    if (rawKwh <= 0) return 5;
    return Math.ceil(rawKwh / 5) * 5;
  }

  /** Daily production target (kWh/day) for a peso amount at a rate. */
  static dailyTarget(amountPhp: number, electricRate: number): number {
    if (electricRate <= 0) return 0;
    return amountPhp / electricRate / SOLAR_CONSTANTS.daysPerMonth;
  }

  /** kWp needed for a daily energy target, rounded to 0.01. */
  static solarForDailyTarget(dpt: number): number {
    return Math.round((dpt / SOLAR_CONSTANTS.dailyYieldPerKwp) * 100) / 100;
  }

  static loadMetrics(appliances: readonly ApplianceLoad[]): LoadMetrics {
    const factor = SOLAR_CONSTANTS.loadUsageFactor;
    return appliances.reduce<LoadMetrics>(
      (acc, a) => ({
        duec: acc.duec + (a.watts * a.quantity * a.dayHours * factor) / 1000,
        nwec: acc.nwec + (a.watts * a.quantity * a.nightHours * factor) / 1000,
        totalDailyUsageWh: acc.totalDailyUsageWh + a.usage,
      }),
      { duec: 0, nwec: 0, totalDailyUsageWh: 0 },
    );
  }

  /** Splits a HH:mm–HH:mm window (may cross midnight) into day and night hours. */
  static dayNightHours(
    from: string,
    to: string,
  ): { dayHours: number; nightHours: number } {
    const fromMin = SolarMath.minutes(from);
    let toMin = SolarMath.minutes(to);
    if (fromMin === null || toMin === null)
      return { dayHours: 0, nightHours: 0 };
    if (toMin <= fromMin) toMin += 24 * 60;

    const overlap = (start: number, end: number) =>
      Math.max(
        0,
        Math.min(end, DAY_BOUNDARY.endMinutes) -
          Math.max(start, DAY_BOUNDARY.startMinutes),
      );

    const totalMin = toMin - fromMin;
    const dayMin =
      toMin <= 1440
        ? overlap(fromMin, toMin)
        : overlap(fromMin, 1440) + overlap(0, toMin - 1440);
    return { dayHours: dayMin / 60, nightHours: (totalMin - dayMin) / 60 };
  }

  static minutes(time: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  /** Home-page savings calculator (bill and rate only). */
  static estimateFromBill(
    monthlyBill: number,
    electricRate: number,
  ): SavingsEstimate {
    const rate = electricRate > 0 ? electricRate : 0;
    const monthlyKwh = rate > 0 ? monthlyBill / rate : 0;
    const raw = monthlyKwh / SOLAR_CONSTANTS.averageSolarProductionPerKwp;
    const systemSize = raw > 0 ? Number(raw.toFixed(1)) : 0;
    const estimatedMonthlySavings =
      monthlyKwh * rate * SOLAR_CONSTANTS.estimatedSavingsRate;
    const projectionMonths = SOLAR_CONSTANTS.calculatorProjectionMonths;
    return {
      monthlyKwh: Math.round(monthlyKwh),
      systemSize,
      estimatedMonthlySavings: Math.round(estimatedMonthlySavings),
      projectedSavings: Math.round(estimatedMonthlySavings * projectionMonths),
      projectionMonths,
    };
  }

  /** Package-card monthly savings band for a production capacity. */
  static packageSavings(productionKwp: number): {
    monthlyKwh: number;
    min: number;
    max: number;
  } {
    const monthlyKwh =
      Math.round(
        productionKwp * SOLAR_CONSTANTS.averageSolarProductionPerKwp * 10,
      ) / 10;
    const max = Math.ceil((monthlyKwh * AVERAGE_SAVINGS_RATE) / 500) * 500;
    return { monthlyKwh, min: Math.max(0, max - 2000), max };
  }

  static formatSystemSize(
    kWp: number,
    precision = 1,
  ): { value: string; unit: string } {
    if (kWp >= 1000)
      return { value: (kWp / 1000).toFixed(precision), unit: 'MWp' };
    return { value: kWp.toFixed(precision), unit: 'kWp' };
  }
}
