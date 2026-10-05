import React, { useMemo, type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useResponsive } from '../../ui/responsive/useResponsive';

export interface BleedRowProps {
  gap?: number;
  /** Snap to multiples of this width (card width + gap). */
  snapInterval?: number;
  testID?: string;
}

/**
 * Horizontal scroller that bleeds to the screen edges while its first item
 * stays aligned with the page gutter, like store and social app carousels.
 */
export function BleedRow({
  children,
  gap = 12,
  snapInterval,
  testID,
}: PropsWithChildren<BleedRowProps>) {
  const { gutter } = useResponsive();
  const bleed = useMemo(
    () =>
      StyleSheet.create({
        scroll: { marginHorizontal: -gutter },
        content: { gap, paddingHorizontal: gutter },
      }),
    [gutter, gap],
  );
  return (
    <ScrollView
      horizontal
      testID={testID}
      showsHorizontalScrollIndicator={false}
      decelerationRate={snapInterval ? 'fast' : 'normal'}
      snapToInterval={snapInterval}
      snapToAlignment="start"
      style={bleed.scroll}
      contentContainerStyle={[styles.row, bleed.content]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'stretch', paddingVertical: 4 },
});
