import React, { type PropsWithChildren, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Screen } from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useScreenCaptureProtection } from '../../ui/hooks/useScreenCaptureProtection';

export interface FormSheetProps {
  title: string;
  subtitle?: string;
  footer: ReactElement;
  testID?: string;
}

/**
 * Layout for modal forms that collect personal details: keyboard aware,
 * pinned submit bar, narrower column on tablets, and screen capture blocked.
 */
export function FormSheet({
  title,
  subtitle,
  footer,
  children,
  testID,
}: PropsWithChildren<FormSheetProps>) {
  useScreenCaptureProtection();
  const { size } = useResponsive();
  return (
    <Screen keyboardAware footer={footer} testID={testID}>
      <View style={size === 'compact' ? null : styles.narrow}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText tone="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  subtitle: { marginTop: 6, marginBottom: 20 },
});
