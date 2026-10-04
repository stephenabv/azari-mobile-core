import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useProjects } from '../../data/queries';
import { YouTube } from '../../domain/projects/Project';
import { projectFilters } from '../../domain/projects/ProjectFilter';
import type { TabScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyView,
  ErrorView,
  Grid,
  RemoteImage,
  Screen,
  Skeleton,
} from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

export function ProjectsScreen({ navigation }: TabScreenProps<'Projects'>) {
  const styles = useThemedStyles(createStyles);
  const query = useProjects();
  const projects = useMemo(() => query.data ?? [], [query.data]);
  const filters = useMemo(() => projectFilters(projects), [projects]);
  const [filterId, setFilterId] = useState('all');
  const active = filters.find(f => f.id === filterId) ?? filters[0];
  const visible = active ? active.apply(projects) : projects;

  const body = () => {
    if (query.isPending) {
      return (
        <Grid maxColumns={3} minItemWidth={260}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} height={280} />
          ))}
        </Grid>
      );
    }
    if (query.isError && !projects.length)
      return (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      );
    if (!visible.length) {
      return (
        <View>
          <EmptyView
            title={
              projects.length
                ? `No ${active?.label.toLowerCase() ?? 'projects'} yet`
                : 'Projects coming soon'
            }
            message="New installations are added regularly. Check back soon."
          />
          {projects.length && filterId !== 'all' ? (
            <Button
              label="View all projects"
              variant="secondary"
              onPress={() => setFilterId('all')}
            />
          ) : null}
        </View>
      );
    }
    return (
      <Grid maxColumns={3} minItemWidth={260}>
        {visible.map(project => (
          <Card
            key={project.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('ProjectDetail', { id: project.id })
            }
            accessibilityLabel={`${project.title}, ${project.category}`}
            testID={`project-${project.id}`}
          >
            <RemoteImage
              source={YouTube.thumbnail(project.videoUrl) ?? project.imageUrl}
              aspectRatio={4 / 3}
            />
            <View style={styles.cardBody}>
              <AppText variant="caption" tone="accent">
                {project.category}
              </AppText>
              <AppText variant="heading" numberOfLines={2}>
                {project.title}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {project.system}
              </AppText>
              {project.savings ? (
                <AppText variant="label">{project.savings}</AppText>
              ) : null}
            </View>
          </Card>
        ))}
      </Grid>
    );
  };

  return (
    <Screen
      padTop
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      testID="projects-screen"
    >
      <AppText variant="display" accessibilityRole="header">
        Our Solar Installations Portfolio
      </AppText>
      <AppText tone="muted" style={styles.sub}>
        Proven Resilience. Quantifiable Savings. Explore our nationwide
        portfolio of engineering excellence, built for the tropics and designed
        for maximum ROI.
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map(f => (
          <Chip
            key={f.id}
            label={f.label}
            selected={f.id === active?.id}
            onPress={() => setFilterId(f.id)}
          />
        ))}
      </ScrollView>
      {body()}
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    sub: { marginTop: t.spacing(2), marginBottom: t.spacing(5) },
    filters: { gap: t.spacing(2), paddingBottom: t.spacing(5) },
    card: { padding: 0 },
    cardBody: { padding: t.spacing(4), gap: t.spacing(1) },
  });
