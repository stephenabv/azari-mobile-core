import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import { createAppConfig } from '../../config/AppConfig';
import { PlayIntegrityProvider } from '../../core/security/PlayIntegrityProvider';
import type { PlatformAdapter } from '../../core/platform/PlatformAdapter';
import { MemoryKeyValueStore } from '../../core/storage/KeyValueStore';
import { AzariApp } from '../AzariApp';
import {
  MemorySecureStore,
  challengeRoute,
  deviceSecurity,
  fakeFetch,
  playBridge,
  silentLogger,
} from '../../__tests__/support/fakes';
import { hybridPackage } from '../../__tests__/support/packages';

const config = createAppConfig({
  platform: 'android',
  environment: 'production',
  apiBaseUrl: 'https://azari.solar',
  appVersion: '1.0.0',
  storeUrl: 'https://play.google.com/store/apps/details?id=solar.azari.app',
  playIntegrityCloudProjectNumber: '123',
});

// Infinite gcTime schedules no cache timers, so Jest can exit cleanly.
let queryClient: QueryClient;
beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
});
afterEach(() => queryClient.clear());

function renderApp(minimum = '0.0.0') {
  const backend = fakeFetch({
    'GET /api/mobile/config': () => ({
      status: 200,
      body: {
        minimumVersion: { ios: minimum, android: minimum },
        integrityPlatforms: ['android'],
      },
    }),
    'GET /api/content': () => ({
      status: 200,
      body: {
        success: true,
        data: {
          hero: {
            headerPart1: 'Clean',
            headerPart2: 'power for every home',
            highlightWords: 'Clean',
          },
        },
      },
    }),
    'GET /api/packages': () => ({
      status: 200,
      body: { success: true, data: [hybridPackage({ isRecommended: true })] },
    }),
    'GET /api/projects': () => ({
      status: 200,
      body: { success: true, data: [] },
    }),
    'POST /api/mobile/integrity/challenge': challengeRoute(),
    'POST /api/talk/send': () => ({ status: 201, body: { success: true } }),
  });
  const adapter: PlatformAdapter = {
    platform: 'android',
    deviceSecurity: deviceSecurity(),
    createIntegrityProvider: () =>
      new PlayIntegrityProvider(playBridge(), '123'),
  };
  render(
    <AzariApp
      config={config}
      adapter={adapter}
      overrides={{
        fetch: backend.fetch,
        keyValueStore: new MemoryKeyValueStore(),
        secureStore: new MemorySecureStore(),
        logger: silentLogger,
        queryClient,
      }}
    />,
  );
  return backend;
}

describe('AzariApp', () => {
  it('renders home from server content', async () => {
    renderApp();
    expect(
      await screen.findByText('power for every home', { exact: false }),
    ).toBeTruthy();
  });

  it('shows the configurable package catalog', async () => {
    renderApp();
    fireEvent.press(await screen.findByLabelText('Packages'));
    expect(await screen.findByText('HYD 6K')).toBeTruthy();
    expect(screen.getByText('Recommended')).toBeTruthy();
  });

  it('sends a signed talk-to-expert request', async () => {
    const backend = renderApp();
    fireEvent.press(await screen.findByLabelText('More'));
    fireEvent.press(await screen.findByText('Talk to an Expert'));
    fireEvent.changeText(
      await screen.findByLabelText('Full name'),
      'Juan Dela Cruz',
    );
    fireEvent.changeText(
      screen.getByLabelText('Email address'),
      'juan@example.com',
    );
    fireEvent.changeText(screen.getByLabelText('Phone number'), '09171234567');
    fireEvent.changeText(screen.getByLabelText('City'), 'Cebu City');
    fireEvent.changeText(screen.getByLabelText('Province'), 'Cebu');
    fireEvent.changeText(
      screen.getByLabelText('Message'),
      'I would like a quotation please.',
    );
    fireEvent.press(screen.getByTestId('talk-submit'));

    await waitFor(() =>
      expect(backend.calls.some(c => c.url.endsWith('/api/talk/send'))).toBe(
        true,
      ),
    );
    const sent = backend.calls.find(c => c.url.endsWith('/api/talk/send'))!;
    expect(sent.headers['x-azari-integrity']).toMatch(/^play-token:/);
    expect(JSON.parse(sent.body as string)).toMatchObject({
      name: 'Juan Dela Cruz',
      phone: '09171234567',
      inquiryType: 'general',
    });
  });

  it('blocks versions below the server minimum', async () => {
    renderApp('9.0.0');
    expect(await screen.findByTestId('update-required')).toBeTruthy();
  });
});
