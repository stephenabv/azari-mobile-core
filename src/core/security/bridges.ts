/**
 * Contracts the native security modules in each app shell must satisfy.
 * The core never imports a native module directly; the shell binds them
 * through its PlatformAdapter.
 */

export interface RiskSignals {
  compromised: boolean;
  hookingDetected: boolean;
  debuggerAttached: boolean;
  emulator: boolean;
}

export interface DeviceSecurityBridge {
  getRiskSignals(): Promise<RiskSignals>;
  /** FLAG_SECURE on Android, a secure-field shield on iOS. */
  setScreenCaptureProtection(enabled: boolean): void;
  /** Cryptographically secure random bytes, base64 encoded. */
  getRandomBytes(length: number): Promise<string>;
}

export interface PlayIntegrityBridge {
  preparePlayIntegrity(cloudProjectNumber: string): Promise<void>;
  requestPlayIntegrityToken(requestHash: string): Promise<string>;
}

export interface AppAttestBridge {
  isAppAttestSupported(): Promise<boolean>;
  generateAppAttestKey(): Promise<string>;
  attestAppAttestKey(
    keyId: string,
    clientDataHashBase64: string,
  ): Promise<string>;
  generateAppAttestAssertion(
    keyId: string,
    clientDataHashBase64: string,
  ): Promise<string>;
}
