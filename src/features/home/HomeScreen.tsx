import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SiteContentBundle } from '../../data/CatalogRepository';
import { usePackages, useSiteContent } from '../../data/queries';
import type { TabScreenProps } from '../../navigation/types';
import { Screen } from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { HomeTopBar } from './HomeTopBar';
import {
  HOME_SECTIONS,
  homeRows,
  type HomeActions,
  type HomePackages,
  type HomeSectionDefinition,
} from './sections';

const sectionKey = (s: HomeSectionDefinition) => s.id ?? s.visibilityKey;

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { size } = useResponsive();
  const query = useSiteContent();
  const packagesQuery = usePackages();
  // Sections render from their built-in defaults until content arrives or if it fails.
  const content = query.data ?? SiteContentBundle.empty();

  const packages = useMemo<HomePackages>(
    () => ({
      items: packagesQuery.data ?? [],
      loading: packagesQuery.isPending,
    }),
    [packagesQuery.data, packagesQuery.isPending],
  );

  const actions = useMemo<HomeActions>(
    () => ({
      openCalculator: seed => navigation.navigate('Calculator', seed),
      openPackages: () => navigation.navigate('Packages'),
      openProjects: () => navigation.navigate('Projects'),
      openJourney: () => navigation.navigate('ClientJourney'),
      talkToExpert: params => navigation.navigate('TalkToExpert', params),
    }),
    [navigation],
  );

  const refreshing = query.isRefetching || packagesQuery.isRefetching;
  const onRefresh = () => {
    void query.refetch();
    void packagesQuery.refetch();
  };

  const visible = HOME_SECTIONS.filter(s => content.isVisible(s.visibilityKey));
  const renderSection = (section: HomeSectionDefinition) => {
    const { Component } = section;
    return (
      <Component
        key={sectionKey(section)}
        content={content}
        actions={actions}
        packages={packages}
      />
    );
  };

  return (
    <Screen
      padTop
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="home-screen"
    >
      <HomeTopBar onTalkToExpert={() => actions.talkToExpert()} />
      {homeRows(visible, size !== 'compact').map(row =>
        row.length === 1 ? (
          renderSection(row[0]!)
        ) : (
          <View key={row.map(sectionKey).join('+')} style={styles.columns}>
            {row.map(section => (
              <View key={sectionKey(section)} style={styles.column}>
                {renderSection(section)}
              </View>
            ))}
          </View>
        ),
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 20, alignItems: 'stretch' },
  column: { flex: 1, minWidth: 0 },
});
