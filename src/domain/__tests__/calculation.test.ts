import {
  Appliance,
  EstimatedUsage,
  ScheduledUsage,
  AlwaysOnUsage,
} from '../quotation/Appliance';
import { buildQuotationPayload } from '../quotation/ProposalRequest';
import { SolarMath } from '../calculation/SolarMath';
import {
  SIZING_STRATEGIES,
  strategyFor,
  type SizingInput,
} from '../calculation/SizingStrategy';

const input = (overrides: Partial<SizingInput> = {}): SizingInput => ({
  property: 'Residential',
  systemType: 'hybrid',
  hasBill: true,
  savingsTarget: 0,
  electricRate: 12,
  monthlyBill: 0,
  peakPowerKw: 0,
  allowedGridPowerKw: 0,
  peakDurationHours: 0,
  applianceCount: 0,
  load: { duec: 0, nwec: 0, totalDailyUsageWh: 0 },
  ...overrides,
});

describe('SolarMath', () => {
  it('rounds inverter and storage sizes to catalog steps', () => {
    expect(SolarMath.roundInverterSize(4.1)).toBe(5);
    expect(SolarMath.roundInverterSize(17)).toBe(20);
    expect(SolarMath.roundInverterSize(23)).toBe(30);
    expect(SolarMath.roundStorageCapacity(7)).toBe(10);
  });

  it('splits a schedule crossing midnight into day and night hours', () => {
    expect(SolarMath.dayNightHours('17:00', '02:00')).toEqual({
      dayHours: 1,
      nightHours: 8,
    });
  });
});

describe('sizing strategies', () => {
  it('lists zero bill only for residential properties', () => {
    expect(
      SIZING_STRATEGIES.filter(s => s.isAvailableFor('Commercial')).map(
        s => s.purpose,
      ),
    ).toEqual(['monthly-savings', 'peak-shaving']);
  });

  it('sizes monthly savings for hybrid and grid-tied', () => {
    const strategy = strategyFor('monthly-savings');
    // 3600 / 12 / 30 = 10 kWh/day; no daytime load → 10 / 4 = 2.5 kWp, storage 10 / 0.8 → 15 kWh
    expect(strategy.compute(input({ savingsTarget: 3600 }))).toEqual({
      solarKwp: 2.5,
      inverterKw: 3.6,
      storageKwh: 15,
      systemType: 'hybrid',
    });
    expect(
      strategy.compute(input({ savingsTarget: 3600, systemType: 'grid-tied' }))
        ?.storageKwh,
    ).toBe(0);
  });

  it('sizes peak shaving from the demand gap', () => {
    const strategy = strategyFor('peak-shaving');
    expect(
      strategy.validate(
        input({
          peakPowerKw: 10,
          allowedGridPowerKw: 10,
          peakDurationHours: 2,
        }),
      ),
    ).toMatch(/greater/);
    expect(
      strategy.compute(
        input({
          peakPowerKw: 15,
          allowedGridPowerKw: 10,
          peakDurationHours: 2,
        }),
      ),
    ).toEqual({
      solarKwp: 3.75,
      inverterKw: 5,
      storageKwh: 15,
      systemType: 'hybrid',
    });
  });

  it('sizes zero bill from the bill alone', () => {
    const result = strategyFor('zero-bill').compute(
      input({ monthlyBill: 7200 }),
    );
    // 7200 / 12 / 30 = 20 kWh/day → 5 kWp, storage 5 × 3 = 15 kWh
    expect(result).toEqual({
      solarKwp: 5,
      inverterKw: 5,
      storageKwh: 15,
      systemType: 'hybrid',
    });
  });
});

describe('Appliance usage patterns', () => {
  it('computes hours per pattern', () => {
    expect(new AlwaysOnUsage().hours()).toEqual({
      total: 24,
      day: 10,
      night: 14,
    });
    expect(new EstimatedUsage(3, 2).hours()).toEqual({
      total: 5,
      day: 3,
      night: 2,
    });
    expect(
      new ScheduledUsage([{ from: '07:00', to: '09:00' }]).hours(),
    ).toEqual({ total: 2, day: 1, night: 1 });
  });

  it('rejects overlapping schedules', () => {
    const overlapping = new ScheduledUsage([
      { from: '08:00', to: '12:00' },
      { from: '11:00', to: '13:00' },
    ]);
    expect(overlapping.validate()).toMatch(/overlap/);
  });

  it('validates appliance input', () => {
    expect(
      Appliance.validate({
        name: ' ',
        watts: 1,
        quantity: 1,
        pattern: new AlwaysOnUsage(),
      }),
    ).toMatch(/name/);
    expect(
      Appliance.validate({
        name: 'Fan',
        watts: 60,
        quantity: 1.5,
        pattern: new AlwaysOnUsage(),
      }),
    ).toMatch(/quantity/);
    expect(
      Appliance.validate({
        name: 'Fan',
        watts: 60,
        quantity: 2,
        pattern: new AlwaysOnUsage(),
      }),
    ).toBeNull();
  });
});

describe('buildQuotationPayload', () => {
  it('produces the website payload shape', () => {
    const fan = new Appliance('1', 'Fan', 60, 2, new EstimatedUsage(3, 2));
    const strategy = strategyFor('monthly-savings');
    const sizing = input({
      savingsTarget: 3600,
      applianceCount: 1,
      load: SolarMath.loadMetrics([fan]),
    });
    const result = strategy.compute(sizing)!;
    const payload = buildQuotationPayload({
      strategy,
      property: 'Residential',
      input: sizing,
      result,
      appliances: [fan],
      bill: { name: 'bill.pdf', mimeType: 'application/pdf', size: 1048576 },
      customer: {
        fullName: ' Juan ',
        location: 'Cebu',
        email: 'J@X.COM',
        phone: '0917 123 4567',
        message: '',
      },
      now: new Date('2026-10-04T00:00:00.000Z'),
    });

    expect(payload).toMatchObject({
      type: 'quotation_request',
      submittedAt: '2026-10-04T00:00:00.000Z',
      systemPurpose: 'monthly-savings',
      customer: { fullName: 'Juan', email: 'j@x.com', phone: '09171234567' },
      property: { classification: 'Residential' },
      solarEstimate: {
        estimatedMonthlySavingsPhp: 3600,
        projectionMonths: 144,
        totalDailyUsageWh: 600,
      },
      loadProfile: [
        {
          name: 'Fan',
          usageType: 'Estimated',
          hoursPerDay: 5,
          estimatedUsageWhPerDay: 600,
        },
      ],
      billAttachment: { fileName: 'bill.pdf', sizeDisplay: '1.00MB' },
    });
  });
});
