import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { EngineResult } from '../../domain/calculation/SolarMath';
import { AppText } from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, MOTION, useCountUp, useReducedMotion } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING = 104;
const STROKE = 10;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Display strings for a result; "—" while nothing can be computed. */
export const formatResult = (result: EngineResult | null) => ({
  inverter: result
    ? `${result.inverterKw}kW ${
        result.systemType === 'grid-tied' ? 'Grid-Tie' : 'Hybrid'
      }`
    : '—',
  solar: result ? `~${result.solarKwp.toFixed(1)} kWp` : '—',
  storage: result
    ? result.storageKwh > 0
      ? `${result.storageKwh} kWh`
      : 'No Battery'
    : '—',
});

const decimalsOf = (n: number) =>
  Math.min(2, String(n).split('.')[1]?.length ?? 0);

/** Animated number that settles on exactly `value`. */
function CountUp({
  value,
  decimals,
  prefix = '',
  suffix = '',
  style,
}: {
  value: number;
  decimals: number;
  prefix?: string;
  suffix?: string;
  style?: React.ComponentProps<typeof AppText>['style'];
}) {
  const current = useCountUp(value);
  return (
    <AppText style={style}>{`${prefix}${current.toFixed(
      decimals,
    )}${suffix}`}</AppText>
  );
}

/** Ring that sweeps closed once a system has been sized. */
function SizingRing({ result }: { result: EngineResult | null }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const sweep = useRef(new Animated.Value(0)).current;
  const filled = result ? 1 : 0;

  useEffect(() => {
    if (reduced) {
      sweep.setValue(filled);
      return;
    }
    const animation = Animated.timing(sweep, {
      toValue: filled,
      duration: MOTION.duration.slow * 2,
      easing: MOTION.easing.out,
      // SVG props cannot run on the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [sweep, filled, reduced]);

  const dashOffset = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.ring}>
      <Svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          fill="none"
          stroke={colors.onNight}
          strokeOpacity={0.12}
          strokeWidth={STROKE}
        />
        <AnimatedCircle
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          fill="none"
          stroke={colors.sun}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        {result ? (
          <CountUp
            value={result.solarKwp}
            decimals={1}
            style={styles.ringValue}
          />
        ) : (
          <AppText style={styles.ringValue}>—</AppText>
        )}
        <AppText variant="caption" tone="onNightMuted">
          kWp
        </AppText>
      </View>
    </View>
  );
}

export interface SystemResultProps {
  result: EngineResult | null;
  property: string;
  /** Label of the selected system purpose. */
  purpose: string;
  /** Show the 2x2 spec grid under the hero card. */
  withSpecs?: boolean;
  /** Columns for the spec grid. */
  columns?: number;
}

interface Spec {
  icon: IconName;
  label: string;
  /** Spoken / static value. */
  text: string;
  count?: { value: number; decimals: number; prefix?: string; suffix: string };
}

/** Night hero card with the sizing ring, plus the spec grid. */
export function SystemResult({
  result,
  property,
  purpose,
  withSpecs = true,
  columns = 2,
}: SystemResultProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const r = formatResult(result);
  const typeLabel = result
    ? result.systemType === 'grid-tied'
      ? 'Grid-Tied'
      : 'Hybrid'
    : null;

  const specs: Spec[] = [
    {
      icon: 'sun',
      label: 'Solar Panel Capacity',
      text: r.solar,
      count: result
        ? { value: result.solarKwp, decimals: 1, prefix: '~', suffix: ' kWp' }
        : undefined,
    },
    {
      icon: 'bolt',
      label: 'Inverter Capacity and Types',
      text: r.inverter,
      count: result
        ? {
            value: result.inverterKw,
            decimals: decimalsOf(result.inverterKw),
            suffix: `kW ${
              result.systemType === 'grid-tied' ? 'Grid-Tie' : 'Hybrid'
            }`,
          }
        : undefined,
    },
    {
      icon: 'battery',
      label: 'Storage Capacity',
      text: r.storage,
      count:
        result && result.storageKwh > 0
          ? {
              value: result.storageKwh,
              decimals: decimalsOf(result.storageKwh),
              suffix: ' kWh',
            }
          : undefined,
    },
    { icon: 'leaf', label: 'System Purpose', text: purpose },
  ];

  return (
    <View accessibilityLabel="Recommended system specifications">
      <View style={styles.hero}>
        <SizingRing result={result} />
        <View style={styles.heroText}>
          <AppText variant="caption" tone="onNightMuted">
            Recommended System Specifications
          </AppText>
          <AppText variant="title" tone="onNight">
            {typeLabel ? `${r.solar} ${typeLabel}` : 'Complete your inputs'}
          </AppText>
          <AppText variant="caption" tone="onNightMuted">
            {`${property} · ${purpose}`}
          </AppText>
        </View>
      </View>
      {withSpecs ? (
        <View style={styles.grid}>
          {specs.map((s, i) => (
            <FadeIn
              key={s.label}
              index={i}
              style={[styles.spec, { flexBasis: `${100 / columns - 4}%` }]}
            >
              <View
                accessible
                accessibilityLabel={`${s.label}: ${s.text}`}
                style={styles.specInner}
              >
                <View style={styles.specIcon}>
                  <Icon name={s.icon} size={16} color={colors.accentText} />
                </View>
                <AppText variant="caption" tone="muted">
                  {s.label}
                </AppText>
                {s.count ? (
                  <CountUp {...s.count} style={styles.specValue} />
                ) : (
                  <AppText style={styles.specValue}>{s.text}</AppText>
                )}
              </View>
            </FadeIn>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(4),
      padding: t.spacing(5),
      borderRadius: t.radius.xl,
      backgroundColor: t.colors.night,
    },
    heroText: { flex: 1, gap: t.spacing(1) },
    ring: {
      width: RING,
      height: RING,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringCenter: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringValue: {
      ...t.type.title,
      color: t.colors.onNight,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(3),
      marginTop: t.spacing(3),
    },
    spec: { flexGrow: 1 },
    specInner: {
      gap: t.spacing(1),
      padding: t.spacing(3.5),
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    specIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
      marginBottom: t.spacing(1),
    },
    specValue: { ...t.type.heading, color: t.colors.text },
  });
