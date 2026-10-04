import React, {
  Children,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useResponsive } from '../responsive/useResponsive';

export interface GridProps {
  /** Most columns to use on the widest screens. */
  maxColumns?: number;
  /** Minimum item width; fewer columns are used when items would get narrower. */
  minItemWidth?: number;
  gap?: number;
}

/**
 * Wrapping grid. The column count follows the screen size class and the
 * grid's own measured width, so it also works nested inside cards.
 */
export function Grid({
  children,
  maxColumns = 3,
  minItemWidth = 260,
  gap = 16,
}: PropsWithChildren<GridProps>) {
  const { columns, contentWidth } = useResponsive();
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? contentWidth;

  const byWidth = Math.max(1, Math.floor((width + gap) / (minItemWidth + gap)));
  const count = Math.min(columns(maxColumns), byWidth);
  const itemWidth = Math.floor((width - gap * (count - 1)) / count);

  const dynamic = useMemo(
    () => StyleSheet.create({ row: { gap }, item: { width: itemWidth } }),
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
