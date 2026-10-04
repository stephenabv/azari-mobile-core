import { createAppConfig } from '../AppConfig';

const base = {
  platform: 'ios' as const,
  environment: 'production' as const,
  apiBaseUrl: 'https://azari.solar/',
  appVersion: '1.0.0',
  storeUrl: 'https://apps.apple.com/app/id1',
};

describe('createAppConfig', () => {
  it('normalises and freezes a valid config', () => {
    const config = createAppConfig(base);
    expect(config.apiBaseUrl).toBe('https://azari.solar');
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('rejects cleartext outside local development', () => {
    expect(() =>
      createAppConfig({ ...base, apiBaseUrl: 'http://azari.solar' }),
    ).toThrow(/Cleartext/);
    expect(() =>
      createAppConfig({
        ...base,
        environment: 'development',
        apiBaseUrl: 'http://10.0.2.2:4000',
      }),
    ).not.toThrow();
  });

  it('rejects paths and unknown keys', () => {
    expect(() =>
      createAppConfig({ ...base, apiBaseUrl: 'https://azari.solar/api' }),
    ).toThrow(/origin/);
    expect(() => createAppConfig({ ...base, apiKey: 'x' } as never)).toThrow();
  });

  it('requires a Play project number on Android', () => {
    expect(() => createAppConfig({ ...base, platform: 'android' })).toThrow(
      /playIntegrityCloudProjectNumber/,
    );
  });
});
