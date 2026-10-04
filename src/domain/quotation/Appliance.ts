import { DAY_BOUNDARY } from '../calculation/SolarConstants';
import { SolarMath, type ApplianceLoad } from '../calculation/SolarMath';

export interface TimeWindow {
  from: string;
  to: string;
}

export interface UsageHours {
  total: number;
  day: number;
  night: number;
}

/**
 * How an appliance is used through the day. Each pattern computes its own
 * day/night split and labels, so the editor and payload never branch on type.
 */
export abstract class UsagePattern {
  abstract readonly usageType: 'Scheduled' | 'Estimated' | '24/7';
  abstract hours(): UsageHours;
  abstract scheduleLabel(): string;
  abstract validate(): string | null;

  windows(): TimeWindow[] {
    return [];
  }

  protected static round(n: number): number {
    return Number(n.toFixed(2));
  }
}

export class AlwaysOnUsage extends UsagePattern {
  readonly usageType = '24/7' as const;

  hours(): UsageHours {
    const day = (DAY_BOUNDARY.endMinutes - DAY_BOUNDARY.startMinutes) / 60;
    return { total: 24, day, night: 24 - day };
  }

  scheduleLabel(): string {
    return 'Running 24/7';
  }

  validate(): string | null {
    return null;
  }
}

export class EstimatedUsage extends UsagePattern {
  readonly usageType = 'Estimated' as const;

  constructor(readonly dayHours: number, readonly nightHours: number) {
    super();
  }

  hours(): UsageHours {
    const day = Math.max(0, this.dayHours || 0);
    const night = Math.max(0, this.nightHours || 0);
    return {
      total: UsagePattern.round(day + night),
      day: UsagePattern.round(day),
      night: UsagePattern.round(night),
    };
  }

  scheduleLabel(): string {
    return 'Estimated';
  }

  validate(): string | null {
    const { total } = this.hours();
    return total <= 0 || total > 24
      ? 'Total estimated usage must be between 1 and 24 hours.'
      : null;
  }
}

export class ScheduledUsage extends UsagePattern {
  readonly usageType = 'Scheduled' as const;

  constructor(private readonly entries: readonly TimeWindow[]) {
    super();
  }

  override windows(): TimeWindow[] {
    return this.entries.filter(
      w =>
        SolarMath.minutes(w.from) !== null && SolarMath.minutes(w.to) !== null,
    );
  }

  hours(): UsageHours {
    let day = 0;
    let night = 0;
    for (const w of this.windows()) {
      const split = SolarMath.dayNightHours(w.from, w.to);
      day += split.dayHours;
      night += split.nightHours;
    }
    return {
      total: UsagePattern.round(day + night),
      day: UsagePattern.round(day),
      night: UsagePattern.round(night),
    };
  }

  scheduleLabel(): string {
    return this.windows()
      .map(w => `${formatClock(w.from)} - ${formatClock(w.to)}`)
      .join(', ');
  }

  validate(): string | null {
    const windows = this.windows();
    if (!windows.length) return 'Please add at least one complete schedule.';
    const { total } = this.hours();
    if (total <= 0 || total > 24)
      return 'Total schedule usage must be between 1 and 24 hours.';
    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i];
        const b = windows[j];
        if (a && b && windowsOverlap(a, b)) {
          return `Schedule entries overlap: ${formatClock(
            a.from,
          )}–${formatClock(a.to)} conflicts with ${formatClock(
            b.from,
          )}–${formatClock(b.to)}.`;
        }
      }
    }
    return null;
  }
}

/** "13:05" → "01:05 PM" */
export function formatClock(value: string): string {
  const minutes = SolarMath.minutes(value);
  if (minutes === null) return '--:-- --';
  const hour24 = Math.floor(minutes / 60);
  const hour = hour24 % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(
    2,
    '0',
  )} ${hour24 >= 12 ? 'PM' : 'AM'}`;
}

function intervals(w: TimeWindow): Array<[number, number]> {
  const from = SolarMath.minutes(w.from) ?? 0;
  const to = SolarMath.minutes(w.to) ?? 0;
  return from < to
    ? [[from, to]]
    : [
        [from, 1440],
        [0, to],
      ];
}

function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return intervals(a).some(([s1, e1]) =>
    intervals(b).some(([s2, e2]) => s1 < e2 && e1 > s2),
  );
}

export type RatingUnit = 'W' | 'HP' | 'Ton';

export const RATING_UNITS: ReadonlyArray<{
  id: RatingUnit;
  label: string;
  toWatts: number;
}> = [
  { id: 'W', label: 'Watts', toWatts: 1 },
  { id: 'HP', label: 'HP', toWatts: 746 },
  { id: 'Ton', label: 'Ton', toWatts: 3517 },
];

/** One row of the load profile. Immutable; edits produce a new instance. */
export class Appliance implements ApplianceLoad {
  readonly dayHours: number;
  readonly nightHours: number;
  readonly hours: number;

  constructor(
    readonly id: string,
    readonly name: string,
    readonly watts: number,
    readonly quantity: number,
    readonly pattern: UsagePattern,
  ) {
    const h = pattern.hours();
    this.hours = h.total;
    this.dayHours = h.day;
    this.nightHours = h.night;
  }

  /** Watt-hours per day. */
  get usage(): number {
    return this.watts * this.quantity * this.hours;
  }

  get dayUsage(): number {
    return this.watts * this.quantity * this.dayHours;
  }

  get nightUsage(): number {
    return this.watts * this.quantity * this.nightHours;
  }

  get schedule(): string {
    return this.pattern.scheduleLabel();
  }

  static validate(input: {
    name: string;
    watts: number;
    quantity: number;
    pattern: UsagePattern;
  }): string | null {
    const name = input.name.trim();
    if (!name) return 'Please enter an appliance name.';
    if (name.length > 80)
      return 'Appliance name must not exceed 80 characters.';
    if (!Number.isFinite(input.watts) || input.watts <= 0)
      return 'Please enter a valid watt rating.';
    if (input.watts > 1_000_000) return 'Watt rating is too large.';
    if (!Number.isInteger(input.quantity) || input.quantity <= 0)
      return 'Please enter a valid quantity.';
    if (input.quantity > 100_000) return 'Quantity is too large.';
    return input.pattern.validate();
  }
}
