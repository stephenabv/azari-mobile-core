import React, { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  /** Spoken value, e.g. "₱5,000". */
  formatValue?: (value: number) => string;
  testID?: string;
}

const THUMB = 28;

const snap = (raw: number, min: number, max: number, step: number) => {
  const clamped = Math.min(max, Math.max(min, raw));
  const snapped = min + Math.round((clamped - min) / step) * step;
  return Number(Math.min(max, snapped).toFixed(6));
};

/**
 * Dependency-free range slider. Dragging and tapping the track both work, and
 * screen readers get an adjustable control with increment/decrement actions.
 */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  accessibilityLabel,
  formatValue,
  testID,
}: SliderProps) {
  const styles = useThemedStyles(createStyles);
  const [width, setWidth] = useState(0);
  const latest = useRef({ width, min, max, step, onChange });
  latest.current = { width, min, max, step, onChange };

  const range = max - min || 1;
  const fraction = Math.min(1, Math.max(0, (value - min) / range));

  const responder = useMemo(() => {
    const emit = (x: number) => {
      const {
        width: w,
        min: lo,
        max: hi,
        step: s,
        onChange: cb,
      } = latest.current;
      const usable = Math.max(1, w - THUMB);
      cb(snap(lo + ((x - THUMB / 2) / usable) * (hi - lo), lo, hi, s));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => emit(e.nativeEvent.locationX),
      onPanResponderMove: e => emit(e.nativeEvent.locationX),
    });
  }, []);

  const onAction = (event: AccessibilityActionEvent) => {
    const bigStep = Math.max(step, range / 20);
    if (event.nativeEvent.actionName === 'increment')
      onChange(snap(value + bigStep, min, max, step));
    if (event.nativeEvent.actionName === 'decrement')
      onChange(snap(value - bigStep, min, max, step));
  };

  const offset = fraction * Math.max(0, width - THUMB);

  return (
    <View
      testID={testID}
      style={styles.hitArea}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, text: formatValue?.(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAction}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={styles.track}>
        <View style={[styles.fill, { width: offset + THUMB / 2 }]} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, { transform: [{ translateX: offset }] }]}
      />
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    hitArea: { height: 44, justifyContent: 'center' },
    track: {
      height: 6,
      marginHorizontal: THUMB / 2,
      borderRadius: 3,
      backgroundColor: t.colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      backgroundColor: t.colors.accent,
      marginLeft: -THUMB / 2,
    },
    thumb: {
      position: 'absolute',
      left: 0,
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: t.colors.onAccent,
      borderWidth: 3,
      borderColor: t.colors.accent,
    },
  });
