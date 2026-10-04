import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import type { LocationSuggestion } from '../../data/LocationSearch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Theme } from '../theme/theme';
import { AppText } from './AppText';
import { TextField, type TextFieldProps } from './TextField';

export interface LocationFieldProps
  extends Omit<TextFieldProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (value: string) => void;
  onSelect?: (suggestion: LocationSuggestion) => void;
}

/**
 * Text field with Philippine place suggestions. Typing is never blocked:
 * suggestions are a convenience and failures stay silent, as on the website.
 */
export function LocationField({
  value,
  onChangeText,
  onSelect,
  ...field
}: LocationFieldProps) {
  const { locations, logger } = useServices();
  const styles = useThemedStyles(createStyles);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [armed, setArmed] = useState(false);
  const query = useDebouncedValue(value, 450);

  useEffect(() => {
    if (!armed || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    locations
      .search(query, controller.signal)
      .then(results => {
        if (!controller.signal.aborted) setSuggestions(results);
      })
      .catch(error => {
        if (!controller.signal.aborted)
          logger.warn('Location search failed', { error: String(error) });
      });
    return () => controller.abort();
  }, [armed, query, locations, logger]);

  const choose = (suggestion: LocationSuggestion) => {
    setArmed(false);
    setSuggestions([]);
    onChangeText(suggestion.label.slice(0, 160));
    onSelect?.(suggestion);
  };

  return (
    <View>
      <TextField
        {...field}
        value={value}
        autoComplete="off"
        autoCorrect={false}
        onChangeText={text => {
          setArmed(true);
          onChangeText(text);
        }}
        onBlur={e => {
          // Let a tap on a suggestion land before the list closes.
          setTimeout(() => setArmed(false), 200);
          field.onBlur?.(e);
        }}
      />
      {armed && suggestions.length > 0 ? (
        <View style={styles.list} accessibilityLabel="Location suggestions">
          {suggestions.map(s => (
            <Pressable
              key={s.id}
              onPress={() => choose(s)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <AppText numberOfLines={2}>{s.label}</AppText>
            </Pressable>
          ))}
          <AppText variant="caption" tone="muted" style={styles.attribution}>
            © OpenStreetMap contributors
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    list: {
      marginTop: -t.spacing(3),
      marginBottom: t.spacing(4),
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceRaised,
      overflow: 'hidden',
    },
    item: {
      paddingHorizontal: t.spacing(3),
      paddingVertical: t.spacing(2.5),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    pressed: { backgroundColor: t.colors.surface },
    attribution: {
      paddingHorizontal: t.spacing(3),
      paddingVertical: t.spacing(1.5),
    },
  });
