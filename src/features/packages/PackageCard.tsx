import React, { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  PackageConfigurator,
  type PackageSelection,
} from '../../domain/packages/PackageConfigurator';
import type { SolarPackage } from '../../domain/packages/types';
import { SolarMath } from '../../domain/calculation/SolarMath';
import { Units } from '../../domain/units/Units';
import { AppText, Badge, RemoteImage } from '../../ui/components';
import { SunRays } from '../../ui/brand';
import { Icon } from '../../ui/icons';
import { PressableScale, Shimmer } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';
import { PackageConfiguratorSheet } from './PackageConfiguratorSheet';

export interface PackageCardProps {
  pkg: SolarPackage;
  onInquire: (selection: PackageSelection) => void;
}

const MEDIA_HEIGHT = 112;

/**
 * Shop-style product tile. Tapping it opens the configurator sheet with the
 * website's customise-your-system controls; the round button inquires with
 * the current configuration. Price and specs update live with the sheet.
 */
export function PackageCard({ pkg, onInquire }: PackageCardProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const config = useMemo(() => new PackageConfigurator(pkg), [pkg]);
  const [qty, setQty] = useState(() => config.defaults());
  const [open, setOpen] = useState(false);
  const [mediaWidth, setMediaWidth] = useState(0);

  const specs = config.liveSpecs(qty);
  const price = config.price(qty) ?? pkg.totalPrice;
  const savings = SolarMath.packageSavings(specs.solarKwp);
  const name = config.displayName;
  const specLine = [
    `${specs.solarKwp} kWp`,
    config.isHybrid ? Units.energy(specs.storageKwh) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const inquire = () => onInquire(config.selection(qty));
  const onMediaLayout = (event: LayoutChangeEvent) =>
    setMediaWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <View
      style={[styles.shadow, pkg.isRecommended && styles.recommended]}
      testID={`package-${pkg.id}`}
    >
      <View style={styles.card}>
        <PressableScale
          onPress={() => setOpen(true)}
          pressedScale={0.98}
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${Units.power(
            specs.inverterKw,
          )} system`}
          accessibilityHint="Opens customization and package details"
          style={styles.main}
        >
          <View style={styles.media} onLayout={onMediaLayout}>
            {pkg.imageUrl ? (
              <RemoteImage source={pkg.imageUrl} style={styles.image} />
            ) : (
              <View style={styles.rays}>
                <SunRays size={96} color={theme.colors.sun} rayOpacity={0.35} />
              </View>
            )}
            {pkg.isRecommended && mediaWidth > 0 ? (
              <Shimmer
                width={mediaWidth}
                style={[styles.sheen, { width: mediaWidth * 0.4 }]}
              />
            ) : null}
            <View style={styles.badges}>
              {pkg.isRecommended ? (
                <Badge label="Recommended" tone="sun" />
              ) : (
                <View />
              )}
              {pkg.ipRating ? (
                <Badge label={pkg.ipRating.code} tone="muted" />
              ) : null}
            </View>
          </View>
          <View style={styles.body}>
            <AppText variant="label" numberOfLines={2} style={styles.name}>
              {name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {`${Units.power(specs.inverterKw)} System`}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {specLine}
            </AppText>
            <AppText variant="caption" tone="success" numberOfLines={2}>
              {`Saves ${Units.peso(savings.min, 0)}–${Units.peso(
                savings.max,
                0,
              )}/mo`}
            </AppText>
            <View style={styles.customize}>
              <AppText variant="caption" tone="accent" style={styles.bold}>
                Customize
              </AppText>
              <Icon
                name="chevronRight"
                size={12}
                color={theme.colors.accentText}
                strokeWidth={2.4}
              />
            </View>
          </View>
        </PressableScale>

        <View style={styles.footer}>
          {price != null ? (
            <AppText
              style={styles.price}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {Units.peso(price, 0)}
            </AppText>
          ) : (
            <View style={styles.flex} />
          )}
          <PressableScale
            onPress={inquire}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Inquire about ${name}`}
            style={styles.inquire}
          >
            <Icon
              name="arrowRight"
              size={16}
              color={theme.colors.onNight}
              strokeWidth={2.4}
            />
          </PressableScale>
        </View>
      </View>

      {open ? (
        <PackageConfiguratorSheet
          visible={open}
          onClose={() => setOpen(false)}
          config={config}
          qty={qty}
          setQty={setQty}
          specs={specs}
          price={price}
          savings={savings}
          onInquire={() => {
            setOpen(false);
            inquire();
          }}
        />
      ) : null}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    shadow: {
      flex: 1,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    recommended: { borderWidth: 1.5, borderColor: t.colors.accent },
    card: { flex: 1, borderRadius: t.radius.lg, overflow: 'hidden' },
    main: { flex: 1 },
    media: {
      height: MEDIA_HEIGHT,
      backgroundColor: t.colors.night,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 0,
    },
    rays: { opacity: 0.9 },
    sheen: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    badges: {
      position: 'absolute',
      top: t.spacing(2.5),
      left: t.spacing(2.5),
      right: t.spacing(2.5),
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: t.spacing(1),
    },
    body: { padding: t.spacing(3), paddingBottom: 0, gap: 2 },
    name: { fontFamily: FONTS.bold, marginBottom: 2 },
    customize: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: t.spacing(1),
    },
    bold: { fontFamily: FONTS.semibold },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing(2),
      padding: t.spacing(3),
      paddingTop: t.spacing(2),
    },
    flex: { flex: 1 },
    price: {
      flex: 1,
      fontFamily: FONTS.displayHeavy,
      fontSize: 14,
      lineHeight: 18,
      color: t.colors.accentText,
    },
    inquire: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.night,
    },
  });
