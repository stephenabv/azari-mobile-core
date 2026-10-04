import React, { useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../core/media/ExternalLinks';
import { useMobileConfig } from '../data/queries';
import { isBelowMinimum } from '../domain/versioning/Version';
import { AppText, Button } from '../ui/components';
import { useThemedStyles } from '../ui/theme/ThemeContext';
import type { Theme } from '../ui/theme/theme';
import { useServices } from './ServicesContext';

/**
 * Runs before the app renders:
 * - blocks versions below the server's minimum (forms would be rejected anyway);
 * - warns once on rooted / hooked devices, where secure forms will not send.
 * Neither check blocks on network errors, so the catalog still works offline.
 */
export function AppGate({ children }: PropsWithChildren) {
  const { config, deviceSecurity, logger } = useServices();
  const styles = useThemedStyles(createStyles);
  const { data: remote } = useMobileConfig();
  const [risky, setRisky] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    let active = true;
    deviceSecurity
      .getRiskSignals()
      .then(signals => {
        if (active && (signals.compromised || signals.hookingDetected))
          setRisky(true);
      })
      .catch(error =>
        logger.warn('Risk signals unavailable', { error: String(error) }),
      );
    return () => {
      active = false;
    };
  }, [deviceSecurity, logger]);

  if (
    remote &&
    isBelowMinimum(config.appVersion, remote.minimumVersion[config.platform])
  ) {
    return (
      <View style={styles.center} testID="update-required">
        <AppText variant="title" align="center">
          Update required
        </AppText>
        <AppText tone="muted" align="center">
          This version of Azari Solar is no longer supported. Please update to
          continue.
        </AppText>
        <Button
          label="Update now"
          onPress={() => void ExternalLinks.open(config.storeUrl)}
        />
      </View>
    );
  }

  if (risky && !acknowledged) {
    return (
      <View style={styles.center} testID="device-warning">
        <AppText variant="title" align="center">
          Device security warning
        </AppText>
        <AppText tone="muted" align="center">
          This device appears to be modified. You can browse, but quotation and
          inquiry forms cannot be sent from it. You can also reach us through
          azari.solar.
        </AppText>
        <Button label="Continue" onPress={() => setAcknowledged(true)} />
      </View>
    );
  }

  return <>{children}</>;
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing(4),
      padding: t.spacing(8),
      backgroundColor: t.colors.background,
    },
  });
