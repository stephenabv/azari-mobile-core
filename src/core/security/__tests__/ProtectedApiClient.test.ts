import { z } from 'zod';
import { ApiClient } from '../../http/ApiClient';
import { IntegrityRejectedError } from '../../http/ApiError';
import { RateLimitMonitor } from '../../http/RateLimitMonitor';
import { JsonBody, MultipartBody } from '../../http/RequestBody';
import { AppAttestIntegrityProvider } from '../AppAttestIntegrityProvider';
import { IntegrityProtocol } from '../IntegrityProtocol';
import { MobileIntegrityApi } from '../MobileIntegrityApi';
import { PlayIntegrityProvider } from '../PlayIntegrityProvider';
import { ProtectedApiClient } from '../ProtectedApiClient';
import {
  MemorySecureStore,
  attestBridge,
  challengeRoute,
  fakeFetch,
  playBridge,
  silentLogger,
} from '../../../__tests__/support/fakes';

const ok = z.object({ success: z.literal(true) }).loose();

function apiWith(fetch: ReturnType<typeof fakeFetch>['fetch']) {
  return new ApiClient({
    baseUrl: 'https://azari.solar',
    timeoutMs: 1000,
    logger: silentLogger,
    rateLimits: new RateLimitMonitor(),
    userAgent: 'test',
    fetch,
  });
}

describe('ProtectedApiClient with Play Integrity', () => {
  it('binds the token to the challenge, method, path and JSON body', async () => {
    const { fetch, calls } = fakeFetch({
      'POST /api/mobile/integrity/challenge': challengeRoute(),
      'POST /api/talk/send': () => ({ status: 201, body: { success: true } }),
    });
    const api = apiWith(fetch);
    const bridge = playBridge();
    const client = new ProtectedApiClient(
      api,
      new PlayIntegrityProvider(bridge, '123'),
      new MobileIntegrityApi(api),
      silentLogger,
    );
    const body = new JsonBody({ name: 'Juan' });

    await client.request({ method: 'POST', path: '/api/talk/send', body }, ok);

    const sent = calls[1]!;
    const challenge = sent.headers['x-azari-challenge']!;
    const expected = IntegrityProtocol.playRequestHash(
      IntegrityProtocol.requestClientData({
        challenge,
        method: 'POST',
        path: '/api/talk/send',
        bodySha256Hex: IntegrityProtocol.bodySha256Hex(
          body.serialize() as string,
        ),
      }),
    );
    expect(sent.headers['x-azari-platform']).toBe('android');
    expect(sent.headers['x-azari-integrity']).toBe(`play-token:${expected}`);
    expect(sent.headers['x-azari-key-id']).toBeUndefined();
    expect(bridge.prepared).toHaveBeenCalledTimes(1);
  });

  it('binds multipart uploads as the empty body', async () => {
    const { fetch, calls } = fakeFetch({
      'POST /api/mobile/integrity/challenge': challengeRoute(),
      'POST /api/quotation/request-proposal': () => ({
        status: 201,
        body: { success: true },
      }),
    });
    const api = apiWith(fetch);
    const client = new ProtectedApiClient(
      api,
      new PlayIntegrityProvider(playBridge(), '123'),
      new MobileIntegrityApi(api),
      silentLogger,
    );

    await client.request(
      {
        method: 'POST',
        path: '/api/quotation/request-proposal',
        body: new MultipartBody({ payload: '{}' }, {}),
      },
      ok,
    );

    const sent = calls[1]!;
    const expected = IntegrityProtocol.playRequestHash(
      IntegrityProtocol.requestClientData({
        challenge: sent.headers['x-azari-challenge']!,
        method: 'POST',
        path: '/api/quotation/request-proposal',
        bodySha256Hex: IntegrityProtocol.emptyBodySha256Hex,
      }),
    );
    expect(sent.headers['x-azari-integrity']).toBe(`play-token:${expected}`);
  });

  it('retries once with a fresh challenge when the challenge expired', async () => {
    let attempts = 0;
    const { fetch, calls } = fakeFetch({
      'POST /api/mobile/integrity/challenge': challengeRoute(),
      'POST /api/talk/send': () => {
        attempts += 1;
        return attempts === 1
          ? {
              status: 401,
              body: {
                success: false,
                message: 'x',
                error: { code: 'INTEGRITY_CHALLENGE_INVALID' },
              },
            }
          : { status: 201, body: { success: true } };
      },
    });
    const api = apiWith(fetch);
    const client = new ProtectedApiClient(
      api,
      new PlayIntegrityProvider(playBridge(), '123'),
      new MobileIntegrityApi(api),
      silentLogger,
    );

    await client.request(
      { method: 'POST', path: '/api/talk/send', body: new JsonBody({}) },
      ok,
    );

    expect(attempts).toBe(2);
    expect(calls[1]!.headers['x-azari-challenge']).not.toBe(
      calls[3]!.headers['x-azari-challenge'],
    );
  });

  it('does not retry a hard integrity rejection', async () => {
    const { fetch } = fakeFetch({
      'POST /api/mobile/integrity/challenge': challengeRoute(),
      'POST /api/talk/send': () => ({
        status: 403,
        body: {
          success: false,
          message: 'x',
          error: { code: 'INTEGRITY_VERDICT_FAILED' },
        },
      }),
    });
    const api = apiWith(fetch);
    const client = new ProtectedApiClient(
      api,
      new PlayIntegrityProvider(playBridge(), '123'),
      new MobileIntegrityApi(api),
      silentLogger,
    );

    await expect(
      client.request(
        { method: 'POST', path: '/api/talk/send', body: new JsonBody({}) },
        ok,
      ),
    ).rejects.toBeInstanceOf(IntegrityRejectedError);
  });
});

describe('ProtectedApiClient with App Attest', () => {
  function setup(sendStatus: () => number) {
    const { fetch, calls } = fakeFetch({
      'POST /api/mobile/integrity/challenge': challengeRoute(),
      'POST /api/mobile/devices/ios': () => ({
        status: 201,
        body: { success: true },
      }),
      'POST /api/packages/inquiries': () => {
        const status = sendStatus();
        return status === 401
          ? {
              status,
              body: {
                success: false,
                message: 'x',
                error: { code: 'INTEGRITY_KEY_UNKNOWN' },
              },
            }
          : { status, body: { success: true } };
      },
    });
    const api = apiWith(fetch);
    const integrityApi = new MobileIntegrityApi(api);
    const bridge = attestBridge();
    const store = new MemorySecureStore();
    const provider = new AppAttestIntegrityProvider(
      bridge,
      store,
      integrityApi,
      silentLogger,
    );
    return {
      client: new ProtectedApiClient(api, provider, integrityApi, silentLogger),
      calls,
      bridge,
      store,
    };
  }

  it('registers the key once and sends keyId with each assertion', async () => {
    const { client, calls, bridge, store } = setup(() => 201);
    await Promise.all([
      client.request(
        {
          method: 'POST',
          path: '/api/packages/inquiries',
          body: new JsonBody({ a: 1 }),
        },
        ok,
      ),
      client.request(
        {
          method: 'POST',
          path: '/api/packages/inquiries',
          body: new JsonBody({ a: 2 }),
        },
        ok,
      ),
    ]);

    expect(bridge.generateAppAttestKey).toHaveBeenCalledTimes(1);
    expect(
      calls.filter(c => c.url.endsWith('/api/mobile/devices/ios')),
    ).toHaveLength(1);
    expect(store.data.get('app-attest.key-id')).toBe('key-1');
    const sends = calls.filter(c => c.url.endsWith('/api/packages/inquiries'));
    sends.forEach(s => {
      expect(s.headers['x-azari-platform']).toBe('ios');
      expect(s.headers['x-azari-key-id']).toBe('key-1');
    });
  });

  it('re-registers when the server no longer knows the key', async () => {
    let n = 0;
    const { client, bridge } = setup(() => (++n === 1 ? 401 : 201));
    await client.request(
      {
        method: 'POST',
        path: '/api/packages/inquiries',
        body: new JsonBody({}),
      },
      ok,
    );
    expect(bridge.generateAppAttestKey).toHaveBeenCalledTimes(2);
  });
});
