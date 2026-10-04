import React, { forwardRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';

export interface TextFieldProps
  extends Omit<TextInputProps, 'style' | 'onChange'> {
  label: string;
  error?: string | null;
  helper?: string;
  prefix?: string;
  suffix?: string;
  optional?: boolean;
  onChangeText: (value: string) => void;
}

/** Labelled input with inline error text announced to screen readers. */
export type TextFieldRef = ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextFieldRef, TextFieldProps>(
  function TextFieldInner(
    {
      label,
      error,
      helper,
      prefix,
      suffix,
      optional,
      multiline,
      editable = true,
      ...input
    },
    ref,
  ) {
    const theme = useTheme();
    const styles = useThemedStyles(createStyles);
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.field}>
        <AppText variant="label" style={styles.label}>
          {label}
          {optional ? (
            <AppText variant="caption" tone="muted">
              {' '}
              (optional)
            </AppText>
          ) : null}
        </AppText>
        <View
          style={[
            styles.box,
            multiline && styles.multilineBox,
            focused && styles.focused,
            !!error && styles.errorBox,
            !editable && styles.disabled,
          ]}
        >
          {prefix ? (
            <AppText tone="muted" style={styles.affix}>
              {prefix}
            </AppText>
          ) : null}
          <TextInput
            ref={ref}
            {...input}
            editable={editable}
            multiline={multiline}
            accessibilityLabel={label}
            accessibilityHint={error ?? helper}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
            onFocus={e => {
              setFocused(true);
              input.onFocus?.(e);
            }}
            onBlur={e => {
              setFocused(false);
              input.onBlur?.(e);
            }}
            style={[styles.input, multiline && styles.multiline]}
            maxFontSizeMultiplier={1.6}
          />
          {suffix ? (
            <AppText variant="caption" tone="muted" style={styles.affix}>
              {suffix}
            </AppText>
          ) : null}
        </View>
        {error ? (
          <AppText
            variant="caption"
            tone="danger"
            style={styles.message}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : helper ? (
          <AppText variant="caption" tone="muted" style={styles.message}>
            {helper}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const createStyles = (t: Theme) =>
  StyleSheet.create({
    field: { marginBottom: t.spacing(4) },
    label: { marginBottom: t.spacing(1.5), color: t.colors.text },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      paddingHorizontal: t.spacing(3),
    },
    multilineBox: { alignItems: 'flex-start', paddingVertical: t.spacing(2) },
    focused: { borderColor: t.colors.accent },
    errorBox: { borderColor: t.colors.danger },
    disabled: { opacity: 0.6 },
    input: {
      flex: 1,
      color: t.colors.text,
      fontSize: 16,
      paddingVertical: t.spacing(2),
    },
    multiline: { minHeight: 96, textAlignVertical: 'top' },
    affix: { marginHorizontal: t.spacing(1) },
    message: { marginTop: t.spacing(1) },
  });
