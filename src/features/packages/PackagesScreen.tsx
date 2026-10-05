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
  EmptyView,
  ErrorView,
  Screen,
  Section,
  SegmentedControl,
  Skeleton,
} from '../../ui/components';
import { useDebouncedValue } from '../../ui/hooks/useDebouncedValue';
import { FadeIn } from '../../ui/motion';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BrandFilter } from './BrandFilter';
import { CommercialCta } from './CommercialCta';
import { PackageCard } from './PackageCard';
import { PackageSearchField } from './PackageSearchField';
import { ProductGrid, useProductColumns } from './ProductGrid';
import { searchPackages } from './packageSearch';

/** Rows of tiles shown per group before "Show more". */
const PAGE_ROWS = 2;
const SEARCH_DEBOUNCE_MS = 200;
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
  const columns = useProductColumns();
  const pageSize = columns * PAGE_ROWS;
  const [phase, setPhase] = useState<Phase>('single');
  const [visible, setVisible] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

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
  const searching = debouncedQuery.trim().length > 0;

  const groups = useMemo(
    () =>
      groupPackages(
        searchPackages(
          new CompositePackageFilter([new InverterBrandFilter(brand)]).apply(
            packages,
          ),
          debouncedQuery,
        ),
        phase,
      ),
    [packages, brand, phase, debouncedQuery],
  );

  const setBrand = (key: string | null) => {
    navigation.setParams({ brand: key ?? undefined });
    setVisible({});
  };
  const onSearch = (text: string) => {
    setQuery(text);
    setVisible({});
  };

  const empty = () => {
    if (searching) {
      return (
        <View>
          <EmptyView
            title={`No packages match "${debouncedQuery.trim()}".`}
            message="Try a different size or brand."
          />
          <Button
            label="Clear search"
            variant="secondary"
            compact
            style={styles.centered}
            onPress={() => onSearch('')}
          />
        </View>
      );
    }
    if (brand) {
      return (
        <View>
          <EmptyView
            title={`No ${brandLabel} packages available for this phase.`}
          />
          <Button
            label="Show all brands"
            variant="secondary"
            compact
            style={styles.centered}
            onPress={() => setBrand(null)}
          />
        </View>
      );
    }
    return (
      <EmptyView
        title="No packages available yet."
        message="Talk to an expert for a tailored system."
      />
    );
  };

  const body = () => {
    if (packagesQuery.isPending) {
      return (
        <ProductGrid>
          {Array.from({ length: pageSize }, (_, i) => (
            <Skeleton key={i} height={250} radius={22} />
          ))}
        </ProductGrid>
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
    if (!groups.length) return empty();

    return groups.map(group => {
      const count = visible[group.label] ?? pageSize;
      const total = group.packages.length;
      const allShown = count >= total;
      return (
        <Section
          key={group.label}
          title={group.label}
          subtitle={`${total} ${total === 1 ? 'package' : 'packages'}`}
        >
          <ProductGrid>
            {group.packages.slice(0, count).map((pkg, index) => (
              <FadeIn
                key={pkg.id}
                index={index}
                fromScale={0.97}
                distance={18}
                style={styles.tile}
              >
                <PackageCard
                  pkg={pkg}
                  onInquire={selection =>
                    navigation.navigate('PackageInquiry', {
                      packageId: pkg.id,
                      selection,
                    })
                  }
                />
              </FadeIn>
            ))}
          </ProductGrid>
          {total > pageSize ? (
            <Button
              label={allShown ? 'Show less' : 'Show more'}
              variant="secondary"
              compact
              icon={allShown ? undefined : 'chevronDown'}
              style={styles.more}
              onPress={() =>
                setVisible(v => ({
                  ...v,
                  [group.label]: allShown
                    ? pageSize
                    : Math.min(count + pageSize, total),
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
      <FadeIn direction="none" style={styles.header}>
        <AppText variant="display" accessibilityRole="header">
          Our Residential Packages
        </AppText>
        <AppText variant="label" tone="muted" style={styles.subtitle}>
          Complete systems, installed and supported.
        </AppText>
      </FadeIn>
      <View style={styles.controls}>
        <FadeIn index={1}>
          <PackageSearchField value={query} onChangeText={onSearch} />
        </FadeIn>
        <FadeIn index={2}>
          <SegmentedControl
            options={PHASES}
            value={phase}
            onChange={p => {
              setPhase(p);
              setVisible({});
            }}
            accessibilityLabel="Electrical phase"
          />
        </FadeIn>
        {brandOptions.length ? (
          <BrandFilter
            options={brandOptions}
            value={brand}
            onChange={setBrand}
          />
        ) : null}
      </View>
      {body()}
      <CommercialCta
        onSelect={inquiryType =>
          navigation.navigate('TalkToExpert', { inquiryType })
        }
      />
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    header: { marginBottom: t.spacing(3) },
    subtitle: { marginTop: t.spacing(1) },
    controls: { gap: t.spacing(3), marginBottom: t.spacing(5) },
    tile: { flex: 1 },
    more: { marginTop: t.spacing(4), alignSelf: 'center' },
    centered: { alignSelf: 'center', marginTop: t.spacing(2) },
  });
