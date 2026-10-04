// Mirrors azari-client src/models/calculation.ts so the app and the website
// size systems identically. Change both together.

const PEAK_SUN_HOURS = 5; // Philippines tropical average
const PERFORMANCE_RATIO = 0.8; // wiring, temperature and inverter losses
const DAYS_PER_MONTH = 30;

export const SOLAR_CONSTANTS = Object.freeze({
  /** kWh per day from 1 kWp: PSH × η = 4.0 */
  dailyYieldPerKwp: PEAK_SUN_HOURS * PERFORMANCE_RATIO,
  /** kWh per month from 1 kWp: 120 */
  averageSolarProductionPerKwp:
    PEAK_SUN_HOURS * PERFORMANCE_RATIO * DAYS_PER_MONTH,
  estimatedSavingsRate: 0.87,
  calculatorProjectionMonths: 12,
  projectionMonths: 144,
  systemEfficiency: PERFORMANCE_RATIO,
  peakSunHours: PEAK_SUN_HOURS,
  daysPerMonth: DAYS_PER_MONTH,
  zeroBillStorageRatio: 3,
  loadUsageFactor: 0.7,
});

export interface RangeConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export const ELECTRIC_RATE_CONFIG: RangeConfig = Object.freeze({
  min: 8,
  max: 20,
  step: 0.01,
  defaultValue: 11.25,
});

export const MONTHLY_BILL_CONFIG: RangeConfig = Object.freeze({
  min: 3000,
  max: 200_000,
  step: 100,
  defaultValue: 3000,
});

export const INVERTER_STEPS: readonly number[] = Object.freeze([
  3.6, 5, 6, 8, 10, 12, 16,
]);

/** Daytime window used to split appliance usage into solar vs battery hours. */
export const DAY_BOUNDARY = Object.freeze({
  startMinutes: 8 * 60,
  endMinutes: 18 * 60,
});

/** Package-card savings estimate uses a flat ₱/kWh rate. */
export const AVERAGE_SAVINGS_RATE = 12.5;
