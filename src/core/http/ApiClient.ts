import type { z } from 'zod';
import type { Logger } from '../logging/Logger';
import {
  ApiError,
  IntegrityRejectedError,
  InvalidResponseError,
  NetworkError,
  NotFoundError,
  RateLimitedError,
  ServerError,
  ValidationError,
  type RecoverableIntegrityCode,
} from './ApiError';
import type { RateLimitMonitor } from './RateLimitMonitor';
import type { RequestBody } from './RequestBody';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  /** Absolute API path starting with `/api/`, without query string. */
  path: string;
  query?: Readonly<Record<string, string>>;
  body?: RequestBody;
  headers?: Readonly<Record<string, string>>;
}

export interface RequestOptions {
  /** Treat 401/403/503 as integrity verdicts (signed requests only). */
  integrity?: boolean;
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface ApiClientOptions {
  baseUrl: string;
  timeoutMs: number;
  logger: Logger;
  rateLimits: RateLimitMonitor;
  userAgent: string;
  fetch?: FetchLike;
}

const SAFE_PATH = /^\/api\/[A-Za-z0-9/_.-]*$/;
const RECOVERABLE_CODES: ReadonlySet<string> = new Set([
  'INTEGRITY_KEY_UNKNOWN',
  'INTEGRITY_CHALLENGE_INVALID',
]);
const DEFAULT_RETRY_AFTER_SEC = 60;
const MAX_RETRY_AFTER_SEC = 3600;

/**
 * Thin, typed HTTP client for azari-service. Every response is validated
 * against a schema before it reaches the UI, and every failure becomes a
 * typed ApiError.
 */
export class ApiClient {
  private readonly fetchImpl: FetchLike;

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
  }

  get baseUrl(): string {
    return this.options.baseUrl;
  }

  async request<S extends z.ZodType>(
    request: ApiRequest,
    schema: S,
    options: RequestOptions = {},
  ): Promise<z.output<S>> {
    const response = await this.execute(request);
    const payload = await ApiClient.readJson(response);

    if (!response.ok) throw this.toError(response, payload, options);

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      this.options.logger.warn('API response failed validation', {
        path: request.path,
        issues: parsed.error.issues.slice(0, 3).map(i => i.path.join('.')),
      });
      throw new InvalidResponseError(response.status);
    }
    return parsed.data;
  }

  private async execute(request: ApiRequest): Promise<Response> {
    if (!SAFE_PATH.test(request.path) || request.path.includes('..')) {
      throw new Error(`Refusing to call unsafe API path: ${request.path}`);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.options.userAgent,
      ...request.headers,
    };
    const body = request.body?.serialize();
    if (request.body?.contentType)
      headers['Content-Type'] = request.body.contentType;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    try {
      return await this.fetchImpl(this.url(request), {
        method: request.method,
        headers,
        body,
        signal: controller.signal,
        credentials: 'omit',
      });
    } catch {
      throw new NetworkError(controller.signal.aborted);
    } finally {
      clearTimeout(timer);
    }
  }

  private url(request: ApiRequest): string {
    const query = request.query
      ? Object.entries(request.query)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')
      : '';
    return `${this.options.baseUrl}${request.path}${query ? `?${query}` : ''}`;
  }

  private toError(
    response: Response,
    payload: unknown,
    options: RequestOptions,
  ): ApiError {
    const body = (payload ?? {}) as {
      message?: unknown;
      error?: { code?: unknown } | unknown;
      errors?: { fieldErrors?: Record<string, string[]> };
    };
    const message =
      typeof body.message === 'string' ? body.message : 'Request failed';

    switch (true) {
      case response.status === 429: {
        const retryAfter = ApiClient.retryAfterSeconds(
          response.headers.get('Retry-After'),
        );
        this.options.rateLimits.report(retryAfter);
        return new RateLimitedError(retryAfter);
      }
      case options.integrity && [401, 403, 503].includes(response.status): {
        const code = (body.error as { code?: unknown } | undefined)?.code;
        return new IntegrityRejectedError(
          response.status,
          typeof code === 'string' && RECOVERABLE_CODES.has(code)
            ? (code as RecoverableIntegrityCode)
            : null,
        );
      }
      case response.status === 400:
        return new ValidationError(message, body.errors?.fieldErrors ?? {});
      case response.status === 404:
        return new NotFoundError();
      default:
        return new ServerError(message, response.status);
    }
  }

  private static async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private static retryAfterSeconds(header: string | null): number {
    const seconds = Number.parseInt(header ?? '', 10);
    if (!Number.isFinite(seconds) || seconds <= 0)
      return DEFAULT_RETRY_AFTER_SEC;
    return Math.min(seconds, MAX_RETRY_AFTER_SEC);
  }
}
