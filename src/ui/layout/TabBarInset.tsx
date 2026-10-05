import { createContext, useContext } from 'react';

/**
 * Bottom space a screen must leave free for an overlaid tab bar. Zero outside
 * the tab navigator and when the side rail is used instead of the bar.
 */
const TabBarInsetContext = createContext(0);

export const TabBarInsetProvider = TabBarInsetContext.Provider;

export function useTabBarInset(): number {
  return useContext(TabBarInsetContext);
}
