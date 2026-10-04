import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import { userMessageFor } from '../../core/http/ApiError';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingView({ label = 'Loading' }: { label?: string }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center} accessibilityLabel={label} accessible>
      <ActivityIndicator color={theme.colors.accent} size="large" />
    </View>
  );
}

export interface ErrorViewProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

/** Customer-safe error with an optional retry; never shows raw server text. */
export function ErrorView({
  error,
  onRetry,
  title = 'Unable to load',
}: ErrorViewProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center} accessibilityRole="alert">
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText tone="muted" align="center" style={styles.message}>
        {userMessageFor(error)}
      </AppText>
      {onRetry ? (
        <Button
          label="Try again"
          variant="secondary"
          onPress={onRetry}
          compact
        />
      ) : null}
    </View>
  );
}

export function EmptyView({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center}>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

/** Pulsing placeholder block. */
export function Skeleton({
  height,
  width = '100%',
  radius = 12,
}: {
  height: number;
  width?: DimensionValue;
  radius?: number;
}) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.skeleton,
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
      ]}
    />
  );
}

/** Inline form-level message (error or success). */
export function Notice({
  tone,
  text,
}: {
  tone: 'danger' | 'success' | 'muted';
  text: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[styles.notice, tone === 'danger' && styles.noticeDanger]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AppText tone={tone} variant="label">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({ skeleton: { marginBottom: 12 } });

const createStyles = (t: Theme) =>
  StyleSheet.create({
    center: {
      flex: 1,
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing(6),
      gap: t.spacing(3),
    },
    message: { maxWidth: 420 },
    notice: {
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      padding: t.spacing(3),
      marginBottom: t.spacing(4),
    },
    noticeDanger: { borderColor: t.colors.danger },
  });
