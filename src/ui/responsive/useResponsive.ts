import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type SizeClass = 'compact' | 'medium' | 'expanded';

export interface Responsive {
  width: number;
  height: number;
  size: SizeClass;
  isLandscape: boolean;
  /** Horizontal page padding. */
  gutter: number;
  /** Max width of reading content; wider screens center it. */
  contentWidth: number;
  /** Columns for a card grid, capped at `max`. */
  columns(max: number): number;
}

/** Breakpoints follow Material window size classes (600dp / 840dp). */
const MEDIUM = 600;
const EXPANDED = 840;
const MAX_CONTENT = 1120;

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const size: SizeClass =
      width >= EXPANDED ? 'expanded' : width >= MEDIUM ? 'medium' : 'compact';
    const gutter = size === 'compact' ? 16 : size === 'medium' ? 24 : 32;
    const contentWidth = Math.min(width, MAX_CONTENT) - gutter * 2;
    const base = size === 'compact' ? 1 : size === 'medium' ? 2 : 3;
    return {
      width,
      height,
      size,
      isLandscape: width > height,
      gutter,
      contentWidth,
      columns: (max: number) => Math.max(1, Math.min(max, base)),
    };
  }, [width, height]);
}
