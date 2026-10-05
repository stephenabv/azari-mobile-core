import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { MOTION } from '../motion/tokens';
import { useReducedMotion } from '../motion/useReducedMotion';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

const PAD = 4;

/** Pill segmented control with a thumb that slides to the selection. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const styles = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const [segment, setSegment] = useState(0);
  const index = Math.max(
    0,
    options.findIndex(option => option.value === value),
  );
  const position = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    if (reduced) {
      position.setValue(index);
      return;
    }
    Animated.spring(position, {
      toValue: index,
      ...MOTION.spring.settle,
      useNativeDriver: true,
    }).start();
  }, [index, position, reduced]);

  const onLayout = (event: LayoutChangeEvent) =>
    setSegment(
      (event.nativeEvent.layout.width - PAD * 2) / Math.max(1, options.length),
    );

  return (
    <View
      style={styles.track}
      onLayout={onLayout}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segment,
              transform: [{ translateX: Animated.multiply(position, segment) }],
            },
          ]}
        />
      ) : null}
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={styles.segment}
          >
            <AppText
              variant="label"
              tone={selected ? 'default' : 'muted'}
              align="center"
              numberOfLines={2}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.pill,
      padding: PAD,
    },
    thumb: {
      position: 'absolute',
      top: PAD,
      bottom: PAD,
      left: PAD,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceRaised,
      ...t.elevation,
    },
    segment: {
      flex: 1,
      minHeight: 38,
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing(2),
    },
  });
