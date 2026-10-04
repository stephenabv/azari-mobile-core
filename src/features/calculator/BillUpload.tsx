import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import type { UploadFile } from '../../core/http/RequestBody';
import { BILL_ATTACHMENT_RULES } from '../../domain/quotation/ProposalRequest';
import { AppText, Button, Card } from '../../ui/components';

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

/** Optional bill attachment; hidden when the shell provides no file picker. */
export function BillUpload({
  file,
  onChange,
}: {
  file: UploadFile | null;
  onChange: (file: UploadFile | null) => void;
}) {
  const { attachments, logger } = useServices();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!attachments) return null;

  const pick = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await attachments.pickOne(BILL_ATTACHMENT_RULES);
      if (result.status === 'picked') onChange(result.file);
      if (result.status === 'rejected') {
        onChange(null);
        setError(result.reason);
      }
    } catch (e) {
      logger.warn('Bill picker failed', { error: String(e) });
      setError('Could not open the file. Please try another one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={styles.card}>
      {file ? (
        <View style={styles.row}>
          <View style={styles.info}>
            <AppText variant="label" numberOfLines={1}>
              {file.name}
            </AppText>
            <AppText variant="caption" tone="muted">
              {megabytes(file.size)}
            </AppText>
          </View>
          <Button
            label="Remove"
            variant="ghost"
            compact
            onPress={() => onChange(null)}
          />
        </View>
      ) : (
        <>
          <AppText variant="label">Upload your electricity bill</AppText>
          <AppText variant="caption" tone="muted">
            PDF, PNG or JPG up to 10MB. Optional.
          </AppText>
          <Button
            label="Choose file"
            variant="secondary"
            compact
            loading={busy}
            onPress={() => void pick()}
            style={styles.button}
          />
        </>
      )}
      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  info: { flex: 1 },
  button: { alignSelf: 'flex-start', marginTop: 8 },
});
