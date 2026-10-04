export interface TextSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  /** Only set for https/mailto/tel links; anything else renders as plain text. */
  href: string | null;
}

export type RichParagraph = TextSpan[];

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
};

function decodeEntities(text: string): string {
  return text.replace(
    /&(#\d+|#x[0-9a-f]+|[a-z]+);/gi,
    (whole, name: string) => {
      const lower = name.toLowerCase();
      if (ENTITIES[lower] !== undefined) return ENTITIES[lower];
      const code = lower.startsWith('#x')
        ? parseInt(lower.slice(2), 16)
        : lower.startsWith('#')
        ? parseInt(lower.slice(1), 10)
        : NaN;
      return Number.isFinite(code) && code > 0 && code < 0x110000
        ? String.fromCodePoint(code)
        : whole;
    },
  );
}

const SAFE_HREF = /^(https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:\+?[0-9-]+)$/i;
const TAG = /<\/?([a-z0-9]+)([^>]*)>/gi;
const BLOCK_TAGS = new Set([
  'p',
  'div',
  'li',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
]);

/**
 * Converts the admin's paragraph HTML into styled text spans for native Text.
 * Nothing is ever evaluated: unknown tags are dropped, attributes other than a
 * safe link href are ignored, and there is no WebView.
 */
export function parseRichText(html: string): RichParagraph[] {
  const paragraphs: RichParagraph[] = [];
  let current: TextSpan[] = [];
  let bold = 0;
  let italic = 0;
  let href: string | null = null;
  let cursor = 0;

  const pushText = (raw: string) => {
    const text = decodeEntities(raw.replace(/\s+/g, ' '));
    if (!text) return;
    current.push({ text, bold: bold > 0, italic: italic > 0, href });
  };
  const breakParagraph = () => {
    const trimmed = trimParagraph(current);
    if (trimmed.length) paragraphs.push(trimmed);
    current = [];
  };

  for (const match of html.matchAll(TAG)) {
    pushText(html.slice(cursor, match.index));
    cursor = (match.index ?? 0) + match[0].length;
    const closing = match[0].startsWith('</');
    const tag = (match[1] ?? '').toLowerCase();

    if (tag === 'br')
      current.push({ text: '\n', bold: false, italic: false, href: null });
    else if (tag === 'strong' || tag === 'b') bold += closing ? -1 : 1;
    else if (tag === 'em' || tag === 'i') italic += closing ? -1 : 1;
    else if (tag === 'a') {
      if (closing) href = null;
      else {
        const candidate = /href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i.exec(
          match[2] ?? '',
        );
        const value = decodeEntities(
          (candidate?.[1] ?? candidate?.[2] ?? '').trim(),
        );
        href = SAFE_HREF.test(value) ? value : null;
      }
    } else if (BLOCK_TAGS.has(tag)) breakParagraph();
    bold = Math.max(0, bold);
    italic = Math.max(0, italic);
  }
  pushText(html.slice(cursor));
  breakParagraph();
  return paragraphs;
}

function trimParagraph(spans: TextSpan[]): TextSpan[] {
  const result = spans.map(s => ({ ...s }));
  const first = result[0];
  if (first) first.text = first.text.replace(/^\s+/, '');
  const last = result[result.length - 1];
  if (last) last.text = last.text.replace(/\s+$/, '');
  return result.filter(s => s.text.length > 0);
}
