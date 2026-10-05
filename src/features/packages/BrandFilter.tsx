import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { BrandOption } from '../../domain/packages/InverterBrandCatalog';
import { Chip, RemoteImage } from '../../ui/components';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';

export interface BrandFilterProps {
  options: readonly BrandOption[];
  value: string | null;
  onChange: (key: string | null) => void;
}

/**
 * "All brands" plus one chip per inverter brand found in the live catalog,
 * in an edge-to-edge horizontal scroller.
 */
export function BrandFilter({ options, value, onChange }: BrandFilterProps) {
  const { gutter } = useResponsive();
  const chips = [
    { key: null, label: 'All brands', logoUrl: null },
    ...options.map(option => ({
      key: option.key,
      label: `${option.label} (${option.packageCount})`,
      logoUrl: option.logoUrl,
    })),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -gutter }}
      contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]}
      accessibilityLabel="Filter by inverter brand"
    >
      {chips.map((chip, index) => (
        <FadeIn key={chip.key ?? 'all'} index={index} direction="left">
          <Chip
            label={chip.label}
            selected={value === chip.key}
            onPress={() =>
              onChange(
                chip.key === null || value === chip.key ? null : chip.key,
              )
            }
            leading={
              chip.logoUrl ? (
                <RemoteImage
                  source={chip.logoUrl}
                  resizeMode="contain"
                  style={styles.logo}
                />
              ) : null
            }
          />
        </FadeIn>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  logo: { width: 20, height: 20, backgroundColor: 'transparent' },
});
