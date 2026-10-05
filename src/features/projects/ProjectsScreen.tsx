import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useProjects } from '../../data/queries';
import type { Project } from '../../domain/projects/Project';
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
  Screen,
  Skeleton,
} from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';
import { ProjectImage } from './ProjectImage';

/** Image aspect ratios (width / height) cycled through to give the feed its masonry rhythm. */
const MASONRY_ASPECTS = [0.82, 1.08, 0.95, 0.78, 1.15, 0.88] as const;
/** Rough height of a card's text block relative to its width, for balancing columns. */
const BODY_ESTIMATE = 0.38;
const COLUMN_GAP = 12;
const SKELETON_HEIGHTS = [210, 160, 180, 230] as const;

interface Tile<T> {
  item: T;
  index: number;
  aspect: number;
}

/** Deals tiles into the currently shortest column so columns end at similar heights. */
function masonry<T>(items: readonly T[], columnCount: number): Tile<T>[][] {
  const columns: Tile<T>[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);
  items.forEach((item, index) => {
    const aspect = MASONRY_ASPECTS[index % MASONRY_ASPECTS.length] ?? 1;
    let target = 0;
    for (let c = 1; c < columnCount; c++)
      if ((heights[c] ?? 0) < (heights[target] ?? 0)) target = c;
    columns[target]?.push({ item, index, aspect });
    heights[target] = (heights[target] ?? 0) + 1 / aspect + BODY_ESTIMATE;
  });
  return columns;
}

function ProjectTile({
  project,
  aspect,
  onPress,
}: {
  project: Project;
  aspect: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Card
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${project.title}, ${project.category}`}
      testID={`project-${project.id}`}
    >
      <View>
        <ProjectImage
          source={YouTube.thumbnail(project.videoUrl) ?? project.imageUrl}
          aspectRatio={aspect}
          style={styles.image}
        />
        {project.category ? (
          <View style={styles.kind}>
            <AppText
              variant="caption"
              style={styles.kindText}
              numberOfLines={1}
            >
              {project.category}
            </AppText>
          </View>
        ) : null}
        {project.videoUrl ? (
          <View style={styles.play}>
            <Icon name="play" size={12} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <AppText variant="label" style={styles.title} numberOfLines={2}>
          {project.title}
        </AppText>
        {project.system ? (
          <View style={styles.meta}>
            <Icon name="bolt" size={13} color={theme.colors.textMuted} />
            <AppText
              variant="caption"
              tone="muted"
              numberOfLines={1}
              style={styles.metaText}
            >
              {project.system}
            </AppText>
          </View>
        ) : null}
        {project.savings ? (
          <View style={styles.meta}>
            <Icon name="leaf" size={13} color={theme.colors.accentText} />
            <AppText
              variant="caption"
              tone="accent"
              numberOfLines={1}
              style={styles.metaText}
            >
              {project.savings}
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export function ProjectsScreen({ navigation }: TabScreenProps<'Projects'>) {
  const styles = useThemedStyles(createStyles);
  const { size, gutter } = useResponsive();
  const query = useProjects();
  const projects = useMemo(() => query.data ?? [], [query.data]);
  const filters = useMemo(() => projectFilters(projects), [projects]);
  const [filterId, setFilterId] = useState('all');
  const active = filters.find(f => f.id === filterId) ?? filters[0];
  const visible = useMemo(
    () => (active ? active.apply(projects) : projects),
    [active, projects],
  );
  // Two columns on phones, more as the window widens.
  const columnCount = size === 'compact' ? 2 : size === 'medium' ? 3 : 4;
  const columns = useMemo(
    () => masonry(visible, columnCount),
    [visible, columnCount],
  );

  const body = () => {
    if (query.isPending) {
      return (
        <View style={styles.columns}>
          {Array.from({ length: columnCount }, (_, c) => (
            <View key={c} style={styles.column}>
              {[0, 1].map(r => (
                <Skeleton
                  key={r}
                  radius={22}
                  height={
                    SKELETON_HEIGHTS[(c + r * 2) % SKELETON_HEIGHTS.length] ??
                    180
                  }
                />
              ))}
            </View>
          ))}
        </View>
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
      // Re-key on filter so the staggered entrance replays for the new set.
      <View
        key={`${active?.id ?? 'all'}-${columnCount}`}
        style={styles.columns}
      >
        {columns.map((column, c) => (
          <View key={c} style={styles.column}>
            {column.map(({ item, index, aspect }) => (
              <FadeIn
                key={item.id}
                index={index}
                fromScale={0.97}
                distance={18}
              >
                <ProjectTile
                  project={item}
                  aspect={aspect}
                  onPress={() =>
                    navigation.navigate('ProjectDetail', { id: item.id })
                  }
                />
              </FadeIn>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Screen
      padTop
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      testID="projects-screen"
    >
      <FadeIn>
        <AppText variant="display" accessibilityRole="header">
          Our Solar Installations Portfolio
        </AppText>
        <AppText variant="label" tone="muted" style={styles.sub}>
          Proven Resilience. Quantifiable Savings. Explore our nationwide
          portfolio of engineering excellence, built for the tropics and
          designed for maximum ROI.
        </AppText>
      </FadeIn>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={[styles.filters, { paddingHorizontal: gutter }]}
      >
        {filters.map((f, i) => (
          <FadeIn key={f.id} index={i} direction="left" distance={10}>
            <Chip
              label={f.label}
              selected={f.id === active?.id}
              onPress={() => setFilterId(f.id)}
            />
          </FadeIn>
        ))}
      </ScrollView>
      {body()}
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    sub: { marginTop: t.spacing(1) },
    filters: {
      gap: t.spacing(2),
      paddingTop: t.spacing(4),
      paddingBottom: t.spacing(4),
    },
    columns: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: COLUMN_GAP,
    },
    column: { flex: 1, minWidth: 0, gap: COLUMN_GAP },
    card: { padding: 0 },
    image: {
      borderTopLeftRadius: t.radius.lg,
      borderTopRightRadius: t.radius.lg,
    },
    kind: {
      position: 'absolute',
      top: t.spacing(2.5),
      right: t.spacing(2.5),
      maxWidth: '75%',
      paddingHorizontal: t.spacing(2),
      paddingVertical: 3,
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(18,19,24,0.7)',
    },
    kindText: {
      color: '#FFFFFF',
      fontFamily: FONTS.bold,
      fontSize: 11,
      lineHeight: 14,
    },
    play: {
      position: 'absolute',
      top: t.spacing(2.5),
      left: t.spacing(2.5),
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    cardBody: { padding: t.spacing(3), gap: t.spacing(1) },
    title: { fontFamily: FONTS.bold },
    meta: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(1) },
    metaText: { flex: 1 },
  });
