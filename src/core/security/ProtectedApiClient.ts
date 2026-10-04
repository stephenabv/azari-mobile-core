import type { z } from 'zod';
import { IntegrityRejectedError } from '../http/ApiError';
import type { ApiClient, ApiRequest } from '../http/ApiClient';
import type { Logger } from '../logging/Logger';
import { IntegrityProtocol } from './IntegrityProtocol';
import type { IntegrityApi, IntegrityProvider } from './IntegrityProvider';

const MAX_ATTEMPTS = 2;

/**
 * Decorates ApiClient for mutating routes: each attempt fetches a single-use
 * challenge, binds it to the exact method, path and body, and attaches the
 * platform evidence. A recoverable rejection (expired challenge, unknown iOS
 * key) is retried once; anything else surfaces to the caller.
 */
export class ProtectedApiClient {
  constructor(
    private readonly client: ApiClient,
    private readonly provider: IntegrityProvider,
    private readonly integrityApi: IntegrityApi,
    private readonly logger: Logger,
  ) {}

  async request<S extends z.ZodType>(
    request: ApiRequest,
    schema: S,
  ): Promise<z.output<S>> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        const headers = await this.integrityHeaders(request);
        return await this.client.request(
          { ...request, headers: { ...request.headers, ...headers } },
          schema,
          { integrity: true },
        );
      } catch (error) {
        if (
          !(error instanceof IntegrityRejectedError) ||
          !error.recoverable ||
          attempt >= MAX_ATTEMPTS
        ) {
          throw error;
        }
        this.logger.warn('Integrity check needs a retry', { code: error.code });
        if (error.code === 'INTEGRITY_KEY_UNKNOWN') await this.provider.reset();
      }
    }
  }

  private async integrityHeaders(
    request: ApiRequest,
  ): Promise<Record<string, string>> {
    const { challenge } = await this.integrityApi.issueChallenge('request');
    const clientData = IntegrityProtocol.requestClientData({
      challenge,
      method: request.method,
      path: request.path,
      bodySha256Hex:
        request.body?.bodySha256Hex() ?? IntegrityProtocol.emptyBodySha256Hex,
    });
    const evidence = await this.provider.createEvidence(clientData);

    const { headers } = IntegrityProtocol;
    return {
      [headers.platform]: this.provider.platform,
      [headers.challenge]: challenge,
      [headers.token]: evidence.token,
      ...(evidence.keyId ? { [headers.keyId]: evidence.keyId } : {}),
    };
  }
}
