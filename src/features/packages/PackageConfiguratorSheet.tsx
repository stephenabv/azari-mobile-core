import React, { useState, type Dispatch, type SetStateAction } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PackageConfigurator } from '../../domain/packages/PackageConfigurator';
import type { PackageComponentLine } from '../../domain/packages/types';
import { Units } from '../../domain/units/Units';
import {
  AppText,
  Badge,
  Button,
  RemoteImage,
  Stepper,
  type StepperProps,
} from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

type Quantities = ReturnType<PackageConfigurator['defaults']>;
type Specs = ReturnType<PackageConfigurator['liveSpecs']>;

export interface PackageConfiguratorSheetProps {
  visible: boolean;
  onClose: () => void;
  config: PackageConfigurator;
  qty: Quantities;
  setQty: Dispatch<SetStateAction<Quantities>>;
  specs: Specs;
  price: number | null;
  savings: { min: number; max: number };
  onInquire: () => void;
}

type SheetStepper = StepperProps & { key: string };

/** Width of the docked detail panel on expanded (landscape tablet) screens. */
const PANEL_WIDTH = 380;

const describe = (line: PackageComponentLine | null, spec?: string) =>
  [
    [line?.component.brand, line?.component.model].filter(Boolean).join(' '),
    spec,
  ]
    .filter(Boolean)
    .join(' | ') || undefined;

/**
 * Bottom sheet holding the website's customise-your-system controls, the
 * feature list and the full component breakdown for one package.
 */
export function PackageConfiguratorSheet({
  visible,
  onClose,
  config,
  qty,
  setQty,
  specs,
  price,
  savings,
  onInquire,
}: PackageConfiguratorSheetProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { contentWidth, gutter, size } = useResponsive();
  // Wide tablets show the sheet as a detail panel docked to the right edge.
  const docked = size === 'expanded';
  const [expanded, setExpanded] = useState(false);
  const { pkg, inverterLine, batteryLine, panelLine } = config;
  const bounds = config.bounds(qty.inverter);

  const inverterStepper: SheetStepper = {
    key: 'inverter',
    label: 'Inverter',
    detail: describe(
      inverterLine,
      inverterLine
        ? Units.power(inverterLine.component.loadCapacityKw)
        : undefined,
    ),
    value: qty.inverter,
    ...bounds.inverter,
    onDecrement: () => setQty(q => config.bumpInverter(q, -1)),
    onIncrement: () => setQty(q => config.bumpInverter(q, 1)),
  };
  const batteryStepper: SheetStepper = {
    key: 'batteries',
    label: 'Battery',
    detail: describe(
      batteryLine,
      batteryLine
        ? Units.energy(batteryLine.component.storageCapacityKwh)
        : undefined,
    ),
    value: qty.batteries,
    ...bounds.batteries,
    onDecrement: () => setQty(q => config.bump(q, 'batteries', -1)),
    onIncrement: () => setQty(q => config.bump(q, 'batteries', 1)),
  };
  const panelStepper: SheetStepper = {
    key: 'panels',
    label: 'Solar Panel',
    detail: describe(
      panelLine,
      panelLine
        ? Units.panelWatts(panelLine.component.productionCapacityKwp)
        : undefined,
    ),
    value: qty.panels,
    ...bounds.panels,
    onDecrement: () => setQty(q => config.bump(q, 'panels', -1)),
    onIncrement: () => setQty(q => config.bump(q, 'panels', 1)),
  };
  const steppers = [
    inverterStepper,
    ...(config.isHybrid ? [batteryStepper] : []),
    panelStepper,
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType={docked ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.root, docked && styles.rootDocked]}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close package details"
        />
        <View
          style={
            docked
              ? [styles.sheet, styles.docked, { paddingTop: insets.top }]
              : [
                  styles.sheet,
                  { width: Math.min(contentWidth + gutter * 2, 600) },
                ]
          }
          accessibilityViewIsModal
        >
          {docked ? null : <View style={styles.grabber} />}
          <View style={styles.header}>
            <View style={styles.headerText}>
              {pkg.ipRating ? (
                <Badge label={pkg.ipRating.code} tone="muted" />
              ) : null}
              <AppText variant="title" accessibilityRole="header">
                {config.displayName}
              </AppText>
              <AppText variant="caption" tone="muted">
                {`${Units.power(specs.inverterKw)} System`}
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.close}
            >
              <Icon name="close" size={16} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FadeIn index={0} style={styles.priceRow}>
              {price != null ? (
                <AppText variant="display" tone="accent">
                  {Units.peso(price)}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="muted">
                {`Approx. Monthly Saving: ${Units.peso(
                  savings.min,
                  0,
                )} – ${Units.peso(savings.max, 0)}`}
              </AppText>
            </FadeIn>

            <FadeIn index={1} style={styles.block}>
              <AppText variant="heading">Customize your system</AppText>
              <View style={styles.panel}>
                {steppers.map(({ key, ...stepper }) => (
                  <Stepper key={key} {...stepper} />
                ))}
              </View>
            </FadeIn>

            <FadeIn index={2} style={styles.block}>
              <AppText variant="heading">What's included</AppText>
              {config.features(qty).map(feature => (
                <View key={feature} style={styles.feature}>
                  <View style={styles.tick}>
                    <Icon
                      name="check"
                      size={12}
                      color={theme.colors.accentText}
                      strokeWidth={2.6}
                    />
                  </View>
                  <AppText variant="label" style={styles.featureText}>
                    {feature}
                  </AppText>
                </View>
              ))}
            </FadeIn>

            <Button
              label={expanded ? 'Hide details' : 'See more details'}
              variant="ghost"
              compact
              icon={expanded ? undefined : 'chevronDown'}
              onPress={() => setExpanded(e => !e)}
              accessibilityHint="Shows the components in this package"
              style={styles.toggle}
            />
            {expanded ? (
              <PackageDetails config={config} qty={qty} specs={specs} />
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + theme.spacing(3) },
            ]}
          >
            <Button label="Inquire" icon="arrowRight" onPress={onInquire} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PackageDetails({
  config,
  qty,
  specs,
}: {
  config: PackageConfigurator;
  qty: Quantities;
  specs: Specs;
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
    <FadeIn style={styles.details}>
      {config.pkg.imageUrl ? (
        <RemoteImage
          source={config.pkg.imageUrl}
          aspectRatio={16 / 9}
          style={styles.image}
        />
      ) : null}
      <View style={styles.panel}>
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
      </View>
      {config.pkg.components.length ? (
        <AppText variant="heading" style={styles.componentsTitle}>
          Components
        </AppText>
      ) : null}
      <View style={styles.panel}>
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
    </FadeIn>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    rootDocked: { justifyContent: 'center', alignItems: 'flex-end' },
    backdrop: { backgroundColor: t.colors.overlay },
    sheet: {
      maxHeight: '88%',
      backgroundColor: t.colors.background,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      overflow: 'hidden',
    },
    docked: {
      width: PANEL_WIDTH,
      height: '100%',
      maxHeight: '100%',
      borderTopRightRadius: 0,
      borderBottomLeftRadius: t.radius.xl,
      justifyContent: 'space-between',
    },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.border,
      marginTop: t.spacing(2.5),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing(3),
      paddingHorizontal: t.spacing(5),
      paddingTop: t.spacing(3),
      paddingBottom: t.spacing(2),
    },
    headerText: { flex: 1, gap: t.spacing(1) },
    close: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
    },
    scroll: { flexGrow: 0 },
    scrollContent: {
      paddingHorizontal: t.spacing(5),
      paddingBottom: t.spacing(4),
      gap: t.spacing(4),
    },
    priceRow: { gap: t.spacing(1) },
    block: { gap: t.spacing(2) },
    panel: {
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceRaised,
      paddingHorizontal: t.spacing(3),
      paddingVertical: t.spacing(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing(2.5),
    },
    tick: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
    },
    featureText: { flex: 1, paddingTop: 1 },
    toggle: { alignSelf: 'flex-start', paddingHorizontal: 0 },
    details: { gap: t.spacing(2) },
    image: { borderRadius: t.radius.md },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: t.spacing(3),
      paddingVertical: t.spacing(1.5),
    },
    detailValue: { flexShrink: 1, textAlign: 'right' },
    componentsTitle: { marginTop: t.spacing(2) },
    componentName: { flex: 1 },
    footer: {
      paddingHorizontal: t.spacing(5),
      paddingTop: t.spacing(3),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.background,
    },
  });
