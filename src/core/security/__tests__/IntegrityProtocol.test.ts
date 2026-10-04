import { Encoding } from '../encoding';
import { IntegrityProtocol } from '../IntegrityProtocol';

// Published SHA-256 test vectors (FIPS 180-2).
const ABC_HEX =
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const EMPTY_HEX =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('Encoding', () => {
  it('hashes with SHA-256', () => {
    expect(Encoding.hex(Encoding.sha256('abc'))).toBe(ABC_HEX);
    expect(Encoding.hex(Encoding.sha256(new Uint8Array(0)))).toBe(EMPTY_HEX);
  });

  it('encodes UTF-8 before hashing', () => {
    expect([...Encoding.utf8('ñ')]).toEqual([0xc3, 0xb1]);
  });

  it('encodes base64 with padding and base64url without', () => {
    const digest = Encoding.sha256('abc');
    expect(Encoding.base64(digest)).toBe(
      'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
    );
    expect(Encoding.base64Url(digest)).toBe(
      'ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0',
    );
    expect(Encoding.base64(Encoding.utf8('ab'))).toBe('YWI=');
    expect(Encoding.base64(Encoding.utf8('a'))).toBe('YQ==');
  });
});

describe('IntegrityProtocol (wire contract with azari-service)', () => {
  it('builds the canonical request client data', () => {
    const clientData = IntegrityProtocol.requestClientData({
      challenge: 'c'.repeat(43),
      method: 'post',
      path: '/api/talk/send',
      bodySha256Hex: IntegrityProtocol.bodySha256Hex('abc'),
    });
    expect(clientData).toBe(
      [
        'azari-integrity-v1',
        'c'.repeat(43),
        'POST',
        '/api/talk/send',
        ABC_HEX,
      ].join('\n'),
    );
  });

  it('binds a missing body as the empty body', () => {
    expect(IntegrityProtocol.emptyBodySha256Hex).toBe(EMPTY_HEX);
    expect(IntegrityProtocol.bodySha256Hex(null)).toBe(EMPTY_HEX);
  });

  it('encodes the Play requestHash as unpadded base64url and the App Attest hash as base64', () => {
    expect(IntegrityProtocol.playRequestHash('abc')).toBe(
      'ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0',
    );
    expect(IntegrityProtocol.clientDataHashBase64('abc')).toBe(
      'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
    );
  });

  it('builds attestation client data', () => {
    expect(IntegrityProtocol.attestationClientData('ch', 'key')).toBe(
      'azari-attest-v1\nch\nkey',
    );
  });
});
