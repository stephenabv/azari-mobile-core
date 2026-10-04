import { z } from 'zod';
import { DEFAULT_INVERTER_BRANDS_CONTENT } from '../packages/InverterBrandCatalog';

/**
 * Admin-editable site content (GET /api/content/:key). Each key has a lenient
 * schema and a fallback, so a malformed or missing entry degrades to defaults
 * instead of breaking a screen. A new key is one registry entry.
 */
const text = (fallback = '') => z.string().catch(fallback);

const heroSchema = z.object({
  headerPart1: text(),
  headerPart2: text(),
  highlightWords: text(),
  subtext: text(),
  primaryCta: text('Calculate Your Savings'),
  secondaryCta: text('View Projects'),
});

const itemsOf = <T extends z.ZodType>(item: T) =>
  z
    .object({ items: z.array(item.catch(null as never)).catch([]) })
    .transform(v => ({
      items: v.items.filter(Boolean) as z.output<T>[],
    }));

const metricsSchema = itemsOf(
  z.object({
    value: z.string(),
    label: z.string(),
    order: z.number().catch(0),
  }),
);
const benefitsSchema = itemsOf(
  z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().catch(0),
  }),
);
const excellenceSchema = itemsOf(
  z.object({ number: text(), title: z.string(), description: text() }),
);
const partnersSchema = z
  .object({
    title: text(''),
    items: z
      .array(
        z.object({ name: z.string(), logoUrl: text('') }).catch(null as never),
      )
      .catch([]),
  })
  .transform(v => ({ title: v.title, items: v.items.filter(Boolean) }));

const processSchema = z
  .object({
    steps: z
      .array(
        z
          .object({ number: text(), title: z.string(), description: text() })
          .catch(null as never),
      )
      .catch([]),
  })
  .transform(v => ({ steps: v.steps.filter(Boolean) }));

const tropicsSchema = z.object({
  header: text(),
  subtext: text(),
  performanceRating: z.number().catch(87),
});
const ctaSchema = z.object({
  title: text(),
  description: text(),
  primaryCta: text(),
  secondaryCta: text(),
});

const footerSchema = z.object({
  phone: text(),
  email: text(),
  socials: z
    .record(
      z.string(),
      z.object({ name: z.string(), url: z.string() }).catch(null as never),
    )
    .catch({}),
});

const testimonialsSchema = z
  .object({
    entries: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string(),
            location: text(),
            testimonial: text(),
            videoUrl: text(''),
          })
          .catch(null as never),
      )
      .catch([]),
  })
  .transform(v => ({ entries: v.entries.filter(Boolean) }));

const visibilitySchema = z
  .record(z.string(), z.boolean().catch(true))
  .catch({});

const legalSchema = z
  .object({
    title: text(),
    effectiveDate: text(),
    lastUpdated: text(),
    intro: text(),
    sections: z
      .array(z.object({ heading: text(), body: text() }).catch(null as never))
      .catch([]),
  })
  .transform(v => ({ ...v, sections: v.sections.filter(Boolean) }));

const disclaimerSchema = z.object({
  enabled: z.boolean().catch(false),
  text: text(),
});

const inverterBrandsSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            name: z.string(),
            logoUrl: text(''),
            order: z.number().catch(Number.MAX_SAFE_INTEGER),
          })
          .catch(null as never),
      )
      .catch([]),
  })
  .transform(v => ({ items: v.items.filter(Boolean) }));

export const CONTENT_REGISTRY = {
  hero: {
    schema: heroSchema,
    fallback: {
      headerPart1: 'Affordable',
      headerPart2: 'Solar Power for Every Filipino Home and Business',
      highlightWords: 'Affordable',
      subtext: 'We Provide Solar Solutions Tailored For Your Home And Business',
      primaryCta: 'Calculate Your Savings',
      secondaryCta: 'View Projects',
    },
  },
  metrics: { schema: metricsSchema, fallback: { items: [] } },
  benefits: { schema: benefitsSchema, fallback: { items: [] } },
  excellence: { schema: excellenceSchema, fallback: { items: [] } },
  partners: { schema: partnersSchema, fallback: { title: '', items: [] } },
  process: { schema: processSchema, fallback: { steps: [] } },
  tropics: {
    schema: tropicsSchema,
    fallback: {
      header: 'Solar Energy for the Tropics',
      subtext: '',
      performanceRating: 87,
    },
  },
  cta: {
    schema: ctaSchema,
    fallback: {
      title: 'Ready to engineer your energy independence?',
      description:
        'Take control of your energy bills. Get a free quote or talk to an expert',
      primaryCta: 'Get a free Quote',
      secondaryCta: 'Talk to an Expert',
    },
  },
  footer: {
    schema: footerSchema,
    fallback: { phone: '', email: 'sales@azari.solar', socials: {} },
  },
  clientJourney: { schema: testimonialsSchema, fallback: { entries: [] } },
  'section-visibility': { schema: visibilitySchema, fallback: {} },
  privacyPolicy: {
    schema: legalSchema,
    fallback: {
      title: 'Privacy Policy',
      effectiveDate: '',
      lastUpdated: '',
      intro: '',
      sections: [],
    },
  },
  termsConditions: {
    schema: legalSchema,
    fallback: {
      title: 'Terms and Conditions',
      effectiveDate: '',
      lastUpdated: '',
      intro: '',
      sections: [],
    },
  },
  legalDisclaimer: {
    schema: disclaimerSchema,
    fallback: { enabled: false, text: '' },
  },
  'inverter-brands': {
    schema: inverterBrandsSchema,
    fallback: DEFAULT_INVERTER_BRANDS_CONTENT,
  },
} as const;

export type ContentKey = keyof typeof CONTENT_REGISTRY;
export type ContentOf<K extends ContentKey> = z.output<
  (typeof CONTENT_REGISTRY)[K]['schema']
>;

/** Parses raw content for a key, falling back to its default on any shape error. */
export function parseContent<K extends ContentKey>(
  key: K,
  raw: unknown,
): ContentOf<K> {
  const entry = CONTENT_REGISTRY[key];
  const parsed = entry.schema.safeParse(raw);
  return (parsed.success ? parsed.data : entry.fallback) as ContentOf<K>;
}
