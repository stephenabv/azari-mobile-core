import type { PropertyClass } from '../calculation/SizingStrategy';
import type { EngineResult } from '../calculation/SolarMath';
import type { Phase, SolarPackage } from './types';

/**
 * Catalog packages that cover a computed requirement, preferred phase first,
 * then cheapest. Mirrors `findMatchingPackages` on the website.
 */
export class PackageMatcher {
  constructor(private readonly limit = 3) {}

  static preferredPhase(property: PropertyClass): Phase {
    return property === 'Residential' ? 'single' : 'three';
  }

  match(
    result: EngineResult,
    property: PropertyClass,
    catalog: readonly SolarPackage[],
  ): SolarPackage[] {
    const preferred = PackageMatcher.preferredPhase(property);
    const price = (p: SolarPackage) => p.totalPrice ?? Number.MAX_SAFE_INTEGER;
    return catalog
      .filter(
        p =>
          p.isActive &&
          p.solarKwp >= result.solarKwp &&
          p.inverterKw >= result.inverterKw &&
          (result.storageKwh === 0 || p.storageKwh >= result.storageKwh),
      )
      .sort(
        (a, b) =>
          Number(a.phase !== preferred) - Number(b.phase !== preferred) ||
          price(a) - price(b),
      )
      .slice(0, this.limit);
  }
}
