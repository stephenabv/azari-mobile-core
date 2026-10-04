/** Client journey content as served by GET /api/client-journey (published steps only). */

export interface BulletItem {
  text: string;
  boldLead?: string | undefined;
  children?: BulletItem[] | undefined;
  linkUrl?: string | undefined;
  linkLabel?: string | undefined;
}

export interface LinkItem {
  label: string;
  url: string;
  style: 'text' | 'button';
}

export interface PartnerItem {
  name: string;
  logoUrl?: string | undefined;
  downloadUrl?: string | undefined;
}

export type ContactKind =
  | 'whatsapp'
  | 'viber'
  | 'facebook'
  | 'instagram'
  | 'email'
  | 'phone';

export interface ContactChannel {
  kind: ContactKind;
  value: string;
  url: string;
}

interface BaseBlock {
  order: number;
}

export type ContentBlock =
  | (BaseBlock & { type: 'heading'; text: string; level: number })
  | (BaseBlock & { type: 'paragraph'; html: string })
  | (BaseBlock & { type: 'bullet_list'; items: BulletItem[] })
  | (BaseBlock & { type: 'link_group'; links: LinkItem[] })
  | (BaseBlock & { type: 'button'; label: string; url: string })
  | (BaseBlock & {
      type: 'image';
      src: string;
      alt: string;
      caption?: string | undefined;
    })
  | (BaseBlock & { type: 'partner_grid'; items: PartnerItem[] })
  | (BaseBlock & { type: 'contact_channels'; channels: ContactChannel[] })
  | (BaseBlock & { type: 'divider' });

export type BlockType = ContentBlock['type'];

export interface JourneyStep {
  id: string;
  order: number;
  title: string;
  subheading: string | null;
  iconUrl: string | null;
  accentColor: string | null;
  blocks: ContentBlock[];
}

/** Steps and blocks in display order. Unknown block types were already dropped by the API schema. */
export function orderedSteps(steps: readonly JourneyStep[]): JourneyStep[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map(step => ({
      ...step,
      blocks: [...step.blocks].sort((a, b) => a.order - b.order),
    }));
}
