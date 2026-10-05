import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { YouTube } from '../../domain/projects/Project';
import { AppText, RemoteImage } from '../../ui/components';
import { FadeIn, PressableScale, Pulse } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BleedRow } from './BleedRow';
import type { HomeSectionProps } from './sections';

const RING = 64;
const STROKE = 2.5;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Gradient story ring (sun to coral) drawn with SVG. */
function StoryRing({ id }: { id: string }) {
  const theme = useTheme();
  const r = (RING - STROKE) / 2;
  return (
    <Svg
      width={RING}
      height={RING}
      style={StyleSheet.absoluteFill}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.colors.sun} />
          <Stop offset="0.55" stopColor={theme.colors.accent} />
          <Stop offset="1" stopColor={theme.colors.sun} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={r}
        stroke={`url(#${id})`}
        strokeWidth={STROKE}
        fill="none"
      />
    </Svg>
  );
}

/** Instagram-style row of client stories from the client journey entries. */
export function StoriesRow({ content, actions }: HomeSectionProps) {
  const styles = useThemedStyles(createStyles);
  const entries = content.get('clientJourney').entries;
  if (!entries.length) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" tone="muted" style={styles.label}>
        CLIENT STORIES
      </AppText>
      <BleedRow gap={14}>
        {entries.map((entry, index) => {
          const thumb = YouTube.thumbnail(entry.videoUrl);
          return (
            <FadeIn
              key={entry.id}
              index={index}
              direction="left"
              fromScale={0.85}
            >
              <PressableScale
                onPress={actions.openJourney}
                accessibilityRole="button"
                accessibilityLabel={`${entry.name}'s story`}
                accessibilityHint="Opens the client journey"
                style={styles.story}
              >
                <View style={styles.ringBox}>
                  <Pulse
                    style={styles.halo}
                    duration={1400 + (index % 3) * 200}
                    maxScale={1.16}
                    minOpacity={0}
                    maxOpacity={0.7}
                  />
                  <StoryRing id={`story-ring-${index}`} />
                  <View style={styles.avatar}>
                    {thumb ? (
                      <RemoteImage source={thumb} style={styles.photo} />
                    ) : (
                      <AppText variant="label" tone="onNight">
                        {initialsOf(entry.name)}
                      </AppText>
                    )}
                  </View>
                </View>
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  align="center"
                  style={styles.name}
                >
                  {entry.name}
                </AppText>
              </PressableScale>
            </FadeIn>
          );
        })}
      </BleedRow>
    </View>
  );
}

const INNER = RING - STROKE * 2 - 4;

const createStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { marginBottom: t.spacing(4) },
    label: { letterSpacing: 0.6, marginBottom: t.spacing(2) },
    story: { width: RING + 6, alignItems: 'center', gap: t.spacing(1.5) },
    ringBox: {
      width: RING,
      height: RING,
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: RING / 2,
      borderWidth: STROKE,
      borderColor: t.colors.accent,
    },
    avatar: {
      width: INNER,
      height: INNER,
      borderRadius: INNER / 2,
      overflow: 'hidden',
      backgroundColor: t.colors.night,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photo: StyleSheet.absoluteFill,
    name: { maxWidth: RING + 6 },
  });
