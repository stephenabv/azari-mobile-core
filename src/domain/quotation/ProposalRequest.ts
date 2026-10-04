import { SOLAR_CONSTANTS } from '../calculation/SolarConstants';
import { SolarMath, type EngineResult } from '../calculation/SolarMath';
import type {
  PropertyClass,
  SizingInput,
  SizingStrategy,
} from '../calculation/SizingStrategy';
import {
  Email,
  FieldSpec,
  FormValidator,
  MaxLength,
  MinLength,
  Pattern,
  PhilippinePhone,
  Required,
} from '../validation/rules';
import type { Appliance } from './Appliance';

export type ProposalField =
  | 'fullName'
  | 'location'
  | 'email'
  | 'phone'
  | 'message';
export type ProposalForm = Record<ProposalField, string>;

export const EMPTY_PROPOSAL_FORM: ProposalForm = {
  fullName: '',
  location: '',
  email: '',
  phone: '',
  message: '',
};

/** Mirrors the web form and the server's `quotationPayloadSchema.customer`. */
export const proposalValidator = new FormValidator<ProposalField>({
  fullName: new FieldSpec([
    new Required('Name is required.'),
    new MinLength(2, 'Name must be at least 2 characters.'),
    new MaxLength(80, 'Name must not exceed 80 characters.'),
    new Pattern(
      /^[A-Za-z0-9 .-]+$/,
      'Name can only contain letters, numbers, spaces, hyphen, and period.',
    ),
  ]),
  location: new FieldSpec([
    new Required('Location is required.'),
    new MinLength(3, 'Location must be at least 3 characters.'),
    new MaxLength(160, 'Location must not exceed 160 characters.'),
    new Pattern(
      /^[A-Za-z0-9Ññ .,'#/()-]+$/,
      'Location contains invalid characters.',
    ),
  ]),
  email: new FieldSpec([
    new Required('Email address is required.'),
    new Email(),
  ]),
  phone: new FieldSpec([
    new Required('Phone number is required.'),
    new PhilippinePhone(
      'Enter a valid telephone or cellphone number. Example: +639123456789, 09123456789, or 0381234567.',
    ),
  ]),
  message: FieldSpec.optional([
    new MaxLength(500, 'Additional notes must not exceed 500 characters.'),
  ]),
});

export interface BillAttachmentMeta {
  name: string;
  mimeType: string;
  size: number;
}

export interface ProposalContext {
  strategy: SizingStrategy;
  property: PropertyClass;
  input: SizingInput;
  result: EngineResult;
  appliances: readonly Appliance[];
  bill: BillAttachmentMeta | null;
  customer: ProposalForm;
  now?: Date;
}

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

/** Builds the exact JSON the website sends as the `payload` multipart field. */
export function buildQuotationPayload(ctx: ProposalContext) {
  const { result, appliances, strategy, input } = ctx;
  const sum = (pick: (a: Appliance) => number) =>
    appliances.reduce((s, a) => s + pick(a), 0);
  const totalDailyUsageWh = sum(a => a.usage);
  const sized = SolarMath.formatSystemSize(result.solarKwp, 2);
  const monthlySavings = strategy.reportedMonthlySavings(input);
  const typeLabel = result.systemType === 'hybrid' ? 'Hybrid' : 'Grid-Tied';

  return {
    type: 'quotation_request' as const,
    submittedAt: (ctx.now ?? new Date()).toISOString(),
    systemPurpose: strategy.purpose,
    systemType: result.systemType,
    customer: {
      fullName: ctx.customer.fullName.trim(),
      location: ctx.customer.location.trim(),
      email: ctx.customer.email.trim().toLowerCase(),
      phone: PhilippinePhone.normalize(ctx.customer.phone),
      message: ctx.customer.message.trim(),
    },
    property: { classification: ctx.property },
    consumption: {
      averageMonthlyBillPhp: input.hasBill ? input.monthlyBill : 0,
      monthlySavingsTargetPhp: input.savingsTarget,
      electricRatePhpPerKwh: input.electricRate,
      estimatedMonthlyKwh: Math.round(
        (totalDailyUsageWh * SOLAR_CONSTANTS.daysPerMonth) / 1000,
      ),
      peakPowerKw: input.peakPowerKw,
      allowedGridPowerKw: input.allowedGridPowerKw,
      peakDurationHours: input.peakDurationHours,
    },
    solarEstimate: {
      estimatedSystemSize: {
        rawKwp: result.solarKwp,
        displayValue: sized.value,
        displayUnit: sized.unit,
        displayText: `${sized.value} ${sized.unit}`,
      },
      inverterSizeKw: result.inverterKw,
      storageCapacityKwh: result.storageKwh,
      configuration: `~${sized.value} ${sized.unit} ${typeLabel}`,
      estimatedMonthlySavingsPhp: monthlySavings,
      estimatedProjectedSavingsPhp:
        monthlySavings * SOLAR_CONSTANTS.projectionMonths,
      projectionMonths: SOLAR_CONSTANTS.projectionMonths,
      totalDailyUsageWh,
      totalDayUsageWh: sum(a => a.dayUsage),
      totalNightUsageWh: sum(a => a.nightUsage),
    },
    loadProfile: appliances.map(a => ({
      name: a.name,
      watts: a.watts,
      quantity: a.quantity,
      hoursPerDay: a.hours,
      dayHoursPerDay: a.dayHours,
      nightHoursPerDay: a.nightHours,
      schedule: a.schedule.slice(0, 300),
      usageType: a.pattern.usageType,
      estimatedUsageWhPerDay: a.usage,
    })),
    billAttachment: ctx.bill
      ? {
          fileName: ctx.bill.name,
          mimeType: ctx.bill.mimeType,
          sizeBytes: ctx.bill.size,
          sizeDisplay: megabytes(ctx.bill.size),
        }
      : null,
  };
}

export type QuotationPayload = ReturnType<typeof buildQuotationPayload>;

export const BILL_ATTACHMENT_RULES = Object.freeze({
  maxSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
});
