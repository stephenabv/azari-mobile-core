import { SOLAR_CONSTANTS } from '../calculation/SolarConstants';
import { SolarMath } from '../calculation/SolarMath';
import { Units } from '../units/Units';
import {
  COMPONENT_CATEGORY,
  type PackageComponentLine,
  type SolarPackage,
} from './types';

export interface Quantities {
  inverter: number;
  batteries: number;
  panels: number;
}

export interface QuantityBounds {
  inverter: { min: number; max: number };
  batteries: { min: number; max: number };
  panels: { min: number; max: number };
}

export interface SelectedComponent {
  brand: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number | null;
}

/** What the customer configured on a package card; sent with an inquiry. */
export interface PackageSelection {
  qty: Quantities;
  solarKwp: number;
  inverterKw: number;
  storageKwh: number;
  savings: { min: number; max: number };
  price: number | null;
  components: SelectedComponent[];
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * The customise-your-system rules of a package card, ported from the web
 * packages page: quantity bounds from inverter PV/battery limits, linked
 * accessory quantities, live specs and live pricing.
 */
export class PackageConfigurator {
  readonly inverterLine: PackageComponentLine | null;
  readonly batteryLine: PackageComponentLine | null;
  readonly panelLine: PackageComponentLine | null;

  constructor(readonly pkg: SolarPackage) {
    const find = (category: string) =>
      pkg.components.find(l => l.component.category === category) ?? null;
    this.inverterLine = find(COMPONENT_CATEGORY.inverter);
    this.batteryLine = find(COMPONENT_CATEGORY.battery);
    this.panelLine = find(COMPONENT_CATEGORY.panel);
  }

  get isHybrid(): boolean {
    return this.pkg.storageKwh > 0;
  }

  get displayName(): string {
    return this.inverterLine?.component.model || this.pkg.name;
  }

  defaults(): Quantities {
    return {
      inverter: this.inverterLine?.quantity ?? 1,
      batteries: this.batteryLine?.quantity ?? 0,
      panels: this.panelLine?.quantity ?? 1,
    };
  }

  bounds(inverterCount: number): QuantityBounds {
    const ic = this.inverterLine?.component;
    const bc = this.batteryLine?.component;
    const pc = this.panelLine?.component;
    const cfg = this.defaults();

    let panels: { min: number; max: number };
    if (ic?.pvMaxPower != null && pc && pc.productionCapacityKwp > 0) {
      const totalPvMin = (ic.pvMinPower ?? 0) * inverterCount;
      panels = {
        min:
          totalPvMin > 0 ? Math.ceil(totalPvMin / pc.productionCapacityKwp) : 1,
        max: Math.floor(
          (ic.pvMaxPower * inverterCount) / pc.productionCapacityKwp,
        ),
      };
    } else {
      const perInverter =
        ic && pc && pc.productionCapacityKwp > 0
          ? Math.floor(ic.loadCapacityKw / pc.productionCapacityKwp)
          : cfg.panels;
      panels = {
        min: 1,
        max: Math.max(cfg.panels, perInverter * inverterCount),
      };
    }

    let batteries: { min: number; max: number };
    if (ic?.batteryMaxCapacity != null && bc && bc.storageCapacityKwh > 0) {
      batteries = {
        min: 1,
        max: Math.max(
          1,
          Math.floor(
            (ic.batteryMaxCapacity * inverterCount) / bc.storageCapacityKwh,
          ),
        ),
      };
    } else {
      const perInverter =
        ic && bc && bc.storageCapacityKwh > 0
          ? Math.max(1, Math.floor(ic.loadCapacityKw / bc.storageCapacityKwh))
          : cfg.batteries;
      batteries = {
        min: bc ? 1 : 0,
        max: Math.max(bc ? 1 : 0, bc ? perInverter * inverterCount : 0),
      };
    }

    return {
      inverter: {
        min: cfg.inverter,
        max: Math.max(cfg.inverter, ic?.parallelMax ?? cfg.inverter),
      },
      batteries,
      panels,
    };
  }

  /** Changing inverters scales batteries and panels proportionally, within the new bounds. */
  bumpInverter(qty: Quantities, delta: number): Quantities {
    const current = this.bounds(qty.inverter);
    const inverter = clamp(
      qty.inverter + delta,
      current.inverter.min,
      current.inverter.max,
    );
    if (inverter === qty.inverter) return qty;

    const next = this.bounds(inverter);
    const cfg = this.defaults();
    const scale = (
      base: number,
      fallback: number,
      line: PackageComponentLine | null,
      b: { min: number; max: number },
    ) =>
      line && cfg.inverter > 0
        ? clamp(Math.round((base * inverter) / cfg.inverter), b.min, b.max)
        : clamp(fallback, b.min, b.max);

    return {
      inverter,
      batteries: scale(
        cfg.batteries,
        qty.batteries,
        this.batteryLine,
        next.batteries,
      ),
      panels: scale(cfg.panels, qty.panels, this.panelLine, next.panels),
    };
  }

  bump(
    qty: Quantities,
    part: 'batteries' | 'panels',
    delta: number,
  ): Quantities {
    const b = this.bounds(qty.inverter)[part];
    return { ...qty, [part]: clamp(qty[part] + delta, b.min, b.max) };
  }

  liveSpecs(qty: Quantities): {
    inverterKw: number;
    solarKwp: number;
    storageKwh: number;
  } {
    return {
      inverterKw:
        Math.round(
          (this.inverterLine?.component.loadCapacityKw ?? 0) *
            qty.inverter *
            10,
        ) / 10,
      solarKwp:
        Math.round(
          (this.panelLine?.component.productionCapacityKwp ?? 0) *
            qty.panels *
            100,
        ) / 100,
      storageKwh:
        Math.round(
          (this.batteryLine?.component.storageCapacityKwh ?? 0) *
            qty.batteries *
            100,
        ) / 100,
    };
  }

  /** Quantity of a line given the customer's core quantities (accessories follow their base). */
  effectiveQuantity(line: PackageComponentLine, qty: Quantities): number {
    const core = (l: PackageComponentLine) => {
      switch (l.component.category) {
        case COMPONENT_CATEGORY.inverter:
          return qty.inverter;
        case COMPONENT_CATEGORY.battery:
          return qty.batteries;
        case COMPONENT_CATEGORY.panel:
          return qty.panels;
        default:
          return l.quantity;
      }
    };
    if (line.baseComponentId) {
      const base = this.pkg.components.find(
        p => p.componentId === line.baseComponentId && !p.baseComponentId,
      );
      if (!base) return line.quantity;
      return Math.max(1, Math.ceil(core(base) * (line.multiplier ?? 1)));
    }
    return core(line);
  }

  /** Live total, or null when any component has no public price. */
  price(qty: Quantities): number | null {
    if (!this.pkg.components.length) return this.pkg.totalPrice;
    let total = 0;
    for (const line of this.pkg.components) {
      const { pricingEnabled, unitPrice } = line.component;
      if (!pricingEnabled || unitPrice === null) return null;
      total += this.effectiveQuantity(line, qty) * unitPrice;
    }
    return total;
  }

  features(qty: Quantities): string[] {
    if (this.pkg.mainFeatures.length) return this.pkg.mainFeatures;
    const { inverterKw, solarKwp, storageKwh } = this.liveSpecs(qty);
    const dailyKwh =
      Math.round(solarKwp * SOLAR_CONSTANTS.dailyYieldPerKwp * 10) / 10;
    const list = [
      `${this.isHybrid ? 'Hybrid' : 'Grid Tied'} System`,
      'Mobile Device Monitoring',
      `${Units.power(inverterKw)} ${
        this.isHybrid ? 'Load Capacity' : 'System Capacity'
      }`,
      `${dailyKwh} kWh/day Production Capacity`,
    ];
    if (this.isHybrid)
      list.push(`${Units.energy(storageKwh)} Storage Capacity`);
    return list;
  }

  selection(qty: Quantities): PackageSelection {
    const specs = this.liveSpecs(qty);
    const savings = SolarMath.packageSavings(specs.solarKwp);
    return {
      qty,
      ...specs,
      savings: { min: savings.min, max: savings.max },
      price: this.price(qty) ?? this.pkg.totalPrice,
      components: this.pkg.components.map(line => ({
        brand: line.component.brand,
        name: line.component.name,
        category: line.component.category,
        quantity: this.effectiveQuantity(line, qty),
        unitPrice: line.component.pricingEnabled
          ? line.component.unitPrice
          : null,
      })),
    };
  }

  /** Non-core components for the details sheet, in the website's order. */
  otherComponents(): PackageComponentLine[] {
    const core: readonly string[] = Object.values(COMPONENT_CATEGORY);
    const order: Record<string, number> = {
      'Mounting & Racking': 0,
      'Wiring & Protection': 1,
      Monitoring: 2,
    };
    return this.pkg.components
      .filter(l => !core.includes(l.component.category))
      .sort(
        (a, b) =>
          (order[a.component.category] ?? 3) -
          (order[b.component.category] ?? 3),
      );
  }
}

export interface PackageGroup {
  label: string;
  packages: SolarPackage[];
}

/** Recommended first, then admin sort order, then newest; split hybrid / grid-tied. */
export function groupPackages(
  packages: readonly SolarPackage[],
  phase: SolarPackage['phase'],
): PackageGroup[] {
  const active = packages
    .filter(p => p.phase === phase && p.isActive)
    .sort(
      (a, b) =>
        Number(b.isRecommended) - Number(a.isRecommended) ||
        (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  const phaseLabel = phase === 'three' ? 'Three Phase' : 'Single Phase';
  return [
    {
      label: `${phaseLabel} · Hybrid`,
      packages: active.filter(p => p.storageKwh > 0),
    },
    {
      label: `${phaseLabel} · Grid-Tied`,
      packages: active.filter(p => p.storageKwh === 0),
    },
  ].filter(g => g.packages.length > 0);
}
