import { Encoding } from './encoding';

/**
 * Wire contract shared with azari-service
 * (`azari-backend/src/services/integrity/protocol.ts`). Any change here is a
 * breaking protocol change: bump the tag on both sides together.
 *
 * A request token signs a hash of
 *
 *   azari-integrity-v1 \n <challenge> \n <METHOD> \n <path> \n <sha256(body) hex>
 *
 * so it is valid for exactly one server challenge, one endpoint and, for JSON
 * requests, one body. Multipart bodies are bound as the empty body.
 */
export const IntegrityProtocol = {
  requestTag: 'azari-integrity-v1',
  attestTag: 'azari-attest-v1',

  headers: {
    platform: 'X-Azari-Platform',
    challenge: 'X-Azari-Challenge',
    token: 'X-Azari-Integrity',
    keyId: 'X-Azari-Key-Id',
  },

  emptyBodySha256Hex: Encoding.hex(Encoding.sha256(new Uint8Array(0))),

  bodySha256Hex(body: string | null | undefined): string {
    return body
      ? Encoding.hex(Encoding.sha256(body))
      : IntegrityProtocol.emptyBodySha256Hex;
  },

  requestClientData(input: {
    challenge: string;
    method: string;
    path: string;
    bodySha256Hex: string;
  }): string {
    return [
      IntegrityProtocol.requestTag,
      input.challenge,
      input.method.toUpperCase(),
      input.path,
      input.bodySha256Hex.toLowerCase(),
    ].join('\n');
  },

  attestationClientData(challenge: string, keyId: string): string {
    return [IntegrityProtocol.attestTag, challenge, keyId].join('\n');
  },

  /** Play Integrity `requestHash`: base64url(sha256(clientData)), no padding. */
  playRequestHash(clientData: string): string {
    return Encoding.base64Url(Encoding.sha256(clientData));
  },

  /** App Attest `clientDataHash`: standard base64 of sha256(clientData). */
  clientDataHashBase64(clientData: string): string {
    return Encoding.base64(Encoding.sha256(clientData));
  },
} as const;
