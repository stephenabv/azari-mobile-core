import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import type { UploadFile } from '../../core/http/RequestBody';
import { BILL_ATTACHMENT_RULES } from '../../domain/quotation/ProposalRequest';
import { AppText, Button } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn, PressableScale } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

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
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
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
    <View style={styles.wrap}>
      {file ? (
        <FadeIn direction="none" fromScale={0.96} style={styles.fileRow}>
          <View style={styles.fileIcon}>
            <Icon name="document" size={20} color={colors.onAccent} />
          </View>
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
        </FadeIn>
      ) : (
        <PressableScale
          onPress={() => void pick()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Choose file"
          accessibilityHint="Upload your electricity bill. PDF, PNG or JPG up to 10MB. Optional."
          accessibilityState={{ busy, disabled: busy }}
          style={styles.drop}
        >
          {busy ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Icon name="upload" size={20} color={colors.text} />
          )}
          <View style={styles.info}>
            <AppText variant="label">Upload your electricity bill</AppText>
            <AppText variant="caption" tone="muted">
              PDF, PNG or JPG up to 10MB. Optional.
            </AppText>
          </View>
          <AppText variant="label" tone="accent">
            Choose file
          </AppText>
        </PressableScale>
      )}
      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { marginBottom: t.spacing(4) },
    drop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      minHeight: 56,
      paddingHorizontal: t.spacing(4),
      paddingVertical: t.spacing(3),
      borderRadius: t.radius.md,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: t.colors.border,
    },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      padding: t.spacing(3),
      borderRadius: t.radius.md,
      backgroundColor: t.colors.accentSoft,
    },
    fileIcon: {
      width: 36,
      height: 36,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    info: { flex: 1 },
    error: { marginTop: t.spacing(2) },
  });
