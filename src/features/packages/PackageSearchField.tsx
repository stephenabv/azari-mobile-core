import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '../../ui/icons';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';

export interface PackageSearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
}

/** Rounded search bar with a leading magnifier and a clear button. */
export function PackageSearchField({
  value,
  onChangeText,
}: PackageSearchFieldProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.box}>
      <Icon name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by size or brand"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        accessibilityLabel="Search packages"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        maxFontSizeMultiplier={1.6}
        style={styles.input}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clear}
        >
          <Icon name="close" size={14} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2.5),
      height: 48,
      paddingHorizontal: t.spacing(3.5),
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceRaised,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    input: {
      flex: 1,
      height: '100%',
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: t.colors.text,
      paddingVertical: 0,
    },
    clear: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
    },
  });
