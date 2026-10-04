/** Public project as served by GET /api/projects. */

export type HeroSystemField =
  | 'loadKw'
  | 'storageKwh'
  | 'productionKwp'
  | 'savings'
  | 'electricalSystem';

export type HeroCardSource =
  | { type: 'system'; field: HeroSystemField; label?: string | undefined }
  | { type: 'custom'; value: string; label: string };

export interface BentoCard {
  cardType: 'hero' | 'feature';
  title: string;
  titleSource?:
    | { type: 'system'; field: HeroSystemField }
    | { type: 'custom' }
    | undefined;
  description?: string | undefined;
  badge?: string | undefined;
  tag?: string | undefined;
  imageUrl?: string | undefined;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  system: string;
  savings: string;
  imageUrl: string;
  videoUrl: string | null;
  isRecent: boolean;
  sortOrder: number;
  stats: Array<{ value: string; label: string }>;
  performanceMetrics: Array<{
    title: string;
    description: string;
    value?: number | undefined;
  }>;
  technicalBreakdown: BentoCard[];
  galleryImages: string[];
  heroCards: HeroCardSource[];
  testimonial: { clientName: string; clientRole: string; quote: string } | null;
  electricalSystem: string | null;
  loadKw: number | null;
  productionKwp: number | null;
  storageKwh: number | null;
}

export interface Chip {
  value: string;
  label: string;
}

const DEFAULT_LABELS: Record<HeroSystemField, string> = {
  loadKw: 'Load Capacity',
  storageKwh: 'Storage Capacity',
  productionKwp: 'Production Capacity',
  savings: 'Estimated Savings',
  electricalSystem: 'Electrical System',
};

const AUTO_FIELDS: readonly HeroSystemField[] = [
  'loadKw',
  'storageKwh',
  'productionKwp',
  'savings',
  'electricalSystem',
];

/** Resolves the headline figures of a project, ported from the web project page. */
export class ProjectFacts {
  constructor(private readonly project: Project) {}

  field(field: HeroSystemField): string | null {
    const p = this.project;
    switch (field) {
      case 'loadKw':
        return p.loadKw != null && p.loadKw > 0 ? `${p.loadKw}kW` : null;
      case 'storageKwh': {
        const fromSystem = /\(([\d.]+)\s*kWh/i.exec(p.system)?.[1];
        const value =
          p.storageKwh != null && p.storageKwh > 0
            ? p.storageKwh
            : fromSystem
            ? parseFloat(fromSystem)
            : 0;
        return value > 0 ? `${value}kWh` : null;
      }
      case 'productionKwp': {
        if (p.productionKwp != null && p.productionKwp > 0)
          return `${p.productionKwp}kWp`;
        const fromSystem = /^([\d.]+)\s*kWp/i.exec(p.system)?.[1];
        return fromSystem ? `${fromSystem}kWp` : null;
      }
      case 'savings':
        return p.savings || null;
      case 'electricalSystem':
        if (p.electricalSystem) return p.electricalSystem;
        if (p.system)
          return /3-phase|three.phase/i.test(p.system)
            ? 'Three-Phase'
            : 'Single-Phase';
        return null;
    }
  }

  /** Admin-configured hero cards, or the automatic set when none are configured. */
  heroChips(): Chip[] {
    const cards = this.project.heroCards;
    if (cards.length) {
      return cards.slice(0, 5).flatMap((card): Chip[] => {
        if (card.type === 'custom')
          return card.value || card.label
            ? [{ value: card.value, label: card.label }]
            : [];
        const value = this.field(card.field);
        return value
          ? [{ value, label: card.label ?? DEFAULT_LABELS[card.field] }]
          : [];
      });
    }
    return AUTO_FIELDS.flatMap(field => {
      const value = this.field(field);
      return value ? [{ value, label: DEFAULT_LABELS[field] }] : [];
    });
  }

  /** Bento cards with system-sourced titles resolved and empty cards dropped. */
  breakdown(): BentoCard[] {
    return this.project.technicalBreakdown
      .map(card =>
        card.titleSource?.type === 'system'
          ? { ...card, title: this.field(card.titleSource.field) ?? card.title }
          : card,
      )
      .filter(card => card.title?.trim());
  }
}

const YOUTUBE_ID = [
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/,
  /youtu\.be\/([\w-]{6,})/,
  /youtube\.com\/(?:embed|shorts|live)\/([\w-]{6,})/,
];

export const YouTube = {
  id(url: string | null | undefined): string | null {
    if (!url) return null;
    for (const re of YOUTUBE_ID) {
      const match = re.exec(url);
      if (match?.[1]) return match[1];
    }
    return null;
  },

  thumbnail(url: string | null | undefined): string | null {
    const id = YouTube.id(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  },

  /** Canonical watch URL: opens in the YouTube app or the browser. */
  watchUrl(url: string | null | undefined): string | null {
    const id = YouTube.id(url);
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  },
} as const;
