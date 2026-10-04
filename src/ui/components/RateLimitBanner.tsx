import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServices } from '../../app/ServicesContext';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

/** App-wide countdown shown after the server answers 429, like the website banner. */
export function RateLimitBanner() {
  const { rateLimits } = useServices();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [resetAt, setResetAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(
    () => rateLimits.subscribe(notice => setResetAt(notice.resetAt)),
    [rateLimits],
  );

  useEffect(() => {
    if (resetAt === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= resetAt) setResetAt(null);
    }, 1000);
    return () => clearInterval(timer);
  }, [resetAt]);

  if (resetAt === null) return null;
  const seconds = Math.max(0, Math.ceil((resetAt - now) / 1000));
  if (seconds === 0) return null;

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + 8 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AppText variant="label" tone="inverse" align="center">
        Too many requests. Please try again in {seconds}s.
      </AppText>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    banner: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingBottom: t.spacing(2),
      paddingHorizontal: t.spacing(4),
      backgroundColor: t.colors.danger,
      zIndex: 10,
    },
  });
