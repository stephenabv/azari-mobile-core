import type { PlayIntegrityBridge } from './bridges';
import { IntegrityProtocol } from './IntegrityProtocol';
import { IntegrityProvider, type IntegrityEvidence } from './IntegrityProvider';

/**
 * Android: Play Integrity Standard API. The token provider is prepared once
 * per process, then each request gets a token whose `requestHash` binds it to
 * the canonical client data.
 */
export class PlayIntegrityProvider extends IntegrityProvider {
  readonly platform = 'android' as const;

  private prepared: Promise<void> | null = null;

  constructor(
    private readonly bridge: PlayIntegrityBridge,
    private readonly cloudProjectNumber: string,
  ) {
    super();
  }

  async createEvidence(clientData: string): Promise<IntegrityEvidence> {
    await this.ensurePrepared();
    const token = await this.bridge.requestPlayIntegrityToken(
      IntegrityProtocol.playRequestHash(clientData),
    );
    return { token };
  }

  override async reset(): Promise<void> {
    this.prepared = null;
  }

  private ensurePrepared(): Promise<void> {
    if (!this.prepared) {
      this.prepared = this.bridge
        .preparePlayIntegrity(this.cloudProjectNumber)
        .catch(error => {
          // Allow a later call to retry instead of caching the failure.
          this.prepared = null;
          throw error;
        });
    }
    return this.prepared;
  }
}
