import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PackageConfigurator } from '../../domain/packages/PackageConfigurator';
import type { SolarPackage } from '../../domain/packages/types';
import { Units } from '../../domain/units/Units';
import {
  AppText,
  Badge,
  Card,
  RemoteImage,
  Section,
  Skeleton,
} from '../../ui/components';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BleedRow } from './BleedRow';
import type { HomeSectionProps } from './sections';

const MAX_ITEMS = 8;
const GAP = 14;

interface CarouselItem {
  pkg: SolarPackage;
  name: string;
  price: number | null;
  specs: string[];
}

function toItem(pkg: SolarPackage): CarouselItem {
  const config = new PackageConfigurator(pkg);
  return {
    pkg,
    name: config.displayName,
    price: config.price(config.defaults()) ?? pkg.totalPrice,
    specs: [
      `${pkg.solarKwp} kWp`,
      ...(pkg.storageKwh > 0 ? [Units.energy(pkg.storageKwh)] : []),
      pkg.phase === 'three' ? 'Three phase' : 'Single phase',
    ],
  };
}

/** Recommended first, then the admin sort order. */
function byPriority(a: SolarPackage, b: SolarPackage): number {
  if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
  return (
    (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
    (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
  );
}

/** Horizontal, snapping carousel of active packages; "See all" opens the Packages tab. */
export function PackageCarousel({ actions, packages }: HomeSectionProps) {
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  const cardWidth = size === 'compact' ? 224 : 260;

  const items = useMemo(
    () =>
      packages.items
        .filter(p => p.isActive)
        .sort(byPriority)
        .slice(0, MAX_ITEMS)
        .map(toItem),
    [packages.items],
  );

  if (!packages.loading && !items.length) return null;
  const width = { width: cardWidth };

  return (
    <Section
      title="Solar packages"
      action={{ label: 'See all', onPress: actions.openPackages }}
    >
      <BleedRow gap={GAP} snapInterval={cardWidth + GAP}>
        {packages.loading && !items.length
          ? [0, 1].map(i => (
              <View key={i} style={width}>
                <Skeleton height={210} radius={22} />
              </View>
            ))
          : items.map((item, index) => (
              <FadeIn
                key={item.pkg.id}
                index={index}
                direction="left"
                style={width}
              >
                <Card
                  onPress={actions.openPackages}
                  accessibilityLabel={`${item.name} package`}
                  accessibilityHint="Opens the package catalog"
                  style={styles.card}
                >
                  <View>
                    <RemoteImage
                      source={item.pkg.imageUrl}
                      aspectRatio={16 / 9}
                      resizeMode="cover"
                    />
                    <View style={styles.badges}>
                      {item.pkg.isRecommended ? (
                        <Badge label="Recommended" />
                      ) : null}
                      {item.pkg.ipRating ? (
                        <Badge label={item.pkg.ipRating.code} tone="sun" />
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.body}>
                    <AppText variant="heading" numberOfLines={1}>
                      {item.name}
                    </AppText>
                    <View style={styles.specs}>
                      {item.specs.map(spec => (
                        <View key={spec} style={styles.spec}>
                          <AppText variant="caption">{spec}</AppText>
                        </View>
                      ))}
                    </View>
                    {item.price != null ? (
                      <AppText variant="title" tone="accent">
                        {Units.peso(item.price, 0)}
                      </AppText>
                    ) : null}
                  </View>
                </Card>
              </FadeIn>
            ))}
      </BleedRow>
    </Section>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    card: { padding: 0, overflow: 'hidden', flex: 1 },
    badges: {
      position: 'absolute',
      left: t.spacing(3),
      top: t.spacing(3),
      flexDirection: 'row',
      gap: t.spacing(1.5),
    },
    body: { padding: t.spacing(3.5), gap: t.spacing(2) },
    specs: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing(1.5) },
    spec: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.sm - 2,
      paddingHorizontal: t.spacing(2),
      paddingVertical: t.spacing(1),
    },
  });
