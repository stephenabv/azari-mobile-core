import { createMMKV } from 'react-native-mmkv';

/**
 * Fast synchronous store for NON-sensitive data only (cached public content,
 * UI preferences). Anything personal or secret belongs in SecureStore.
 */
export interface KeyValueStore {
  getJson<T>(key: string): T | null;
  setJson(key: string, value: unknown): void;
  remove(key: string): void;
}

type MmkvInstance = ReturnType<typeof createMMKV>;

export class MmkvKeyValueStore implements KeyValueStore {
  private readonly storage: MmkvInstance;

  constructor(id = 'azari.public-cache') {
    this.storage = createMMKV({ id });
  }

  getJson<T>(key: string): T | null {
    const raw = this.storage.getString(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.storage.remove(key);
      return null;
    }
  }

  setJson(key: string, value: unknown): void {
    this.storage.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.storage.remove(key);
  }
}

/** In-memory fallback, used in tests and when the native store fails to open. */
export class MemoryKeyValueStore implements KeyValueStore {
  private readonly map = new Map<string, string>();

  getJson<T>(key: string): T | null {
    const raw = this.map.get(key);
    return raw === undefined ? null : (JSON.parse(raw) as T);
  }

  setJson(key: string, value: unknown): void {
    this.map.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.map.delete(key);
  }
}
