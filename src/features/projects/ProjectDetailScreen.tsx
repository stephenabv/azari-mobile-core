import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { NotFoundError } from '../../core/http/ApiError';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import { useProject } from '../../data/queries';
import { ProjectFacts, YouTube } from '../../domain/projects/Project';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Grid,
  LoadingView,
  Screen,
  Section,
} from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';
import { ProjectImage } from './ProjectImage';

const GALLERY_PREVIEW = 6;
const METRICS_PREVIEW = 4;

export function ProjectDetailScreen({
  navigation,
  route,
}: RootScreenProps<'ProjectDetail'>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { media } = useServices();
  const { size, gutter } = useResponsive();
  const {
    data: project,
    isPending,
    error,
    refetch,
  } = useProject(route.params.id);
  const [allMetrics, setAllMetrics] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: project?.title ?? 'Project' });
  }, [navigation, project?.title]);

  const facts = useMemo(
    () => (project ? new ProjectFacts(project) : null),
    [project],
  );
  const gallery = useMemo(
    () => (project ? media.resolveAll(project.galleryImages) : []),
    [project, media],
  );

  if (isPending) return <LoadingView />;
  if (error instanceof NotFoundError || (!project && !error)) {
    return (
      <EmptyView
        title="Project Not Found"
        message="This project may have been removed."
      />
    );
  }
  if (!project || !facts)
    return <ErrorView error={error} onRetry={() => void refetch()} />;

  const video = YouTube.watchUrl(project.videoUrl);
  const chips = facts.heroChips();
  const breakdown = facts.breakdown();
  const metrics = allMetrics
    ? project.performanceMetrics
    : project.performanceMetrics.slice(0, METRICS_PREVIEW);
  const openGallery = (index: number) =>
    navigation.navigate('PhotoViewer', {
      images: gallery,
      index,
      title: project.title,
    });
  const openVideo = video ? () => void ExternalLinks.open(video) : undefined;

  return (
    <Screen testID="project-detail">
      <FadeIn fromScale={0.98}>
        <View style={styles.hero}>
          <ProjectImage
            source={project.imageUrl}
            aspectRatio={size === 'compact' ? 4 / 3 : 21 / 9}
            accessibilityLabel={project.title}
          />
          {project.category ? (
            <View style={styles.heroBadge}>
              <Badge label={project.category} />
            </View>
          ) : null}
          {openVideo ? (
            <PressableScale
              onPress={openVideo}
              accessibilityRole="button"
              accessibilityLabel="Play the project video"
              style={styles.heroPlay}
            >
              <Icon name="play" size={20} color={theme.colors.onAccent} />
            </PressableScale>
          ) : null}
        </View>
      </FadeIn>

      <FadeIn index={1} style={styles.intro}>
        <AppText variant="display" accessibilityRole="header">
          {project.title}
        </AppText>
        {project.subtitle ? (
          <AppText tone="muted">{project.subtitle}</AppText>
        ) : null}
      </FadeIn>

      {chips.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -gutter }}
          contentContainerStyle={[styles.chips, { paddingHorizontal: gutter }]}
        >
          {chips.map((chip, i) => (
            <FadeIn
              key={`${chip.label}-${chip.value}`}
              index={i + 2}
              direction="left"
              distance={12}
            >
              <View style={styles.chip}>
                <AppText variant="heading" numberOfLines={1}>
                  {chip.value}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {chip.label}
                </AppText>
              </View>
            </FadeIn>
          ))}
        </ScrollView>
      ) : null}

      {openVideo ? (
        <Button
          label="Watch the project video"
          variant="secondary"
          icon="play"
          onPress={openVideo}
          style={styles.videoButton}
        />
      ) : null}
      <View style={styles.spacer} />

      {project.performanceMetrics.length ? (
        <Section title="Performance & Resilience Summary">
          <Grid maxColumns={2} minItemWidth={260} gap={12}>
            {metrics.map((m, i) => (
              <FadeIn key={m.title} index={i}>
                <Card style={styles.metric}>
                  <View style={styles.iconTile}>
                    <Icon
                      name="sparkle"
                      size={16}
                      color={theme.colors.accentText}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="heading">{m.title}</AppText>
                    <AppText variant="label" tone="muted" style={styles.light}>
                      {m.description}
                    </AppText>
                  </View>
                </Card>
              </FadeIn>
            ))}
          </Grid>
          {project.performanceMetrics.length > METRICS_PREVIEW ? (
            <Button
              label={allMetrics ? 'Show less' : 'Show more'}
              variant="ghost"
              compact
              onPress={() => setAllMetrics(v => !v)}
            />
          ) : null}
        </Section>
      ) : null}

      {breakdown.length ? (
        <Section title="Technical Breakdown">
          <Grid maxColumns={3} minItemWidth={240} gap={12}>
            {breakdown.map((card, i) => (
              <Card
                key={`${card.title}-${i}`}
                tone={card.cardType === 'hero' ? 'night' : 'raised'}
                style={styles.bento}
              >
                {card.imageUrl ? (
                  <ProjectImage
                    source={card.imageUrl}
                    aspectRatio={16 / 9}
                    style={styles.bentoImage}
                  />
                ) : null}
                {card.badge || card.tag ? (
                  <Badge
                    label={card.badge ?? card.tag ?? ''}
                    tone={card.cardType === 'hero' ? 'sun' : 'muted'}
                  />
                ) : null}
                <AppText
                  variant={card.cardType === 'hero' ? 'title' : 'heading'}
                  tone={card.cardType === 'hero' ? 'onNight' : 'default'}
                >
                  {card.title}
                </AppText>
                {card.description ? (
                  <AppText
                    variant="label"
                    tone={card.cardType === 'hero' ? 'onNightMuted' : 'muted'}
                    style={styles.light}
                  >
                    {card.description}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </Grid>
        </Section>
      ) : null}

      {gallery.length ? (
        <Section
          title="Project Installation Gallery"
          action={
            gallery.length > GALLERY_PREVIEW
              ? {
                  label: `View all ${gallery.length} photos`,
                  onPress: () => openGallery(0),
                }
              : undefined
          }
        >
          <Grid maxColumns={3} minItemWidth={100} gap={8}>
            {gallery.slice(0, GALLERY_PREVIEW).map((uri, i) => (
              <FadeIn key={uri} index={i} fromScale={0.94} distance={8}>
                <PressableScale
                  onPress={() => openGallery(i)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Photo ${i + 1} of ${gallery.length}`}
                >
                  <ProjectImage
                    source={uri}
                    aspectRatio={1}
                    style={styles.thumb}
                  />
                </PressableScale>
              </FadeIn>
            ))}
          </Grid>
        </Section>
      ) : null}

      {project.testimonial?.quote ? (
        <Section title="What our clients say">
          <Card tone="flat" style={styles.quoteCard}>
            <AppText
              style={styles.quote}
            >{`“${project.testimonial.quote}”`}</AppText>
            <AppText variant="label">{project.testimonial.clientName}</AppText>
            {project.testimonial.clientRole ? (
              <AppText variant="caption" tone="muted">
                {project.testimonial.clientRole}
              </AppText>
            ) : null}
          </Card>
        </Section>
      ) : null}

      <Button
        label="Get a quote for a similar system"
        icon="arrowRight"
        onPress={() => navigation.navigate('Tabs', { screen: 'Calculator' })}
      />
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    hero: {
      borderRadius: t.radius.xl,
      overflow: 'hidden',
      backgroundColor: t.colors.skeleton,
    },
    heroBadge: {
      position: 'absolute',
      top: t.spacing(3),
      left: t.spacing(3),
    },
    heroPlay: {
      position: 'absolute',
      right: t.spacing(3),
      bottom: t.spacing(3),
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    intro: { marginTop: t.spacing(4), gap: t.spacing(1) },
    chips: {
      gap: t.spacing(2),
      paddingTop: t.spacing(4),
      paddingBottom: t.spacing(1),
    },
    chip: {
      minWidth: 112,
      paddingVertical: t.spacing(2.5),
      paddingHorizontal: t.spacing(3.5),
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    videoButton: { marginTop: t.spacing(4) },
    metric: { flexDirection: 'row', gap: t.spacing(3) },
    iconTile: {
      width: 32,
      height: 32,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
    },
    light: { fontFamily: FONTS.regular, marginTop: 2 },
    bento: { gap: t.spacing(2) },
    bentoImage: { borderRadius: t.radius.md },
    thumb: { borderRadius: t.radius.md },
    quoteCard: { gap: 2, borderLeftWidth: 3, borderLeftColor: t.colors.accent },
    spacer: { height: t.spacing(7) },
    quote: { fontStyle: 'italic', marginBottom: t.spacing(3) },
  });
