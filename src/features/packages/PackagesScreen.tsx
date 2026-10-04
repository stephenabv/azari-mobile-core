import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { usePackages, useSiteContent } from '../../data/queries';
import { InverterBrandCatalog } from '../../domain/packages/InverterBrandCatalog';
import { groupPackages } from '../../domain/packages/PackageConfigurator';
import {
  CompositePackageFilter,
  InverterBrandFilter,
  normalizeAttribute,
} from '../../domain/packages/PackageFilter';
import type { Phase } from '../../domain/packages/types';
import type { TabScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Grid,
  Screen,
  Section,
  SegmentedControl,
  Skeleton,
} from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BrandFilter } from './BrandFilter';
import { PackageCard } from './PackageCard';

const PAGE_SIZE = 3;
const PHASES = [
  { value: 'single' as const, label: 'Single Phase' },
  { value: 'three' as const, label: 'Three Phase' },
];

export function PackagesScreen({
  navigation,
  route,
}: TabScreenProps<'Packages'>) {
  const styles = useThemedStyles(createStyles);
  const { media } = useServices();
  const packagesQuery = usePackages();
  const contentQuery = useSiteContent();
  const [phase, setPhase] = useState<Phase>('single');
  const [visible, setVisible] = useState<Record<string, number>>({});

  const packages = useMemo(
    () => packagesQuery.data ?? [],
    [packagesQuery.data],
  );
  const brandOptions = useMemo(
    () =>
      new InverterBrandCatalog(contentQuery.data?.get('inverter-brands'), url =>
        media.resolve(url),
      ).optionsFor(packages),
    [contentQuery.data, packages, media],
  );

  // Same rule as the website: an unknown ?brand= falls back to all brands.
  const requested = normalizeAttribute(route.params?.brand);
  const brand = brandOptions.some(o => o.key === requested) ? requested : null;
  const brandLabel = brandOptions.find(o => o.key === brand)?.label ?? '';

  const groups = useMemo(
    () =>
      groupPackages(
        new CompositePackageFilter([new InverterBrandFilter(brand)]).apply(
          packages,
        ),
        phase,
      ),
    [packages, brand, phase],
  );

  const setBrand = (key: string | null) => {
    navigation.setParams({ brand: key ?? undefined });
    setVisible({});
  };

  const body = () => {
    if (packagesQuery.isPending) {
      return (
        <Grid maxColumns={3} minItemWidth={280}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} height={420} />
          ))}
        </Grid>
      );
    }
    if (packagesQuery.isError && !packages.length) {
      return (
        <ErrorView
          error={packagesQuery.error}
          onRetry={() => void packagesQuery.refetch()}
        />
      );
    }
    if (!groups.length) {
      return brand ? (
        <View>
          <EmptyView
            title={`No ${brandLabel} packages available for this phase.`}
          />
          <Button
            label="Show all brands"
            variant="secondary"
            onPress={() => setBrand(null)}
          />
        </View>
      ) : (
        <EmptyView
          title="No packages available yet."
          message="Talk to an expert for a tailored system."
        />
      );
    }
    return groups.map(group => {
      const count = visible[group.label] ?? PAGE_SIZE;
      const total = group.packages.length;
      const allShown = count >= total;
      return (
        <Section key={group.label} title={group.label}>
          <Grid maxColumns={3} minItemWidth={280}>
            {group.packages.slice(0, count).map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onInquire={selection =>
                  navigation.navigate('PackageInquiry', {
                    packageId: pkg.id,
                    selection,
                  })
                }
              />
            ))}
          </Grid>
          {total > PAGE_SIZE ? (
            <Button
              label={allShown ? 'Show less' : 'Show more'}
              variant="secondary"
              style={styles.more}
              onPress={() =>
                setVisible(v => ({
                  ...v,
                  [group.label]: allShown
                    ? PAGE_SIZE
                    : Math.min(count + PAGE_SIZE, total),
                }))
              }
            />
          ) : null}
        </Section>
      );
    });
  };

  return (
    <Screen
      padTop
      refreshing={packagesQuery.isRefetching}
      onRefresh={() => void packagesQuery.refetch()}
      testID="packages-screen"
    >
      <AppText
        variant="display"
        accessibilityRole="header"
        style={styles.title}
      >
        Our Residential Packages
      </AppText>
      <View style={styles.controls}>
        <SegmentedControl
          options={PHASES}
          value={phase}
          onChange={p => {
            setPhase(p);
            setVisible({});
          }}
          accessibilityLabel="Electrical phase"
        />
        {brandOptions.length ? (
          <BrandFilter
            options={brandOptions}
            value={brand}
            onChange={setBrand}
          />
        ) : null}
      </View>
      {body()}
      <Card style={styles.cta}>
        <AppText variant="title">
          <AppText variant="title" tone="accent">
            Future-proof
          </AppText>{' '}
          your business infrastructure.
        </AppText>
        <AppText tone="muted" style={styles.ctaText}>
          Commercial and industrial energy demands require sophisticated,
          scalable engineering. Get in touch with our specialist team for a
          comprehensive energy audit, financial feasibility breakdown, and
          custom system design.
        </AppText>
        <View style={styles.ctaActions}>
          <Button
            label="Contact Our C&I Team"
            onPress={() =>
              navigation.navigate('TalkToExpert', { inquiryType: 'quote' })
            }
          />
          <Button
            label="Schedule a Consultation"
            variant="secondary"
            onPress={() =>
              navigation.navigate('TalkToExpert', {
                inquiryType: 'consultation',
              })
            }
          />
        </View>
      </Card>
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    title: { marginBottom: t.spacing(4) },
    controls: { gap: t.spacing(3), marginBottom: t.spacing(6) },
    more: { marginTop: t.spacing(4), alignSelf: 'center' },
    cta: { padding: t.spacing(6), marginTop: t.spacing(4) },
    ctaText: { marginTop: t.spacing(3) },
    ctaActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(3),
      marginTop: t.spacing(5),
    },
  });
