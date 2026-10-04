export type MobilePlatform = 'ios' | 'android';

export type ChallengePurpose = 'attest' | 'request';

/** Platform evidence attached to one protected request. */
export interface IntegrityEvidence {
  token: string;
  /** App Attest key identifier (iOS only). */
  keyId?: string;
}

/** Server endpoints the providers need (POST /api/mobile/...). */
export interface IntegrityApi {
  issueChallenge(
    purpose: ChallengePurpose,
  ): Promise<{ challenge: string; expiresAt: string }>;
  registerIosKey(input: {
    keyId: string;
    challenge: string;
    attestation: string;
  }): Promise<void>;
}

/** Raised when the device cannot produce evidence at all (unsupported hardware, no Play services). */
export class IntegrityUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrityUnavailableError';
  }
}

/**
 * Produces platform-attested evidence over canonical client data
 * (see IntegrityProtocol). One subclass per platform attestation service.
 */
export abstract class IntegrityProvider {
  abstract readonly platform: MobilePlatform;

  abstract createEvidence(clientData: string): Promise<IntegrityEvidence>;

  /**
   * Forget any server-registered key material so the next call re-registers.
   * Called when the server answers INTEGRITY_KEY_UNKNOWN.
   */
  async reset(): Promise<void> {}
}
