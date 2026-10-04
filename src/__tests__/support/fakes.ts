import type { FetchLike } from '../../core/http/ApiClient';
import type { Logger } from '../../core/logging/Logger';
import type {
  AppAttestBridge,
  DeviceSecurityBridge,
  PlayIntegrityBridge,
} from '../../core/security/bridges';
import type { SecureStore } from '../../core/storage/SecureStore';

export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export class MemorySecureStore implements SecureStore {
  readonly data = new Map<string, string>();
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.data.set(key, value);
  }
  async remove(key: string) {
    this.data.delete(key);
  }
}

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

type Handler = (call: RecordedCall) => {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
};

/** Route table fake for fetch: `"POST /api/x"` → handler. Unknown routes 404. */
export function fakeFetch(routes: Record<string, Handler>) {
  const calls: RecordedCall[] = [];
  const fetch: FetchLike = async (url, init) => {
    const path = new URL(url).pathname;
    const call: RecordedCall = {
      url,
      method: init.method ?? 'GET',
      headers: Object.fromEntries(
        Object.entries((init.headers ?? {}) as Record<string, string>).map(
          ([k, v]) => [k.toLowerCase(), v],
        ),
      ),
      body: init.body,
    };
    calls.push(call);
    const handler = routes[`${call.method} ${path}`];
    const result = handler
      ? handler(call)
      : { status: 404, body: { success: false, message: 'Not found' } };
    return new Response(
      result.body === undefined ? null : JSON.stringify(result.body),
      {
        status: result.status,
        headers: { 'Content-Type': 'application/json', ...result.headers },
      },
    );
  };
  return { fetch, calls };
}

export const challengeRoute = (): Handler => {
  let n = 0;
  return () => {
    n += 1;
    return {
      status: 200,
      body: {
        success: true,
        challenge: `challenge-${String(n).padStart(33, '0')}`,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    };
  };
};

export const deviceSecurity = (
  overrides: Partial<DeviceSecurityBridge> = {},
): DeviceSecurityBridge => ({
  getRiskSignals: async () => ({
    compromised: false,
    hookingDetected: false,
    debuggerAttached: false,
    emulator: false,
  }),
  setScreenCaptureProtection: jest.fn(),
  getRandomBytes: async () => 'AAAA',
  ...overrides,
});

export const playBridge = (): PlayIntegrityBridge & {
  prepared: jest.Mock;
  requested: jest.Mock;
} => {
  const prepared = jest.fn(async () => undefined);
  const requested = jest.fn(async (hash: string) => `play-token:${hash}`);
  return {
    preparePlayIntegrity: prepared,
    requestPlayIntegrityToken: requested,
    prepared,
    requested,
  };
};

export const attestBridge = (): AppAttestBridge &
  Record<string, jest.Mock> => ({
  isAppAttestSupported: jest.fn(async () => true),
  generateAppAttestKey: jest.fn(async () => 'key-1'),
  attestAppAttestKey: jest.fn(async () => 'attestation-blob'),
  generateAppAttestAssertion: jest.fn(
    async (_k: string, hash: string) => `assertion:${hash}`,
  ),
});
