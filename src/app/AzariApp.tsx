import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { AppConfig } from '../config/AppConfig';
import type { PlatformAdapter } from '../core/platform/PlatformAdapter';
import { CalculatorDraftProvider } from '../features/calculator/CalculatorDraft';
import { linking } from '../navigation/linking';
import { RootNavigator } from '../navigation/RootNavigator';
import { RateLimitBanner } from '../ui/components';
import { ThemeProvider, useTheme } from '../ui/theme/ThemeContext';
import { AnimatedSplash } from './AnimatedSplash';
import { AppGate } from './AppGate';
import {
  createAppServices,
  type AppServices,
  type ServiceOverrides,
} from './AppServices';
import { ServicesProvider } from './ServicesContext';

export interface AzariAppProps {
  config: AppConfig;
  adapter: PlatformAdapter;
  /** Tests only. */
  overrides?: ServiceOverrides;
  /** Show the animated brand intro on launch. Defaults to true. */
  splash?: boolean;
}

function ThemedNavigation({ splash }: { splash: boolean }) {
  const theme = useTheme();
  const navTheme = useMemo<NavTheme>(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.background,
        notification: theme.colors.accent,
        text: theme.colors.text,
        border: theme.colors.border,
      },
    };
  }, [theme]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navTheme} linking={linking}>
        <AppGate>
          <RootNavigator />
        </AppGate>
      </NavigationContainer>
      <RateLimitBanner />
      {splash ? <AnimatedSplash /> : null}
    </View>
  );
}

/** Root component each app shell renders with its config and platform adapter. */
export function AzariApp({
  config,
  adapter,
  overrides,
  splash = true,
}: AzariAppProps) {
  const [services] = useState<AppServices>(() =>
    createAppServices(config, adapter, overrides),
  );
  return (
    <SafeAreaProvider>
      <ServicesProvider services={services}>
        <QueryClientProvider client={services.queryClient}>
          <ThemeProvider>
            <CalculatorDraftProvider>
              <ThemedNavigation splash={splash} />
            </CalculatorDraftProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ServicesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
