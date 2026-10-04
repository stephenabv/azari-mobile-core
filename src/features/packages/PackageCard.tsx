import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  PackageConfigurator,
  type PackageSelection,
} from '../../domain/packages/PackageConfigurator';
import type {
  PackageComponentLine,
  SolarPackage,
} from '../../domain/packages/types';
import { SolarMath } from '../../domain/calculation/SolarMath';
import { Units } from '../../domain/units/Units';
import {
  AppText,
  Badge,
  Button,
  Card,
  RemoteImage,
  Stepper,
} from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export interface PackageCardProps {
  pkg: SolarPackage;
  onInquire: (selection: PackageSelection) => void;
}

const describe = (line: PackageComponentLine | null, spec?: string) =>
  [
    [line?.component.brand, line?.component.model].filter(Boolean).join(' '),
    spec,
  ]
    .filter(Boolean)
    .join(' | ') || undefined;

/** One package with the website's customise-your-system controls and live pricing. */
export function PackageCard({ pkg, onInquire }: PackageCardProps) {
  const styles = useThemedStyles(createStyles);
  const config = useMemo(() => new PackageConfigurator(pkg), [pkg]);
  const [qty, setQty] = useState(() => config.defaults());
  const [expanded, setExpanded] = useState(false);

  const bounds = config.bounds(qty.inverter);
  const specs = config.liveSpecs(qty);
  const price = config.price(qty) ?? pkg.totalPrice;
  const savings = SolarMath.packageSavings(specs.solarKwp);
  const { inverterLine, batteryLine, panelLine } = config;

  return (
    <Card highlighted={pkg.isRecommended} testID={`package-${pkg.id}`}>
      <View style={styles.badges}>
        {pkg.isRecommended ? <Badge label="Recommended" /> : null}
        {pkg.ipRating ? <Badge label={pkg.ipRating.code} tone="muted" /> : null}
      </View>
      <AppText variant="heading">{config.displayName}</AppText>
      {price != null ? (
        <AppText variant="title" tone="accent">
          {Units.peso(price)}
        </AppText>
      ) : null}
      <AppText variant="label">{`${Units.power(
        specs.inverterKw,
      )} System`}</AppText>
      <AppText variant="caption" tone="muted">
        {`Approx. Monthly Saving: ${Units.peso(savings.min, 0)} – ${Units.peso(
          savings.max,
          0,
        )}`}
      </AppText>
      <Button
        label="Inquire"
        style={styles.inquire}
        onPress={() => onInquire(config.selection(qty))}
      />

      <View style={styles.divider} />
      {config.features(qty).map(feature => (
        <AppText
          key={feature}
          style={styles.feature}
        >{`✓  ${feature}`}</AppText>
      ))}
      <AppText variant="caption" tone="muted" style={styles.note}>
        *You can customize your system
      </AppText>

      <Stepper
        label="Inverter"
        detail={describe(
          inverterLine,
          inverterLine
            ? Units.power(inverterLine.component.loadCapacityKw)
            : undefined,
        )}
        value={qty.inverter}
        {...bounds.inverter}
        onDecrement={() => setQty(q => config.bumpInverter(q, -1))}
        onIncrement={() => setQty(q => config.bumpInverter(q, 1))}
      />
      {config.isHybrid ? (
        <Stepper
          label="Battery"
          detail={describe(
            batteryLine,
            batteryLine
              ? Units.energy(batteryLine.component.storageCapacityKwh)
              : undefined,
          )}
          value={qty.batteries}
          {...bounds.batteries}
          onDecrement={() => setQty(q => config.bump(q, 'batteries', -1))}
          onIncrement={() => setQty(q => config.bump(q, 'batteries', 1))}
        />
      ) : null}
      <Stepper
        label="Solar Panel"
        detail={describe(
          panelLine,
          panelLine
            ? Units.panelWatts(panelLine.component.productionCapacityKwp)
            : undefined,
        )}
        value={qty.panels}
        {...bounds.panels}
        onDecrement={() => setQty(q => config.bump(q, 'panels', -1))}
        onIncrement={() => setQty(q => config.bump(q, 'panels', 1))}
      />

      <Button
        label={expanded ? 'Hide details' : 'See more details'}
        variant="ghost"
        compact
        onPress={() => setExpanded(e => !e)}
        accessibilityHint="Shows the components in this package"
      />
      {expanded ? (
        <PackageDetails config={config} qty={qty} specs={specs} />
      ) : null}
    </Card>
  );
}

function PackageDetails({
  config,
  qty,
  specs,
}: {
  config: PackageConfigurator;
  qty: ReturnType<PackageConfigurator['defaults']>;
  specs: ReturnType<PackageConfigurator['liveSpecs']>;
}) {
  const styles = useThemedStyles(createStyles);
  const rows: Array<[string, string]> = [
    ['Phase', config.pkg.phase === 'three' ? 'Three Phase' : 'Single Phase'],
    ['Solar capacity', `${specs.solarKwp} kWp`],
    ['Inverter capacity', Units.power(specs.inverterKw)],
    ...(config.isHybrid
      ? [
          ['Storage capacity', Units.energy(specs.storageKwh)] as [
            string,
            string,
          ],
        ]
      : []),
    ...(config.pkg.ipRating
      ? [
          [
            'IP rating',
            `${config.pkg.ipRating.code} · ${config.pkg.ipRating.description}`,
          ] as [string, string],
        ]
      : []),
  ];
  return (
    <View style={styles.details}>
      {config.pkg.imageUrl ? (
        <RemoteImage
          source={config.pkg.imageUrl}
          aspectRatio={16 / 9}
          style={styles.image}
        />
      ) : null}
      {rows.map(([label, value]) => (
        <View key={label} style={styles.detailRow}>
          <AppText variant="caption" tone="muted">
            {label}
          </AppText>
          <AppText variant="label" style={styles.detailValue}>
            {value}
          </AppText>
        </View>
      ))}
      {config.pkg.components.length ? (
        <AppText variant="label" style={styles.componentsTitle}>
          Components
        </AppText>
      ) : null}
      {config.pkg.components.map(line => (
        <View key={line.componentId} style={styles.detailRow}>
          <AppText variant="caption" style={styles.componentName}>
            {`${line.component.brand} ${line.component.name}`.trim()}
          </AppText>
          <AppText
            variant="caption"
            tone="muted"
          >{`× ${config.effectiveQuantity(line, qty)}`}</AppText>
        </View>
      ))}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    badges: {
      flexDirection: 'row',
      gap: t.spacing(2),
      marginBottom: t.spacing(2),
      minHeight: 20,
    },
    inquire: { marginTop: t.spacing(3) },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.border,
      marginVertical: t.spacing(4),
    },
    feature: { marginBottom: t.spacing(1) },
    note: { marginVertical: t.spacing(2) },
    details: { marginTop: t.spacing(2), gap: t.spacing(1.5) },
    image: { borderRadius: t.radius.md, marginBottom: t.spacing(2) },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: t.spacing(3),
    },
    detailValue: { flexShrink: 1, textAlign: 'right' },
    componentsTitle: { marginTop: t.spacing(2) },
    componentName: { flex: 1 },
  });
