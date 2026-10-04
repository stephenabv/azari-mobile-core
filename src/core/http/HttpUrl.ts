/**
 * Minimal, strict URL parsing. React Native's URL polyfill does not implement
 * most accessors, so the app parses the few shapes it accepts itself.
 * Userinfo (`user:pass@`) is always rejected.
 */
export interface ParsedHttpUrl {
  scheme: 'http' | 'https';
  host: string;
  port: number | null;
  path: string;
  query: string;
}

const HTTP_URL =
  /^(https?):\/\/([a-z0-9.-]+|\[[0-9a-f:]+\])(?::(\d{1,5}))?(\/[^?#\s]*)?(\?[^#\s]*)?(#\S*)?$/i;

export const LOOPBACK_HOSTS: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  // Android emulator alias for the host machine.
  '10.0.2.2',
]);

export const HttpUrl = {
  parse(value: string): ParsedHttpUrl | null {
    const match = HTTP_URL.exec(value.trim());
    if (!match) return null;
    const [, scheme, host, port, path, query] = match;
    if (!scheme || !host) return null;
    const portNumber = port ? Number(port) : null;
    if (portNumber !== null && (portNumber < 1 || portNumber > 65535))
      return null;
    return {
      scheme: scheme.toLowerCase() as 'http' | 'https',
      host: host.toLowerCase(),
      port: portNumber,
      path: path ?? '',
      query: query ?? '',
    };
  },

  isHttps(value: string): boolean {
    return HttpUrl.parse(value)?.scheme === 'https';
  },

  origin(url: ParsedHttpUrl): string {
    return `${url.scheme}://${url.host}${url.port ? `:${url.port}` : ''}`;
  },
} as const;
