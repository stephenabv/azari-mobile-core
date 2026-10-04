import React, { useMemo } from 'react';
import { SiteContentBundle } from '../../data/CatalogRepository';
import { useSiteContent } from '../../data/queries';
import type { TabScreenProps } from '../../navigation/types';
import { Screen } from '../../ui/components';
import { Footer } from '../shared/Footer';
import { HOME_SECTIONS, type HomeActions } from './sections';

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const query = useSiteContent();
  // Sections render from their built-in defaults until content arrives or if it fails.
  const content = query.data ?? SiteContentBundle.empty();

  const actions = useMemo<HomeActions>(
    () => ({
      openCalculator: seed => navigation.navigate('Calculator', seed),
      openProjects: () => navigation.navigate('Projects'),
      openJourney: () => navigation.navigate('ClientJourney'),
      talkToExpert: params => navigation.navigate('TalkToExpert', params),
    }),
    [navigation],
  );

  return (
    <Screen
      padTop
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      testID="home-screen"
    >
      {HOME_SECTIONS.filter(s => content.isVisible(s.visibilityKey)).map(
        ({ visibilityKey, Component }) => (
          <Component key={visibilityKey} content={content} actions={actions} />
        ),
      )}
      <Footer content={content} />
    </Screen>
  );
}
