import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SunRays } from '../../ui/brand';
import { AppText, Button, Card } from '../../ui/components';
import { FadeIn, PressableScale, Spin, useCountUp } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import type { HomeSectionProps } from './sections';

const SUN = 200;

/** Animated count-up of the bill reduction figure from the tropics content. */
function BillReduction({ rating }: { rating: number }) {
  const value = useCountUp(rating);
  return (
    <View
      accessible
      accessibilityLabel={`${rating}% average electricity bill reduction for our clients`}
    >
      <AppText variant="display" tone="onNight">
        {`${Math.round(value)}%`}
      </AppText>
      <AppText variant="caption" tone="onNightMuted">
        Average bill reduction for our clients
      </AppText>
    </View>
  );
}

/** Night hero card: slowly spinning sun, website hero copy and both CTAs. */
export function HeroCard({ content, actions }: HomeSectionProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  const hero = content.get('hero');
  const highlight = hero.highlightWords.trim();
  const rating = content.isVisible('tropics')
    ? content.get('tropics').performanceRating
    : null;

  return (
    <FadeIn fromScale={0.97} style={styles.wrap}>
      <Card tone="night" style={styles.card}>
        <Spin style={styles.sun}>
          <SunRays size={SUN} color={theme.colors.sun} />
        </Spin>
        <View style={size === 'compact' ? styles.copy : styles.copyWide}>
          <AppText variant="display" tone="onNight" accessibilityRole="header">
            <AppText
              variant="display"
              style={
                highlight && hero.headerPart1.includes(highlight)
                  ? styles.highlight
                  : null
              }
              tone="onNight"
            >
              {hero.headerPart1}
            </AppText>{' '}
            {hero.headerPart2}
          </AppText>
          {hero.subtext ? (
            <AppText tone="onNightMuted" style={styles.sub}>
              {hero.subtext}
            </AppText>
          ) : null}
        </View>
        <View style={styles.footer}>
          {rating != null ? <BillReduction rating={rating} /> : null}
          <View style={styles.ctas}>
            <PressableScale
              onPress={actions.openProjects}
              accessibilityRole="button"
              accessibilityLabel={hero.secondaryCta}
              style={styles.outline}
            >
              <AppText variant="label" tone="onNight">
                {hero.secondaryCta}
              </AppText>
            </PressableScale>
            <Button
              label={hero.primaryCta}
              compact
              icon="arrowRight"
              onPress={() => actions.openCalculator()}
            />
          </View>
        </View>
      </Card>
    </FadeIn>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { marginBottom: t.spacing(5) },
    card: { borderRadius: t.radius.xl, padding: t.spacing(5) },
    sun: { position: 'absolute', right: -64, top: -64, opacity: 0.9 },
    copy: { maxWidth: '78%' },
    copyWide: { maxWidth: 460 },
    highlight: { color: t.colors.sun },
    sub: { marginTop: t.spacing(2) },
    footer: {
      marginTop: t.spacing(5),
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: t.spacing(3),
    },
    ctas: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(2),
      alignItems: 'center',
    },
    outline: {
      minHeight: 36,
      paddingHorizontal: t.spacing(4),
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.onNightMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
