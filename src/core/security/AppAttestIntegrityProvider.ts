import type { Logger } from '../logging/Logger';
import type { SecureStore } from '../storage/SecureStore';
import type { AppAttestBridge } from './bridges';
import { IntegrityProtocol } from './IntegrityProtocol';
import {
  IntegrityProvider,
  IntegrityUnavailableError,
  type IntegrityApi,
  type IntegrityEvidence,
} from './IntegrityProvider';

const KEY_ID_STORAGE_KEY = 'app-attest.key-id';

/**
 * iOS: App Attest. A Secure Enclave key is generated and attested by Apple
 * once, registered with the server, and then signs one assertion per request.
 */
export class AppAttestIntegrityProvider extends IntegrityProvider {
  readonly platform = 'ios' as const;

  private keyId: Promise<string> | null = null;

  constructor(
    private readonly bridge: AppAttestBridge,
    private readonly secureStore: SecureStore,
    private readonly api: IntegrityApi,
    private readonly logger: Logger,
  ) {
    super();
  }

  async createEvidence(clientData: string): Promise<IntegrityEvidence> {
    const keyId = await this.registeredKeyId();
    const token = await this.bridge.generateAppAttestAssertion(
      keyId,
      IntegrityProtocol.clientDataHashBase64(clientData),
    );
    return { keyId, token };
  }

  override async reset(): Promise<void> {
    this.keyId = null;
    await this.secureStore.remove(KEY_ID_STORAGE_KEY);
  }

  /** Concurrent callers share one registration instead of attesting twice. */
  private registeredKeyId(): Promise<string> {
    if (!this.keyId) {
      this.keyId = this.loadOrRegister().catch(error => {
        this.keyId = null;
        throw error;
      });
    }
    return this.keyId;
  }

  private async loadOrRegister(): Promise<string> {
    const stored = await this.secureStore.get(KEY_ID_STORAGE_KEY);
    if (stored) return stored;

    if (!(await this.bridge.isAppAttestSupported())) {
      throw new IntegrityUnavailableError(
        'App Attest is not supported on this device.',
      );
    }

    const keyId = await this.bridge.generateAppAttestKey();
    const { challenge } = await this.api.issueChallenge('attest');
    const attestation = await this.bridge.attestAppAttestKey(
      keyId,
      IntegrityProtocol.clientDataHashBase64(
        IntegrityProtocol.attestationClientData(challenge, keyId),
      ),
    );
    await this.api.registerIosKey({ keyId, challenge, attestation });
    await this.secureStore.set(KEY_ID_STORAGE_KEY, keyId);
    this.logger.info('App Attest key registered');
    return keyId;
  }
}
