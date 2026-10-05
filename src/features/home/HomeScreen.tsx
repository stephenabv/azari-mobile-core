import React, { useMemo } from 'react';
import { SiteContentBundle } from '../../data/CatalogRepository';
import { usePackages, useSiteContent } from '../../data/queries';
import type { TabScreenProps } from '../../navigation/types';
import { Screen } from '../../ui/components';
import { FadeIn } from '../../ui/motion';
import { Footer } from '../shared/Footer';
import { HomeTopBar } from './HomeTopBar';
import { HOME_SECTIONS, type HomeActions, type HomePackages } from './sections';

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
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

  return (
    <Screen
      padTop
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="home-screen"
    >
      <HomeTopBar onTalkToExpert={() => actions.talkToExpert()} />
      {visible.map(({ id, visibilityKey, Component }) => (
        <Component
          key={id ?? visibilityKey}
          content={content}
          actions={actions}
          packages={packages}
        />
      ))}
      <FadeIn delay={120}>
        <Footer content={content} />
      </FadeIn>
    </Screen>
  );
}
