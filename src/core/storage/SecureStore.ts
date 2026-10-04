import * as Keychain from 'react-native-keychain';

/** Small secrets (key identifiers, device keys). Values never leave the device. */
export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Keychain (iOS) / Keystore AES-GCM (Android) backed store. Items are bound to
 * this device and only readable while it is unlocked, so they are excluded
 * from backups and device transfers.
 */
export class KeychainSecureStore implements SecureStore {
  constructor(private readonly namespace = 'solar.azari') {}

  async get(key: string): Promise<string | null> {
    const result = await Keychain.getGenericPassword({
      service: this.service(key),
    });
    return result ? result.password : null;
  }

  async set(key: string, value: string): Promise<void> {
    const stored = await Keychain.setGenericPassword(key, value, {
      service: this.service(key),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    });
    if (!stored)
      throw new Error('Secure storage is unavailable on this device.');
  }

  async remove(key: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: this.service(key) });
  }

  private service(key: string): string {
    return `${this.namespace}.${key}`;
  }
}
