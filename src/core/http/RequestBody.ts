import { IntegrityProtocol } from '../security/IntegrityProtocol';

/** A file already copied into the app sandbox, ready to upload. */
export interface UploadFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

/**
 * Request payload. Each body knows how to serialize itself and how it is bound
 * into the integrity signature, so the client never special-cases body types.
 */
export abstract class RequestBody {
  abstract readonly contentType: string | null;
  abstract serialize(): string | FormData;
  abstract bodySha256Hex(): string;
}

export class JsonBody extends RequestBody {
  readonly contentType = 'application/json';
  private readonly encoded: string;

  constructor(value: unknown) {
    super();
    // Serialize once: the signed hash must cover the exact bytes sent.
    this.encoded = JSON.stringify(value);
  }

  serialize(): string {
    return this.encoded;
  }

  bodySha256Hex(): string {
    return IntegrityProtocol.bodySha256Hex(this.encoded);
  }
}

export class MultipartBody extends RequestBody {
  // Let the native layer set the multipart boundary.
  readonly contentType = null;

  constructor(
    private readonly fields: Readonly<Record<string, string>>,
    private readonly files: Readonly<Record<string, UploadFile>> = {},
  ) {
    super();
  }

  serialize(): FormData {
    const form = new FormData();
    for (const [name, value] of Object.entries(this.fields))
      form.append(name, value);
    for (const [name, file] of Object.entries(this.files)) {
      // React Native's FormData accepts a { uri, name, type } descriptor for files.
      form.append(name, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
    }
    return form;
  }

  /** Multipart bodies are bound as the empty body (see IntegrityProtocol). */
  bodySha256Hex(): string {
    return IntegrityProtocol.emptyBodySha256Hex;
  }
}
