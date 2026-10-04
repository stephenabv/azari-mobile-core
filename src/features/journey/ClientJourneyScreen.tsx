import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useJourney } from '../../data/queries';
import type { JourneyStep } from '../../domain/journey/JourneyStep';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Screen,
  Skeleton,
} from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { JourneyBlock } from './blocks';

const HEX = /^#[0-9a-f]{3,8}$/i;

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

export function ClientJourneyScreen({
  navigation,
}: RootScreenProps<'ClientJourney'>) {
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  const query = useJourney();
  const steps = query.data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const wide = size !== 'compact';
  const activeId = wide ? openId ?? steps[0]?.id ?? null : openId;

  const stepRow = (step: JourneyStep, i: number) => {
    const active = step.id === activeId;
    const accent =
      step.accentColor && HEX.test(step.accentColor)
        ? step.accentColor
        : undefined;
    return (
      <Pressable
        key={step.id}
        onPress={() => setOpenId(active && !wide ? null : step.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: active }}
        style={({ pressed }) => [
          styles.step,
          active && styles.stepActive,
          pressed && styles.pressed,
        ]}
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
        {!wide ? <AppText tone="muted">{active ? '−' : '+'}</AppText> : null}
      </Pressable>
    );
  };

  const body = () => {
    if (query.isPending)
      return [0, 1, 2, 3].map(i => <Skeleton key={i} height={64} />);
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
          <View style={styles.stepList}>{steps.map(stepRow)}</View>
          <Card style={styles.panel}>
            {active ? <StepContent step={active} /> : null}
          </Card>
        </View>
      );
    }
    return steps.map((step, i) => (
      <View key={step.id}>
        {stepRow(step, i)}
        {step.id === activeId ? (
          <Card style={styles.inlinePanel}>
            <StepContent step={step} />
          </Card>
        ) : null}
      </View>
    ));
  };

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      testID="journey-screen"
    >
      <AppText variant="display" accessibilityRole="header">
        Our Client Journey
      </AppText>
      <AppText tone="muted" style={styles.sub}>
        A streamlined step-by-step process designed to guide you from initial
        consultation to long-term energy independence.
      </AppText>
      {body()}
      <Button
        label="Talk to an Expert"
        style={styles.cta}
        onPress={() => navigation.navigate('TalkToExpert')}
      />
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    sub: { marginTop: t.spacing(2), marginBottom: t.spacing(6) },
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
    stepActive: { borderColor: t.colors.accent },
    pressed: { opacity: 0.8 },
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
