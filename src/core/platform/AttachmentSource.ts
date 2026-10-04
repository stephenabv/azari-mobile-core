import type { UploadFile } from '../http/RequestBody';

export interface AttachmentRules {
  maxSizeBytes: number;
  /** Lowercase MIME types, e.g. `application/pdf`. */
  allowedMimeTypes: readonly string[];
  /** Lowercase extensions including the dot, e.g. `.pdf`. */
  allowedExtensions: readonly string[];
}

export type AttachmentResult =
  | { status: 'picked'; file: UploadFile }
  | { status: 'cancelled' }
  | { status: 'rejected'; reason: string };

/** Lets the user choose one local file for upload. */
export interface AttachmentSource {
  pickOne(rules: AttachmentRules): Promise<AttachmentResult>;
}

/** Shared validation so every AttachmentSource enforces the same limits. */
export function checkAttachment(
  file: { name: string; mimeType: string; size: number },
  rules: AttachmentRules,
): string | null {
  const name = file.name.toLowerCase();
  const mime = file.mimeType.toLowerCase();
  if (
    !rules.allowedMimeTypes.includes(mime) ||
    !rules.allowedExtensions.some(ext => name.endsWith(ext))
  ) {
    return 'Only PDF, PNG, JPG, and JPEG files are allowed.';
  }
  if (!Number.isFinite(file.size) || file.size <= 0)
    return 'The selected file is empty.';
  if (file.size > rules.maxSizeBytes) {
    return `File must not exceed ${Math.round(
      rules.maxSizeBytes / 1024 / 1024,
    )}MB.`;
  }
  return null;
}
