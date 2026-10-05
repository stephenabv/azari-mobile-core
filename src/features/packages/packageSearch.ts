import type { SolarPackage } from '../../domain/packages/types';

const normalize = (value: string) => value.trim().toLowerCase();

/** Text a shopper might type to find a package: name, sizes and component brands/models. */
function haystack(pkg: SolarPackage): string {
  return [
    pkg.name,
    `${pkg.solarKwp} kwp`,
    `${pkg.inverterKw} kw`,
    pkg.storageKwh > 0 ? `${pkg.storageKwh} kwh` : '',
    ...pkg.components.flatMap(line => [
      line.component.brand,
      line.component.model,
      line.component.name,
    ]),
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Client-side search over already loaded packages. Every word must match
 * somewhere, so "sofar 6" narrows to Sofar packages around 6 kW.
 */
export function searchPackages(
  packages: readonly SolarPackage[],
  query: string,
): readonly SolarPackage[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return packages;
  return packages.filter(pkg => {
    const text = haystack(pkg);
    return terms.every(term => text.includes(term));
  });
}
