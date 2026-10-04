import { InverterBrandCatalog } from '../packages/InverterBrandCatalog';
import {
  PackageConfigurator,
  groupPackages,
} from '../packages/PackageConfigurator';
import {
  CompositePackageFilter,
  InverterBrandFilter,
} from '../packages/PackageFilter';
import { PackageMatcher } from '../packages/PackageMatcher';
import { hybridPackage } from '../../__tests__/support/packages';

describe('PackageConfigurator', () => {
  const config = new PackageConfigurator(hybridPackage());

  it('derives bounds from inverter PV and battery limits', () => {
    expect(config.bounds(1)).toEqual({
      inverter: { min: 1, max: 3 },
      batteries: { min: 1, max: 4 },
      panels: { min: 5, max: 20 },
    });
  });

  it('scales batteries and panels with the inverter count', () => {
    const next = config.bumpInverter(config.defaults(), 1);
    expect(next).toEqual({ inverter: 2, batteries: 2, panels: 28 });
    expect(config.bumpInverter(next, -1)).toEqual(config.defaults());
  });

  it('clamps manual changes to the bounds', () => {
    const qty = config.defaults();
    expect(config.bump({ ...qty, panels: 20 }, 'panels', 1).panels).toBe(20);
    expect(config.bump(qty, 'batteries', -1).batteries).toBe(1);
  });

  it('prices every line, with accessories following their base quantity', () => {
    const qty = config.defaults();
    // 100k + 80k + 14×5k + ceil(14×0.5)=7×500
    expect(config.price(qty)).toBe(100000 + 80000 + 70000 + 3500);
  });

  it('returns no live price when any component hides its price', () => {
    const pkg = hybridPackage();
    pkg.components[0]!.component.pricingEnabled = false;
    expect(
      new PackageConfigurator(pkg).price({
        inverter: 1,
        batteries: 1,
        panels: 14,
      }),
    ).toBeNull();
  });

  it('generates features when the admin set none', () => {
    expect(config.features(config.defaults())).toEqual([
      'Hybrid System',
      'Mobile Device Monitoring',
      '6 kW Load Capacity',
      '25.2 kWh/day Production Capacity',
      '5 kWh Storage Capacity',
    ]);
  });
});

describe('groupPackages', () => {
  it('puts recommended first and splits hybrid from grid-tied', () => {
    const groups = groupPackages(
      [
        hybridPackage({ id: 'a', sortOrder: 1 }),
        hybridPackage({ id: 'b', sortOrder: 2, isRecommended: true }),
        hybridPackage({ id: 'c', storageKwh: 0 }),
        hybridPackage({ id: 'd', phase: 'three' }),
        hybridPackage({ id: 'e', isActive: false }),
      ],
      'single',
    );
    expect(groups.map(g => [g.label, g.packages.map(p => p.id)])).toEqual([
      ['Single Phase · Hybrid', ['b', 'a']],
      ['Single Phase · Grid-Tied', ['c']],
    ]);
  });
});

describe('inverter brand filter', () => {
  const packages = [
    hybridPackage({ id: 'a' }, 'Sofar'),
    hybridPackage({ id: 'b' }, ' SOFAR '),
    hybridPackage({ id: 'c' }, 'Deye'),
  ];

  it('lists brands from live data, decorated and ordered by admin content', () => {
    const catalog = new InverterBrandCatalog(
      { items: [{ name: 'Deye', logoUrl: '/deye.png', order: 0 }] },
      url => `https://cdn${url}`,
    );
    expect(catalog.optionsFor(packages)).toEqual([
      {
        key: 'deye',
        label: 'Deye',
        logoUrl: 'https://cdn/deye.png',
        packageCount: 1,
      },
      { key: 'sofar', label: 'Sofar', logoUrl: null, packageCount: 2 },
    ]);
  });

  it('matches brands case- and space-insensitively; empty means all', () => {
    expect(
      new CompositePackageFilter([new InverterBrandFilter('sofar')])
        .apply(packages)
        .map(p => p.id),
    ).toEqual(['a', 'b']);
    expect(
      new CompositePackageFilter([new InverterBrandFilter(null)]).apply(
        packages,
      ),
    ).toHaveLength(3);
  });
});

describe('PackageMatcher', () => {
  it('returns covering packages, preferred phase first then cheapest', () => {
    const catalog = [
      hybridPackage({ id: 'three-cheap', phase: 'three', totalPrice: 100 }),
      hybridPackage({ id: 'single-dear', totalPrice: 500 }),
      hybridPackage({ id: 'single-cheap', totalPrice: 200 }),
      hybridPackage({ id: 'too-small', solarKwp: 1 }),
    ];
    const result = {
      solarKwp: 5,
      inverterKw: 6,
      storageKwh: 5,
      systemType: 'hybrid' as const,
    };
    expect(
      new PackageMatcher().match(result, 'Residential', catalog).map(p => p.id),
    ).toEqual(['single-cheap', 'single-dear', 'three-cheap']);
  });
});
