import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { BrandOption } from '../../domain/packages/InverterBrandCatalog';
import { Chip, RemoteImage } from '../../ui/components';

export interface BrandFilterProps {
  options: readonly BrandOption[];
  value: string | null;
  onChange: (key: string | null) => void;
}

/** "All brands" plus one chip per inverter brand found in the live catalog. */
export function BrandFilter({ options, value, onChange }: BrandFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Filter by inverter brand"
    >
      <Chip
        label="All brands"
        selected={value === null}
        onPress={() => onChange(null)}
      />
      {options.map(option => (
        <Chip
          key={option.key}
          label={`${option.label} (${option.packageCount})`}
          selected={value === option.key}
          onPress={() => onChange(value === option.key ? null : option.key)}
          leading={
            option.logoUrl ? (
              <RemoteImage
                source={option.logoUrl}
                resizeMode="contain"
                style={styles.logo}
              />
            ) : null
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  logo: { width: 20, height: 20, backgroundColor: 'transparent' },
});
