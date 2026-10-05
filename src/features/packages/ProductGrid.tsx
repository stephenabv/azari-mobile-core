import React, {
  Children,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  useResponsive,
  type SizeClass,
} from '../../ui/responsive/useResponsive';

/** Product tiles per row: two on phones, more as the window widens. */
const COLUMNS: Record<SizeClass, number> = {
  compact: 2,
  medium: 3,
  expanded: 4,
};

export function useProductColumns(): number {
  const { size } = useResponsive();
  return COLUMNS[size];
}

/** Shop-style grid of equal-width tiles that stretch to the tallest in a row. */
export function ProductGrid({
  children,
  gap = 12,
}: PropsWithChildren<{ gap?: number }>) {
  const { contentWidth } = useResponsive();
  const columns = useProductColumns();
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? contentWidth;
  const itemWidth = Math.floor((width - gap * (columns - 1)) / columns);

  const dynamic = useMemo(
    () =>
      StyleSheet.create({
        row: { gap },
        item: { width: itemWidth },
      }),
    [gap, itemWidth],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== measured) setMeasured(next);
  };

  return (
    <View style={[styles.row, dynamic.row]} onLayout={onLayout}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={dynamic.item}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' },
});
