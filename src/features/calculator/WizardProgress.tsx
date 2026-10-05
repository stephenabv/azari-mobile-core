import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { MOTION, PressableScale, useReducedMotion } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export interface WizardProgressProps {
  /** Short step names, in order. */
  steps: readonly string[];
  /** Zero-based current step. */
  current: number;
  /** Jump back to an earlier step. */
  onSelect: (index: number) => void;
}

/** Animated progress bar with tappable step names (earlier steps only). */
export function WizardProgress({
  steps,
  current,
  onSelect,
}: WizardProgressProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const target = (current + 1) / steps.length;

  useEffect(() => {
    if (reduced) {
      progress.setValue(target);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: target,
      duration: MOTION.duration.base + 130,
      easing: MOTION.easing.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, target, reduced]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.barRow}>
        <View
          style={styles.track}
          onLayout={e => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Calculator progress"
          accessibilityValue={{ min: 1, max: steps.length, now: current + 1 }}
        >
          <Animated.View
            style={[styles.fill, { transform: [{ translateX }] }]}
          />
        </View>
        <AppText variant="label" tone="muted">
          {`Step ${current + 1} of ${steps.length}`}
        </AppText>
      </View>
      <View style={styles.names}>
        {steps.map((name, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <View key={name} style={styles.cell}>
              <PressableScale
                disabled={!done}
                onPress={() => onSelect(i)}
                accessibilityRole="button"
                accessibilityLabel={`Step ${i + 1}: ${name}`}
                accessibilityState={{ selected: active, disabled: !done }}
                style={[styles.name, active && styles.nameActive]}
              >
                <View style={[styles.dot, (done || active) && styles.dotOn]}>
                  {done ? (
                    <Icon name="check" size={10} color={colors.onAccent} />
                  ) : (
                    <AppText
                      variant="caption"
                      style={active ? styles.dotTextOn : styles.dotText}
                    >
                      {i + 1}
                    </AppText>
                  )}
                </View>
                <AppText
                  variant="caption"
                  tone={active ? 'default' : 'muted'}
                  numberOfLines={1}
                >
                  {name}
                </AppText>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { marginTop: t.spacing(3), gap: t.spacing(3) },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(3) },
    track: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: t.colors.border,
    },
    fill: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      borderRadius: 4,
      backgroundColor: t.colors.accent,
    },
    names: { flexDirection: 'row', gap: t.spacing(2) },
    cell: { flex: 1 },
    name: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(1.5),
      paddingVertical: t.spacing(1.5),
      paddingHorizontal: t.spacing(2),
      borderRadius: t.radius.pill,
    },
    nameActive: { backgroundColor: t.colors.surfaceRaised },
    dot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
    },
    dotOn: { backgroundColor: t.colors.accent },
    dotText: { color: t.colors.textMuted, fontSize: 10, lineHeight: 12 },
    dotTextOn: { color: t.colors.onAccent, fontSize: 10, lineHeight: 12 },
  });
