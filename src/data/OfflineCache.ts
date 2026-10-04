import type { Logger } from '../core/logging/Logger';
import type { KeyValueStore } from '../core/storage/KeyValueStore';

interface Entry<T> {
  savedAt: number;
  value: T;
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Network-first cache for PUBLIC catalog data: the last good response is kept
 * so the app still shows packages and content while offline.
 */
export class OfflineCache {
  constructor(
    private readonly store: KeyValueStore,
    private readonly logger: Logger,
    private readonly version = 'v1',
  ) {}

  async load<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const storageKey = `${this.version}:${key}`;
    try {
      const value = await fetcher();
      this.store.setJson(storageKey, {
        savedAt: Date.now(),
        value,
      } satisfies Entry<T>);
      return value;
    } catch (error) {
      const cached = this.store.getJson<Entry<T>>(storageKey);
      if (cached && Date.now() - cached.savedAt < MAX_AGE_MS) {
        this.logger.info('Serving cached data while offline', { key });
        return cached.value;
      }
      throw error;
    }
  }
}
