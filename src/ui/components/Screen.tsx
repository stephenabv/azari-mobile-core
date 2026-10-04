import React, {
  useMemo,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../responsive/useResponsive';
import { useTheme } from '../theme/ThemeContext';

export interface ScreenProps {
  /** Pull to refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Pinned below the scroll area (e.g. a submit bar). */
  footer?: ReactElement | null;
  /** Pad the top for the status bar (screens without a header). */
  padTop?: boolean;
  /** Use full width instead of the centered reading column. */
  fullWidth?: boolean;
  keyboardAware?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Scrollable page with safe-area padding and a centered, responsive content column. */
export function Screen({
  children,
  refreshing = false,
  onRefresh,
  footer,
  padTop = false,
  fullWidth = false,
  keyboardAware = false,
  contentStyle,
  testID,
}: PropsWithChildren<ScreenProps>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter, contentWidth } = useResponsive();

  const dynamic = useMemo(
    () =>
      StyleSheet.create({
        root: { backgroundColor: theme.colors.background },
        scroll: {
          paddingTop: (padTop ? insets.top : 0) + theme.spacing(4),
          paddingBottom: (footer ? 0 : insets.bottom) + theme.spacing(8),
          paddingHorizontal: fullWidth ? 0 : gutter,
        },
        column: { width: fullWidth ? '100%' : contentWidth },
        footer: {
          paddingHorizontal: gutter,
          paddingTop: theme.spacing(3),
          paddingBottom: insets.bottom + theme.spacing(3),
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        },
      }),
    [theme, insets, gutter, contentWidth, padTop, footer, fullWidth],
  );

  const body = (
    <View style={[styles.flex, dynamic.root]} testID={testID}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.center, dynamic.scroll]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          ) : undefined
        }
      >
        <View style={[dynamic.column, contentStyle]}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footerBar, dynamic.footer]}>{footer}</View>
      ) : null}
    </View>
  );

  if (!keyboardAware) return body;
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  footerBar: { borderTopWidth: StyleSheet.hairlineWidth },
});
