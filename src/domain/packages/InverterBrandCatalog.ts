import { normalizeAttribute } from './PackageFilter';
import { COMPONENT_CATEGORY, type SolarPackage } from './types';

/** Admin-managed display metadata (site content key `inverter-brands`). */
export interface InverterBrandMeta {
  name: string;
  logoUrl: string;
  order: number;
}

export interface InverterBrandsContent {
  items: InverterBrandMeta[];
}

export const DEFAULT_INVERTER_BRANDS_CONTENT: InverterBrandsContent = {
  items: [],
};

/** One selectable brand on the packages screen. */
export interface BrandOption {
  /** Normalised key used for matching. */
  key: string;
  label: string;
  logoUrl: string | null;
  packageCount: number;
}

/**
 * Builds the brand list from live package data, so a new brand appears as
 * soon as a package uses its inverter, with no app update. Admin metadata only
 * decorates brands that exist (logo, label, order). Ported from azari-client.
 */
export class InverterBrandCatalog {
  private readonly meta: ReadonlyMap<string, InverterBrandMeta>;

  constructor(
    content: InverterBrandsContent | null | undefined,
    private readonly resolveLogo: (url: string) => string | null,
  ) {
    const items = Array.isArray(content?.items) ? content.items : [];
    this.meta = new Map(items.map(m => [normalizeAttribute(m.name), m]));
  }

  optionsFor(packages: readonly SolarPackage[]): BrandOption[] {
    const counts = new Map<string, { label: string; count: number }>();

    for (const pkg of packages) {
      if (!pkg.isActive) continue;
      const brands = new Set(
        pkg.components
          .filter(
            line => line.component.category === COMPONENT_CATEGORY.inverter,
          )
          .map(line => line.component.brand?.trim())
          .filter((b): b is string => !!b),
      );
      for (const brand of brands) {
        const key = normalizeAttribute(brand);
        const entry = counts.get(key);
        if (entry) entry.count += 1;
        else counts.set(key, { label: brand, count: 1 });
      }
    }

    const orderOf = (key: string) =>
      this.meta.get(key)?.order ?? Number.MAX_SAFE_INTEGER;

    return [...counts.entries()]
      .map(([key, { label, count }]): BrandOption => {
        const meta = this.meta.get(key);
        return {
          key,
          label: meta?.name.trim() || label,
          logoUrl: meta?.logoUrl ? this.resolveLogo(meta.logoUrl) : null,
          packageCount: count,
        };
      })
      .sort(
        (a, b) =>
          orderOf(a.key) - orderOf(b.key) || a.label.localeCompare(b.label),
      );
  }
}
