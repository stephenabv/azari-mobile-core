import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useJourney } from '../../data/queries';
import type { JourneyStep } from '../../domain/journey/JourneyStep';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  EmptyView,
  ErrorView,
  RemoteImage,
  Screen,
  Skeleton,
} from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { JourneyBlock } from './blocks';

const HEX = /^#[0-9a-f]{3,8}$/i;
const STORY_SIZE = 60;

const accentOf = (step: JourneyStep) =>
  step.accentColor && HEX.test(step.accentColor) ? step.accentColor : undefined;

function StepContent({ step }: { step: JourneyStep }) {
  return (
    <View>
      {step.subheading ? (
        <AppText variant="heading" style={stepStyles.subheading}>
          {step.subheading}
        </AppText>
      ) : null}
      {step.blocks.map((block, i) => (
        <JourneyBlock key={i} block={block} />
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({ subheading: { marginBottom: 12 } });

/** Story-style bubble for one step: a ring, its icon or number, and a short title. */
function StoryBubble({
  step,
  index,
  active,
  onPress,
}: {
  step: JourneyStep;
  index: number;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ring = accentOf(step) ?? theme.colors.accent;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Step ${index + 1}: ${step.title}`}
      accessibilityState={{ selected: active }}
      style={styles.story}
    >
      <View
        style={[
          styles.storyRing,
          { borderColor: active ? ring : theme.colors.border },
        ]}
      >
        <View style={[styles.storyInner, active && { backgroundColor: ring }]}>
          {step.iconUrl ? (
            <RemoteImage
              source={step.iconUrl}
              aspectRatio={1}
              resizeMode="contain"
              style={styles.storyIcon}
            />
          ) : (
            <AppText variant="title" tone={active ? 'inverse' : 'default'}>
              {String(index + 1)}
            </AppText>
          )}
        </View>
      </View>
      <AppText
        variant="caption"
        tone={active ? 'default' : 'muted'}
        numberOfLines={2}
        align="center"
        style={styles.storyLabel}
      >
        {step.title}
      </AppText>
    </PressableScale>
  );
}

export function ClientJourneyScreen({
  navigation,
}: RootScreenProps<'ClientJourney'>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { size, gutter } = useResponsive();
  const query = useJourney();
  const steps = query.data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const wide = size !== 'compact';
  const activeId = wide ? openId ?? steps[0]?.id ?? null : openId;

  const stepRow = (step: JourneyStep, i: number) => {
    const active = step.id === activeId;
    const accent = accentOf(step);
    return (
      <PressableScale
        key={step.id}
        onPress={() => setOpenId(active && !wide ? null : step.id)}
        pressedScale={0.98}
        accessibilityRole="button"
        accessibilityState={{ expanded: active }}
        style={[styles.step, active && styles.stepActive]}
      >
        <View
          style={[styles.number, accent ? { backgroundColor: accent } : null]}
        >
          <AppText variant="label" tone="inverse">
            {String(i + 1)}
          </AppText>
        </View>
        <AppText variant="heading" style={styles.stepTitle}>
          {step.title}
        </AppText>
        <Icon
          name={active && !wide ? 'chevronDown' : 'chevronRight'}
          size={16}
          color={active ? theme.colors.accentText : theme.colors.textMuted}
          strokeWidth={2.2}
        />
      </PressableScale>
    );
  };

  const stories = () =>
    steps.length ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={[styles.stories, { paddingHorizontal: gutter }]}
      >
        {steps.map((step, i) => (
          <FadeIn
            key={step.id}
            index={i}
            direction="left"
            distance={12}
            fromScale={0.9}
          >
            <StoryBubble
              step={step}
              index={i}
              active={step.id === activeId}
              onPress={() => setOpenId(step.id)}
            />
          </FadeIn>
        ))}
      </ScrollView>
    ) : null;

  const body = () => {
    if (query.isPending)
      return [0, 1, 2, 3].map(i => (
        <Skeleton key={i} height={60} radius={16} />
      ));
    if (query.isError && !steps.length)
      return (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      );
    if (!steps.length)
      return (
        <EmptyView
          title="Coming soon"
          message="Our client journey guide is being prepared."
        />
      );

    if (wide) {
      const active = steps.find(s => s.id === activeId);
      return (
        <View style={styles.columns}>
          <View style={styles.stepList}>
            {steps.map((step, i) => (
              <FadeIn key={step.id} index={i}>
                {stepRow(step, i)}
              </FadeIn>
            ))}
          </View>
          <Card style={styles.panel}>
            {active ? (
              <FadeIn key={active.id} distance={8}>
                <StepContent step={active} />
              </FadeIn>
            ) : null}
          </Card>
        </View>
      );
    }
    return steps.map((step, i) => (
      <FadeIn key={step.id} index={i}>
        {stepRow(step, i)}
        {step.id === activeId ? (
          <FadeIn distance={8}>
            <Card style={styles.inlinePanel}>
              <StepContent step={step} />
            </Card>
          </FadeIn>
        ) : null}
      </FadeIn>
    ));
  };

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      testID="journey-screen"
    >
      <FadeIn>
        <AppText variant="display" accessibilityRole="header">
          Our Client Journey
        </AppText>
        <AppText variant="label" tone="muted" style={styles.sub}>
          A streamlined step-by-step process designed to guide you from initial
          consultation to long-term energy independence.
        </AppText>
      </FadeIn>
      {stories()}
      {body()}
      <Button
        label="Talk to an Expert"
        icon="arrowRight"
        style={styles.cta}
        onPress={() => navigation.navigate('TalkToExpert')}
      />
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    sub: { marginTop: t.spacing(1) },
    stories: {
      gap: t.spacing(3),
      paddingTop: t.spacing(5),
      paddingBottom: t.spacing(5),
    },
    story: {
      width: STORY_SIZE + 16,
      alignItems: 'center',
      gap: t.spacing(1.5),
    },
    storyRing: {
      width: STORY_SIZE + 8,
      height: STORY_SIZE + 8,
      borderRadius: (STORY_SIZE + 8) / 2,
      borderWidth: 2.5,
      padding: 2,
    },
    storyInner: {
      flex: 1,
      borderRadius: STORY_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: t.colors.surfaceRaised,
    },
    storyIcon: { width: '62%', backgroundColor: 'transparent' },
    storyLabel: { lineHeight: 15 },
    columns: {
      flexDirection: 'row',
      gap: t.spacing(6),
      alignItems: 'flex-start',
    },
    stepList: { width: 300 },
    panel: { flex: 1, padding: t.spacing(5) },
    inlinePanel: { marginBottom: t.spacing(3) },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      padding: t.spacing(3),
      borderRadius: t.radius.md,
      marginBottom: t.spacing(2),
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
    },
    stepActive: {
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accentSoft,
    },
    number: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    stepTitle: { flex: 1 },
    cta: { marginTop: t.spacing(8) },
  });
