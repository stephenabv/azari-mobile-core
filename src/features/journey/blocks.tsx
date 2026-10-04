import React, { type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import type {
  BulletItem,
  ContentBlock,
} from '../../domain/journey/JourneyStep';
import {
  AppText,
  Button,
  Card,
  Grid,
  RemoteImage,
  RichTextView,
} from '../../ui/components';
import { useTheme } from '../../ui/theme/ThemeContext';

type BlockOf<T extends ContentBlock['type']> = Extract<
  ContentBlock,
  { type: T }
>;
type Renderers = {
  [T in ContentBlock['type']]: ComponentType<{ block: BlockOf<T> }>;
};

const open = (url: string | undefined) => () => void ExternalLinks.open(url);

function Bullets({
  items,
  depth = 0,
}: {
  items: readonly BulletItem[];
  depth?: number;
}) {
  return (
    <View style={depth ? styles.nested : null}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <AppText>{depth ? '◦' : '•'}</AppText>
          <View style={styles.bulletBody}>
            <AppText>
              {item.boldLead ? (
                <AppText style={styles.bold}>{`${item.boldLead} `}</AppText>
              ) : null}
              {item.text}
              {item.linkUrl && ExternalLinks.isAllowed(item.linkUrl) ? (
                <AppText
                  tone="accent"
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={open(item.linkUrl)}
                >
                  {` ${item.linkLabel || 'Learn more'}`}
                </AppText>
              ) : null}
            </AppText>
            {item.children?.length ? (
              <Bullets items={item.children} depth={depth + 1} />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const CONTACT_LABELS = {
  whatsapp: 'WhatsApp',
  viber: 'Viber',
  facebook: 'Facebook',
  instagram: 'Instagram',
  email: 'Email',
  phone: 'Phone',
} as const;

/**
 * One renderer per admin block type, mirroring the website registry. Unknown
 * types are dropped by the API schema; a new type is one entry here.
 */
const RENDERERS: Renderers = {
  heading: ({ block }) => (
    <AppText
      variant={block.level <= 2 ? 'title' : 'heading'}
      accessibilityRole="header"
      style={styles.block}
    >
      {block.text}
    </AppText>
  ),
  paragraph: ({ block }) => <RichTextView html={block.html} />,
  bullet_list: ({ block }) => (
    <View style={styles.block}>
      <Bullets items={block.items} />
    </View>
  ),
  link_group: ({ block }) => (
    <View style={[styles.block, styles.row]}>
      {block.links
        .filter(l => ExternalLinks.isAllowed(l.url))
        .map(l => (
          <Button
            key={`${l.label}-${l.url}`}
            label={l.label}
            compact
            variant={l.style === 'button' ? 'primary' : 'ghost'}
            onPress={open(l.url)}
          />
        ))}
    </View>
  ),
  button: ({ block }) =>
    ExternalLinks.isAllowed(block.url) ? (
      <Button
        label={block.label}
        onPress={open(block.url)}
        style={styles.block}
      />
    ) : null,
  image: ({ block }) => (
    <View style={styles.block}>
      <RemoteImage
        source={block.src}
        aspectRatio={16 / 9}
        accessibilityLabel={block.alt}
        style={styles.image}
      />
      {block.caption ? (
        <AppText variant="caption" tone="muted">
          {block.caption}
        </AppText>
      ) : null}
    </View>
  ),
  partner_grid: ({ block }) => (
    <View style={styles.block}>
      <Grid maxColumns={3} minItemWidth={140} gap={8}>
        {block.items.map(p => (
          <Card key={p.name} style={styles.partner}>
            {p.logoUrl ? (
              <RemoteImage
                source={p.logoUrl}
                aspectRatio={2}
                resizeMode="contain"
                accessibilityLabel={p.name}
                style={styles.logo}
              />
            ) : null}
            <AppText variant="label" align="center">
              {p.name}
            </AppText>
            {p.downloadUrl && ExternalLinks.isAllowed(p.downloadUrl) ? (
              <Button
                label="Download"
                variant="ghost"
                compact
                onPress={open(p.downloadUrl)}
              />
            ) : null}
          </Card>
        ))}
      </Grid>
    </View>
  ),
  contact_channels: ({ block }) => (
    <View style={[styles.block, styles.row]}>
      {block.channels
        .filter(c => ExternalLinks.isAllowed(c.url))
        .map(c => (
          <Button
            key={`${c.kind}-${c.value}`}
            label={`${CONTACT_LABELS[c.kind]}: ${c.value}`}
            variant="secondary"
            compact
            onPress={open(c.url)}
          />
        ))}
    </View>
  ),
  divider: () => <Divider />,
};

function Divider() {
  const theme = useTheme();
  return (
    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
  );
}

export function JourneyBlock({ block }: { block: ContentBlock }) {
  const Renderer = RENDERERS[block.type] as
    | ComponentType<{ block: ContentBlock }>
    | undefined;
  return Renderer ? <Renderer block={block} /> : null;
}

const styles = StyleSheet.create({
  block: { marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nested: { marginTop: 4, marginLeft: 8 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletBody: { flex: 1 },
  bold: { fontWeight: '700' },
  link: { textDecorationLine: 'underline' },
  image: { borderRadius: 12, marginBottom: 6 },
  partner: { alignItems: 'center', gap: 6, padding: 12 },
  logo: { backgroundColor: 'transparent' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
});
