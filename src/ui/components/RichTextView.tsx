import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import { parseRichText } from '../../domain/journey/RichText';
import { AppText } from './AppText';

const styles = StyleSheet.create({
  paragraph: { marginBottom: 10 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  link: { textDecorationLine: 'underline' },
});

/** Renders admin paragraph HTML as native text; links open externally if allowed. */
export function RichTextView({ html }: { html: string }) {
  const paragraphs = useMemo(() => parseRichText(html), [html]);
  return (
    <View>
      {paragraphs.map((spans, p) => (
        <AppText key={p} style={styles.paragraph}>
          {spans.map((span, i) => (
            <AppText
              key={i}
              tone={span.href ? 'accent' : 'default'}
              style={[
                span.bold && styles.bold,
                span.italic && styles.italic,
                span.href ? styles.link : null,
              ]}
              onPress={
                span.href ? () => void ExternalLinks.open(span.href) : undefined
              }
              accessibilityRole={span.href ? 'link' : undefined}
            >
              {span.text}
            </AppText>
          ))}
        </AppText>
      ))}
    </View>
  );
}
