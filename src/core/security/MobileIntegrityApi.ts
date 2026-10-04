import { z } from 'zod';
import type { ApiClient } from '../http/ApiClient';
import { JsonBody } from '../http/RequestBody';
import type { ChallengePurpose, IntegrityApi } from './IntegrityProvider';

const challengeResponse = z.object({
  success: z.literal(true),
  challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  expiresAt: z.string(),
});

const okResponse = z.object({ success: z.literal(true) });

/** Unsigned calls that bootstrap request signing (challenges, iOS key registration). */
export class MobileIntegrityApi implements IntegrityApi {
  constructor(private readonly client: ApiClient) {}

  async issueChallenge(
    purpose: ChallengePurpose,
  ): Promise<{ challenge: string; expiresAt: string }> {
    const { challenge, expiresAt } = await this.client.request(
      {
        method: 'POST',
        path: '/api/mobile/integrity/challenge',
        body: new JsonBody({ purpose }),
      },
      challengeResponse,
    );
    return { challenge, expiresAt };
  }

  async registerIosKey(input: {
    keyId: string;
    challenge: string;
    attestation: string;
  }): Promise<void> {
    await this.client.request(
      {
        method: 'POST',
        path: '/api/mobile/devices/ios',
        body: new JsonBody(input),
      },
      okResponse,
      { integrity: true },
    );
  }
}
