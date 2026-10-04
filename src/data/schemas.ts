import { z } from 'zod';
import type { ContentBlock, JourneyStep } from '../domain/journey/JourneyStep';
import type { SolarPackage } from '../domain/packages/types';
import type { Project } from '../domain/projects/Project';

/**
 * Response schemas for the public API. They are deliberately lenient per item
 * (a bad row is dropped, an odd field falls back) and strict about the shape
 * the screens rely on, so admin edits can never crash the app.
 */

const num = (fallback = 0) => z.coerce.number().finite().catch(fallback);
const nullableNum = z.coerce.number().finite().nullable().catch(null);
const str = (fallback = '') => z.string().catch(fallback);
const nullableStr = z.string().nullable().catch(null);

/** Arrays where one malformed element is skipped instead of failing the list. */
export function tolerantArray<T extends z.ZodType>(item: T) {
  return z
    .array(z.unknown())
    .catch([])
    .transform(values =>
      values.flatMap(value => {
        const parsed = item.safeParse(value);
        return parsed.success ? [parsed.data as z.output<T>] : [];
      }),
    );
}

export const envelope = <T extends z.ZodType>(data: T) => z.object({ data });

// ── Packages ────────────────────────────────────────────────────────────────

const componentSchema = z.object({
  id: z.string(),
  name: str(),
  brand: str(),
  model: str(),
  category: str(),
  unitPrice: nullableNum,
  pricingEnabled: z.boolean().catch(false),
  productionCapacityKwp: num(),
  loadCapacityKw: num(),
  storageCapacityKwh: num(),
  parallelMax: num(1),
  pvMinPower: nullableNum.optional().transform(v => v ?? null),
  pvMaxPower: nullableNum.optional().transform(v => v ?? null),
  batteryMaxCapacity: nullableNum.optional().transform(v => v ?? null),
  dataSheetUrl: nullableStr.optional().transform(v => v ?? null),
});

const lineSchema = z.object({
  componentId: z.string(),
  quantity: num(1),
  baseComponentId: nullableStr.optional().transform(v => v ?? null),
  multiplier: nullableNum.optional().transform(v => v ?? null),
  component: componentSchema,
});

export const packageSchema: z.ZodType<SolarPackage> = z.object({
  id: z.string(),
  name: str(),
  solarKwp: num(),
  inverterKw: num(),
  storageKwh: num(),
  phase: z.enum(['single', 'three']),
  totalPrice: nullableNum,
  billRangeMin: num(),
  billRangeMax: num(),
  isActive: z.boolean().catch(true),
  isRecommended: z.boolean().catch(false),
  sortOrder: nullableNum.optional().transform(v => v ?? null),
  ipRating: z
    .object({ code: z.string(), description: str() })
    .nullable()
    .optional()
    .catch(null)
    .transform(v => v ?? null),
  imageUrl: nullableStr.optional().transform(v => v ?? null),
  mainFeatures: z.array(z.string()).catch([]),
  components: tolerantArray(lineSchema),
  createdAt: str(''),
}) as unknown as z.ZodType<SolarPackage>;

export const packagesResponse = envelope(tolerantArray(packageSchema));

// ── Projects ────────────────────────────────────────────────────────────────

const heroField = z.enum([
  'loadKw',
  'storageKwh',
  'productionKwp',
  'savings',
  'electricalSystem',
]);

const heroCardSchema = z.union([
  z.object({
    type: z.literal('system'),
    field: heroField,
    label: z.string().optional(),
  }),
  z.object({ type: z.literal('custom'), value: str(), label: str() }),
]);

const bentoSchema = z.object({
  cardType: z.enum(['hero', 'feature']),
  title: str(),
  titleSource: z
    .union([
      z.object({ type: z.literal('system'), field: heroField }),
      z.object({ type: z.literal('custom') }),
    ])
    .optional()
    .catch(undefined),
  description: z.string().optional().catch(undefined),
  badge: z.string().optional().catch(undefined),
  tag: z.string().optional().catch(undefined),
  imageUrl: z.string().optional().catch(undefined),
});

export const projectSchema: z.ZodType<Project> = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: nullableStr.optional().transform(v => v ?? null),
  category: str('Residential'),
  system: str(),
  savings: str(),
  imageUrl: str(),
  videoUrl: nullableStr.optional().transform(v => (v ? v : null)),
  isRecent: z.boolean().catch(false),
  sortOrder: num(0),
  stats: tolerantArray(z.object({ value: z.string(), label: z.string() })),
  performanceMetrics: tolerantArray(
    z.object({
      title: z.string(),
      description: str(),
      value: z.number().optional().catch(undefined),
    }),
  ),
  technicalBreakdown: tolerantArray(bentoSchema),
  galleryImages: z.array(z.string()).catch([]),
  heroCards: tolerantArray(heroCardSchema),
  testimonial: z
    .object({ clientName: str(), clientRole: str(), quote: z.string() })
    .nullable()
    .optional()
    .catch(null)
    .transform(v => v ?? null),
  electricalSystem: nullableStr.optional().transform(v => v ?? null),
  loadKw: nullableNum.optional().transform(v => v ?? null),
  productionKwp: nullableNum.optional().transform(v => v ?? null),
  storageKwh: nullableNum.optional().transform(v => v ?? null),
}) as unknown as z.ZodType<Project>;

export const projectsResponse = envelope(tolerantArray(projectSchema));
export const projectResponse = envelope(projectSchema);

// ── Client journey ─────────────────────────────────────────────────────────

const order = num(0);

interface BulletShape {
  text: string;
  boldLead?: string | undefined;
  linkUrl?: string | undefined;
  linkLabel?: string | undefined;
  children?: BulletShape[] | undefined;
}

const bulletSchema: z.ZodType<BulletShape> = z.lazy(() =>
  z.object({
    text: str(),
    boldLead: z.string().optional().catch(undefined),
    linkUrl: z.string().optional().catch(undefined),
    linkLabel: z.string().optional().catch(undefined),
    children: tolerantArray(bulletSchema).optional(),
  }),
) as z.ZodType<BulletShape>;

const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    order,
    text: z.string(),
    level: num(2),
  }),
  z.object({ type: z.literal('paragraph'), order, html: z.string() }),
  z.object({
    type: z.literal('bullet_list'),
    order,
    items: tolerantArray(bulletSchema),
  }),
  z.object({
    type: z.literal('link_group'),
    order,
    links: tolerantArray(
      z.object({
        label: z.string(),
        url: z.string(),
        style: z.enum(['text', 'button']).catch('text'),
      }),
    ),
  }),
  z.object({
    type: z.literal('button'),
    order,
    label: z.string(),
    url: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    order,
    src: z.string(),
    alt: str(),
    caption: z.string().optional().catch(undefined),
  }),
  z.object({
    type: z.literal('partner_grid'),
    order,
    items: tolerantArray(
      z.object({
        name: z.string(),
        logoUrl: z.string().optional().catch(undefined),
        downloadUrl: z.string().optional().catch(undefined),
      }),
    ),
  }),
  z.object({
    type: z.literal('contact_channels'),
    order,
    channels: tolerantArray(
      z.object({
        kind: z.enum([
          'whatsapp',
          'viber',
          'facebook',
          'instagram',
          'email',
          'phone',
        ]),
        value: z.string(),
        url: str(),
      }),
    ),
  }),
  z.object({ type: z.literal('divider'), order }),
]);

const journeyStepSchema = z.object({
  id: z.string(),
  order: num(0),
  title: z.string(),
  subheading: nullableStr.optional().transform(v => v ?? null),
  iconUrl: nullableStr.optional().transform(v => v ?? null),
  accentColor: nullableStr.optional().transform(v => v ?? null),
  blocks: tolerantArray(blockSchema).transform(v => v as ContentBlock[]),
});

export const journeyResponse = envelope(
  tolerantArray(journeyStepSchema),
).transform(v => ({ data: v.data as JourneyStep[] }));

// ── Content, mobile config, submissions ─────────────────────────────────────

export const contentResponse = z.object({ data: z.unknown() });

export const mobileConfigResponse = z.object({
  minimumVersion: z.object({
    ios: z.string().catch('0.0.0'),
    android: z.string().catch('0.0.0'),
  }),
  integrityPlatforms: z.array(z.string()).catch([]),
});

export const createdResponse = z.object({ success: z.literal(true) }).loose();
