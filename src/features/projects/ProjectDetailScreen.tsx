import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
  RemoteImage,
  Screen,
  Section,
} from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

const GALLERY_PREVIEW = 6;
const METRICS_PREVIEW = 4;

export function ProjectDetailScreen({
  navigation,
  route,
}: RootScreenProps<'ProjectDetail'>) {
  const styles = useThemedStyles(createStyles);
  const { media } = useServices();
  const { size } = useResponsive();
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
  const metrics = allMetrics
    ? project.performanceMetrics
    : project.performanceMetrics.slice(0, METRICS_PREVIEW);
  const openGallery = (index: number) =>
    navigation.navigate('PhotoViewer', {
      images: gallery,
      index,
      title: project.title,
    });

  return (
    <Screen testID="project-detail">
      <Card style={styles.hero}>
        <RemoteImage
          source={project.imageUrl}
          aspectRatio={size === 'compact' ? 4 / 3 : 21 / 9}
          accessibilityLabel={project.title}
        />
        <View style={styles.heroBody}>
          <Badge label={project.category} />
          <AppText variant="display" accessibilityRole="header">
            {project.title}
          </AppText>
          {project.subtitle ? (
            <AppText tone="muted">{project.subtitle}</AppText>
          ) : null}
          <View style={styles.chips}>
            {facts.heroChips().map(chip => (
              <View key={`${chip.label}-${chip.value}`} style={styles.chip}>
                <AppText variant="heading">{chip.value}</AppText>
                <AppText variant="caption" tone="muted">
                  {chip.label}
                </AppText>
              </View>
            ))}
          </View>
          {video ? (
            <Button
              label="Watch the project video"
              variant="secondary"
              onPress={() => void ExternalLinks.open(video)}
            />
          ) : null}
        </View>
      </Card>

      {project.performanceMetrics.length ? (
        <Section title="Performance & Resilience Summary">
          <Grid maxColumns={2} minItemWidth={260}>
            {metrics.map(m => (
              <Card key={m.title}>
                <AppText variant="heading">{m.title}</AppText>
                <AppText tone="muted">{m.description}</AppText>
              </Card>
            ))}
          </Grid>
          {project.performanceMetrics.length > METRICS_PREVIEW ? (
            <Button
              label={allMetrics ? 'Show less' : 'Show more'}
              variant="ghost"
              onPress={() => setAllMetrics(v => !v)}
            />
          ) : null}
        </Section>
      ) : null}

      {facts.breakdown().length ? (
        <Section title="Technical Breakdown">
          <Grid maxColumns={3} minItemWidth={240}>
            {facts.breakdown().map((card, i) => (
              <Card
                key={`${card.title}-${i}`}
                highlighted={card.cardType === 'hero'}
                style={styles.bento}
              >
                {card.imageUrl ? (
                  <RemoteImage
                    source={card.imageUrl}
                    aspectRatio={16 / 9}
                    style={styles.bentoImage}
                  />
                ) : null}
                {card.badge || card.tag ? (
                  <Badge label={card.badge ?? card.tag ?? ''} tone="muted" />
                ) : null}
                <AppText
                  variant={card.cardType === 'hero' ? 'title' : 'heading'}
                >
                  {card.title}
                </AppText>
                {card.description ? (
                  <AppText tone="muted">{card.description}</AppText>
                ) : null}
              </Card>
            ))}
          </Grid>
        </Section>
      ) : null}

      {gallery.length ? (
        <Section title="Project Installation Gallery">
          <Grid maxColumns={3} minItemWidth={150} gap={8}>
            {gallery.slice(0, GALLERY_PREVIEW).map((uri, i) => (
              <Pressable
                key={uri}
                onPress={() => openGallery(i)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${i + 1} of ${gallery.length}`}
              >
                <RemoteImage
                  source={uri}
                  aspectRatio={1}
                  style={styles.thumb}
                />
              </Pressable>
            ))}
          </Grid>
          {gallery.length > GALLERY_PREVIEW ? (
            <Button
              label={`View all ${gallery.length} photos`}
              variant="ghost"
              onPress={() => openGallery(0)}
            />
          ) : null}
        </Section>
      ) : null}

      {project.testimonial?.quote ? (
        <Section title="What our clients say">
          <Card>
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
        onPress={() => navigation.navigate('Tabs', { screen: 'Calculator' })}
      />
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    hero: { padding: 0, marginBottom: t.spacing(8) },
    heroBody: { padding: t.spacing(5), gap: t.spacing(2) },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(3),
      marginVertical: t.spacing(3),
    },
    chip: {
      minWidth: 120,
      flexGrow: 1,
      padding: t.spacing(3),
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surface,
    },
    bento: { gap: t.spacing(2) },
    bentoImage: { borderRadius: t.radius.md },
    thumb: { borderRadius: t.radius.sm },
    quote: { fontStyle: 'italic', marginBottom: t.spacing(3) },
  });
