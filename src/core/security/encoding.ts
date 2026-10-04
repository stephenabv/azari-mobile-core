/* eslint-disable no-bitwise -- base64 packing is inherently bitwise */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Byte encodings used by the integrity protocol. Implemented locally so the
 * result never depends on which global `btoa`/`TextEncoder` the JS engine ships.
 */
export const Encoding = {
  utf8(text: string): Uint8Array {
    return utf8ToBytes(text);
  },

  sha256(data: string | Uint8Array): Uint8Array {
    return sha256(typeof data === 'string' ? utf8ToBytes(data) : data);
  },

  hex(bytes: Uint8Array): string {
    return bytesToHex(bytes);
  },

  /** Standard base64 with padding (RFC 4648 §4). */
  base64(bytes: Uint8Array): string {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i] ?? 0;
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      const triple = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
      out += BASE64_ALPHABET.charAt((triple >> 18) & 63);
      out += BASE64_ALPHABET.charAt((triple >> 12) & 63);
      out +=
        b1 === undefined ? '=' : BASE64_ALPHABET.charAt((triple >> 6) & 63);
      out += b2 === undefined ? '=' : BASE64_ALPHABET.charAt(triple & 63);
    }
    return out;
  },

  /** URL-safe base64 without padding (RFC 4648 §5). */
  base64Url(bytes: Uint8Array): string {
    return Encoding.base64(bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/[=]+$/, '');
  },
} as const;
