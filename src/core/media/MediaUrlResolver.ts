import { HttpUrl } from '../http/HttpUrl';

const RELATIVE_PATH = /^\/[A-Za-z0-9/_.%-]*$/;
const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/**
 * Turns image/video references from the API into URLs the app may load.
 * Server-relative paths resolve against the API origin; absolute URLs must be
 * https. Anything else (javascript:, file:, http: in production) is dropped.
 */
export class MediaUrlResolver {
  constructor(private readonly apiBaseUrl: string) {}

  resolve(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    if (
      RELATIVE_PATH.test(trimmed) &&
      !trimmed.startsWith('//') &&
      !trimmed.includes('..')
    ) {
      return `${this.apiBaseUrl}${trimmed}`;
    }
    if (DATA_IMAGE.test(trimmed)) return trimmed;

    const parsed = HttpUrl.parse(trimmed);
    if (!parsed) return null;
    if (parsed.scheme === 'https') return trimmed;
    // Allow the configured origin itself (local development over http).
    return trimmed.startsWith(`${this.apiBaseUrl}/`) ? trimmed : null;
  }

  resolveAll(values: readonly (string | null | undefined)[]): string[] {
    return values
      .map(v => this.resolve(v))
      .filter((v): v is string => v !== null);
  }
}
