import {
  checkAttachment,
  type AttachmentResult,
  type AttachmentRules,
  type AttachmentSource,
} from './AttachmentSource';

/** The subset of `@react-native-documents/picker` this source uses. */
export interface DocumentPickerModule {
  pick(options: {
    type: string[];
    mode: 'import';
    allowMultiSelection: false;
  }): Promise<
    ReadonlyArray<{
      uri: string;
      name: string | null;
      type: string | null;
      size: number | null;
    }>
  >;
  keepLocalCopy(options: {
    files: [{ uri: string; fileName: string }];
    destination: 'cachesDirectory';
  }): Promise<
    ReadonlyArray<
      | { status: 'success'; sourceUri: string; localUri: string }
      | { status: 'error'; sourceUri: string; copyError: string }
    >
  >;
  isCancel(error: unknown): boolean;
  types: { pdf: string; images: string };
}

/** Sanitizes a picked filename to a short, path-free ASCII name. */
function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'attachment';
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
  return (cleaned || 'attachment').slice(-100);
}

/**
 * System document picker (Storage Access Framework / UIDocumentPicker). Needs
 * no storage or photo permissions. The picked file is copied into the app's
 * cache so the upload reads a stable sandboxed path.
 */
export class DocumentPickerAttachmentSource implements AttachmentSource {
  constructor(private readonly picker: DocumentPickerModule) {}

  async pickOne(rules: AttachmentRules): Promise<AttachmentResult> {
    let picked;
    try {
      [picked] = await this.picker.pick({
        type: [this.picker.types.pdf, this.picker.types.images],
        mode: 'import',
        allowMultiSelection: false,
      });
    } catch (error) {
      if (this.picker.isCancel(error)) return { status: 'cancelled' };
      throw error;
    }
    if (!picked) return { status: 'cancelled' };

    const candidate = {
      name: safeFileName(picked.name ?? 'attachment'),
      mimeType: (picked.type ?? '').toLowerCase(),
      size: picked.size ?? 0,
    };
    const problem = checkAttachment(candidate, rules);
    if (problem) return { status: 'rejected', reason: problem };

    const [copy] = await this.picker.keepLocalCopy({
      files: [{ uri: picked.uri, fileName: candidate.name }],
      destination: 'cachesDirectory',
    });
    if (!copy || copy.status !== 'success') {
      return {
        status: 'rejected',
        reason: 'The file could not be read. Please try another file.',
      };
    }
    return { status: 'picked', file: { uri: copy.localUri, ...candidate } };
  }
}
