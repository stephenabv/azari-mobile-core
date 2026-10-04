import {
  COMPONENT_CATEGORY,
  type SolarComponent,
  type SolarPackage,
} from './types';

/**
 * A predicate over public packages. Filters are composable and stateless, so a
 * new criterion (battery brand, price band, …) is a new implementation and the
 * packages screen does not change. Ported from azari-client.
 */
export interface PackageFilter {
  /** False when the filter would match everything (e.g. "All brands"). */
  readonly isActive: boolean;
  matches(pkg: SolarPackage): boolean;
}

/** "Sofar", " SOFAR " and "sofar" compare equal. */
export function normalizeAttribute(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Matches packages whose component of one category has the selected attribute value. */
export abstract class ComponentAttributeFilter implements PackageFilter {
  private readonly selected: string;

  protected constructor(
    private readonly category: string,
    selected: string | null | undefined,
  ) {
    this.selected = normalizeAttribute(selected);
  }

  protected abstract attributeOf(
    component: SolarComponent,
  ): string | null | undefined;

  get isActive(): boolean {
    return this.selected.length > 0;
  }

  matches(pkg: SolarPackage): boolean {
    if (!this.isActive) return true;
    return pkg.components.some(
      line =>
        line.component.category === this.category &&
        normalizeAttribute(this.attributeOf(line.component)) === this.selected,
    );
  }
}

export class InverterBrandFilter extends ComponentAttributeFilter {
  constructor(brand: string | null | undefined) {
    super(COMPONENT_CATEGORY.inverter, brand);
  }

  protected attributeOf(component: SolarComponent): string {
    return component.brand;
  }
}

export class PhaseFilter implements PackageFilter {
  readonly isActive = true;

  constructor(private readonly phase: SolarPackage['phase']) {}

  matches(pkg: SolarPackage): boolean {
    return pkg.phase === this.phase;
  }
}

/** Matches when every active child filter matches. */
export class CompositePackageFilter implements PackageFilter {
  private readonly filters: readonly PackageFilter[];

  constructor(filters: readonly PackageFilter[]) {
    this.filters = filters.filter(f => f.isActive);
  }

  get isActive(): boolean {
    return this.filters.length > 0;
  }

  matches(pkg: SolarPackage): boolean {
    return this.filters.every(f => f.matches(pkg));
  }

  apply(packages: readonly SolarPackage[]): SolarPackage[] {
    return this.isActive
      ? packages.filter(p => this.matches(p))
      : [...packages];
  }
}
