import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(createTheme(false));

/** Follows the system light/dark setting, like the website. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const theme = useMemo(() => createTheme(scheme === 'dark'), [scheme]);
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Memoized StyleSheet factory bound to the current theme. */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
