/**
 * Typed failures from the API. Screens branch on the class (or `kind`) to pick
 * a message, so a new failure mode is a new subclass, not a new status check.
 */
export abstract class ApiError extends Error {
  abstract readonly kind:
    | 'network'
    | 'rate-limited'
    | 'validation'
    | 'integrity'
    | 'not-found'
    | 'server'
    | 'invalid-response';

  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = new.target.name;
  }

  /** Text that is safe and useful to show to a customer. */
  abstract get userMessage(): string;
}

export class NetworkError extends ApiError {
  readonly kind = 'network' as const;

  constructor(readonly timedOut: boolean) {
    super(timedOut ? 'Request timed out' : 'Network request failed', null);
  }

  get userMessage(): string {
    return this.timedOut
      ? 'The server took too long to respond. Please try again.'
      : 'You appear to be offline. Check your connection and try again.';
  }
}

export class RateLimitedError extends ApiError {
  readonly kind = 'rate-limited' as const;

  constructor(readonly retryAfterSec: number) {
    super('Too many requests', 429);
  }

  get userMessage(): string {
    return `Too many requests. Please try again in ${this.retryAfterSec} seconds.`;
  }
}

export class ValidationError extends ApiError {
  readonly kind = 'validation' as const;

  constructor(
    private readonly serverMessage: string,
    readonly fieldErrors: Readonly<Record<string, readonly string[]>> = {},
  ) {
    super(serverMessage, 400);
  }

  get userMessage(): string {
    const first = Object.values(this.fieldErrors).flat()[0];
    return first ?? this.serverMessage;
  }
}

export type RecoverableIntegrityCode =
  | 'INTEGRITY_KEY_UNKNOWN'
  | 'INTEGRITY_CHALLENGE_INVALID';

export class IntegrityRejectedError extends ApiError {
  readonly kind = 'integrity' as const;

  constructor(status: number, readonly code: RecoverableIntegrityCode | null) {
    super('Client integrity verification failed', status);
  }

  get recoverable(): boolean {
    return this.code !== null;
  }

  get userMessage(): string {
    return this.status === 503
      ? 'Secure submission is temporarily unavailable. Please try again shortly.'
      : 'This device could not be verified, so the form was not sent. Please make sure the app is installed from the official store.';
  }
}

export class NotFoundError extends ApiError {
  readonly kind = 'not-found' as const;

  constructor() {
    super('Not found', 404);
  }

  get userMessage(): string {
    return 'We could not find what you were looking for.';
  }
}

export class ServerError extends ApiError {
  readonly kind = 'server' as const;

  get userMessage(): string {
    return 'Something went wrong on our side. Please try again.';
  }
}

export class InvalidResponseError extends ApiError {
  readonly kind = 'invalid-response' as const;

  constructor(status: number) {
    super('Unexpected response from server', status);
  }

  get userMessage(): string {
    return 'We received an unexpected response. Please update the app or try again later.';
  }
}

export function userMessageFor(error: unknown): string {
  return error instanceof ApiError
    ? error.userMessage
    : 'Something went wrong. Please try again.';
}
