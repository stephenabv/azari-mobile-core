import React, { type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import type { SiteContentBundle } from '../../data/CatalogRepository';
import type { SolarPackage } from '../../domain/packages/types';
import { YouTube } from '../../domain/projects/Project';
import type { CalculatorSeed, TalkInquiryParams } from './homeTypes';
import {
  AppText,
  Button,
  ButtonRow,
  Card,
  Grid,
  RemoteImage,
  Section,
} from '../../ui/components';
import { SunRays } from '../../ui/brand';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, PressableScale, Spin } from '../../ui/motion';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { BleedRow } from './BleedRow';
import { HeroCard } from './HeroCard';
import { PackageCarousel } from './PackageCarousel';
import { QuickActions } from './QuickActions';
import { SavingsCalculatorCard } from './SavingsCalculatorCard';
import { StoriesRow } from './StoriesRow';

/** Package catalog as the home carousel sees it. */
export interface HomePackages {
  items: readonly SolarPackage[];
  loading: boolean;
}

/** What every home section receives. */
export interface HomeSectionProps {
  content: SiteContentBundle;
  actions: HomeActions;
  packages: HomePackages;
}

export interface HomeActions {
  openCalculator(seed?: CalculatorSeed): void;
  openPackages(): void;
  openProjects(): void;
  openJourney(): void;
  talkToExpert(params?: TalkInquiryParams): void;
}

/** One entry per home section; `visibilityKey` matches `section-visibility`. */
export interface HomeSectionDefinition {
  /** Unique key when several sections share one visibility switch. */
  id?: string;
  visibilityKey: string;
  Component: ComponentType<HomeSectionProps>;
  /**
   * On tablets, adjacent `half` sections share a row as two columns. Phones
   * always stack sections full width.
   */
  span?: 'full' | 'half';
}

/**
 * Groups visible sections into layout rows: a run of two `half` sections
 * becomes one two-column row; everything else gets a row of its own.
 */
export function homeRows(
  sections: readonly HomeSectionDefinition[],
  columns: boolean,
): HomeSectionDefinition[][] {
  const rows: HomeSectionDefinition[][] = [];
  for (const section of sections) {
    const last = rows[rows.length - 1];
    if (
      columns &&
      section.span === 'half' &&
      last?.length === 1 &&
      last[0]?.span === 'half'
    ) {
      last.push(section);
    } else {
      rows.push([section]);
    }
  }
  return rows;
}

const useStyles = () => useThemedStyles(createStyles);

/** Decorative icons cycled across content-driven cards. */
const BENEFIT_ICONS: readonly IconName[] = [
  'sun',
  'bolt',
  'leaf',
  'shield',
  'battery',
  'sparkle',
];

function IconBubble({ name }: { name: IconName }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bubble}>
      <Icon name={name} size={18} color={theme.colors.accentText} />
    </View>
  );
}

function MetricsSection({ content }: HomeSectionProps) {
  const styles = useStyles();
  const items = [...content.get('metrics').items].sort(
    (a, b) => a.order - b.order,
  );
  if (!items.length) return null;
  return (
    <Section>
      <Grid maxColumns={4} minItemWidth={140} gap={12}>
        {items.map((m, index) => (
          <FadeIn
            key={`${m.label}-${m.value}`}
            index={index}
            fromScale={0.94}
            style={styles.fill}
          >
            <Card tone="flat" style={styles.metric}>
              <AppText variant="title" tone="accent">
                {m.value}
              </AppText>
              <AppText variant="caption" tone="muted">
                {m.label}
              </AppText>
            </Card>
          </FadeIn>
        ))}
      </Grid>
    </Section>
  );
}

function PartnersSection({ content }: HomeSectionProps) {
  const styles = useStyles();
  const partners = content.get('partners');
  if (!partners.items.length) return null;
  return (
    <Section title={partners.title || 'Our Partners'}>
      <BleedRow>
        {partners.items.map((p, index) => (
          <FadeIn key={p.name} index={index} direction="left">
            <View style={styles.partner}>
              {p.logoUrl ? (
                <RemoteImage
                  source={p.logoUrl}
                  aspectRatio={2}
                  resizeMode="contain"
                  accessibilityLabel={p.name}
                  style={styles.partnerLogo}
                />
              ) : (
                <AppText variant="label">{p.name}</AppText>
              )}
            </View>
          </FadeIn>
        ))}
      </BleedRow>
    </Section>
  );
}

function BenefitsSection({ content }: HomeSectionProps) {
  const styles = useStyles();
  const items = [...content.get('benefits').items].sort(
    (a, b) => a.order - b.order,
  );
  if (!items.length) return null;
  return (
    <Section eyebrow="Why solar" title="Benefits">
      <Grid maxColumns={4} minItemWidth={150} gap={12}>
        {items.map((b, index) => (
          <FadeIn key={b.title} index={index} style={styles.fill}>
            <Card style={styles.tile}>
              <IconBubble
                name={BENEFIT_ICONS[index % BENEFIT_ICONS.length] ?? 'sun'}
              />
              <AppText variant="heading">{b.title}</AppText>
              <AppText variant="caption" tone="muted">
                {b.description}
              </AppText>
            </Card>
          </FadeIn>
        ))}
      </Grid>
    </Section>
  );
}

function ExcellenceSection({ content }: HomeSectionProps) {
  const styles = useStyles();
  const items = content.get('excellence').items;
  if (!items.length) return null;
  return (
    <Section eyebrow="Engineered excellence" title="Built to perform">
      <Grid maxColumns={3} minItemWidth={240} gap={12}>
        {items.map((item, index) => (
          <FadeIn key={item.title} index={index} style={styles.fill}>
            <Card style={styles.tile}>
              {item.number ? (
                <AppText variant="title" tone="accent">
                  {item.number}
                </AppText>
              ) : null}
              <AppText variant="heading">{item.title}</AppText>
              <AppText tone="muted">{item.description}</AppText>
            </Card>
          </FadeIn>
        ))}
      </Grid>
    </Section>
  );
}

function TropicsSection({ content }: HomeSectionProps) {
  const styles = useStyles();
  const tropics = content.get('tropics');
  const installed = content
    .get('metrics')
    .items.find(i => i.label === 'INSTALLED')?.value;
  const header = tropics.header
    .split(/\n|<br\s*\/?\s*>/i)
    .map(s => s.trim())
    .filter(Boolean)
    .join(' ');
  const cards: { value: string; label: string; icon: IconName }[] = [
    {
      value: 'Climate Resilience',
      label: 'Engineered for typhoons, heat and humidity',
      icon: 'shield',
    },
    ...(installed
      ? [
          {
            value: installed,
            label: 'SOLAR ASSETS DEPLOYED',
            icon: 'sun' as IconName,
          },
        ]
      : []),
    {
      value: `${tropics.performanceRating}%`,
      label: 'AVERAGE ELECTRICITY BILL REDUCTION FOR OUR CLIENTS',
      icon: 'bolt',
    },
  ];
  return (
    <Section title={header} subtitle={tropics.subtext || undefined}>
      <Grid maxColumns={3} minItemWidth={200} gap={12}>
        {cards.map((c, index) => (
          <FadeIn key={c.label} index={index} style={styles.fill}>
            <Card tone="flat" style={styles.tropic}>
              <IconBubble name={c.icon} />
              <View style={styles.shrink}>
                <AppText variant="title" tone="accent">
                  {c.value}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {c.label}
                </AppText>
              </View>
            </Card>
          </FadeIn>
        ))}
      </Grid>
    </Section>
  );
}

function ProcessSection({ content }: HomeSectionProps) {
  const styles = useStyles();
  const steps = content.get('process').steps;
  if (!steps.length) return null;
  return (
    <Section eyebrow="How it works" title="Our Process">
      <Grid maxColumns={4} minItemWidth={220} gap={12}>
        {steps.map((step, i) => (
          <FadeIn
            key={`${step.title}-${i}`}
            index={i}
            direction="left"
            style={styles.fill}
          >
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="label" tone="inverse">
                  {step.number || String(i + 1).padStart(2, '0')}
                </AppText>
              </View>
              <View style={styles.shrink}>
                <AppText variant="heading">{step.title}</AppText>
                <AppText variant="caption" tone="muted">
                  {step.description}
                </AppText>
              </View>
            </View>
          </FadeIn>
        ))}
      </Grid>
    </Section>
  );
}

function TestimonialsSection({ content, actions }: HomeSectionProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { size } = useResponsive();
  const entries = content.get('clientJourney').entries;
  if (!entries.length) return null;
  const cardWidth = size === 'compact' ? 272 : 320;
  const width = { width: cardWidth };

  return (
    <Section title="Our clients journey to Energy Independence">
      <BleedRow gap={14} snapInterval={cardWidth + 14}>
        {entries.map((entry, index) => {
          const video = YouTube.watchUrl(entry.videoUrl);
          return (
            <FadeIn key={entry.id} index={index} direction="left" style={width}>
              <Card style={styles.testimonial}>
                {video ? (
                  <PressableScale
                    onPress={() => void ExternalLinks.open(video)}
                    accessibilityRole="button"
                    accessibilityLabel={`Watch ${entry.name}'s video`}
                  >
                    <RemoteImage
                      source={YouTube.thumbnail(entry.videoUrl)}
                      aspectRatio={16 / 9}
                      style={styles.thumb}
                    />
                    <View style={styles.play} pointerEvents="none">
                      <Icon
                        name="play"
                        size={18}
                        color={theme.colors.onAccent}
                      />
                    </View>
                  </PressableScale>
                ) : null}
                <AppText variant="heading">{entry.name}</AppText>
                {entry.location ? (
                  <View style={styles.location}>
                    <Icon name="pin" size={13} color={theme.colors.textMuted} />
                    <AppText variant="caption" tone="muted">
                      {entry.location}
                    </AppText>
                  </View>
                ) : null}
                <AppText style={styles.quote} numberOfLines={6}>
                  {entry.testimonial}
                </AppText>
                {video ? (
                  <Button
                    label="Watch the video"
                    variant="ghost"
                    compact
                    icon="play"
                    style={styles.watch}
                    onPress={() => void ExternalLinks.open(video)}
                  />
                ) : null}
              </Card>
            </FadeIn>
          );
        })}
      </BleedRow>
      <Button
        label="See the client journey"
        variant="secondary"
        compact
        icon="route"
        style={styles.journey}
        onPress={actions.openJourney}
      />
    </Section>
  );
}

function CalculatorSection({ actions }: HomeSectionProps) {
  return (
    <Section eyebrow="Quick estimate" title="Calculate Your Savings">
      <SavingsCalculatorCard onGetQuote={actions.openCalculator} />
    </Section>
  );
}

function CallToActionSection({ content, actions }: HomeSectionProps) {
  const theme = useTheme();
  const styles = useStyles();
  const cta = content.get('cta');
  return (
    <FadeIn fromScale={0.97} style={styles.ctaWrap}>
      <Card tone="night" style={styles.cta}>
        <Spin style={styles.ctaSun} duration={60000}>
          <SunRays size={160} color={theme.colors.sun} rayOpacity={0.4} />
        </Spin>
        <View style={styles.ctaCopy}>
          <AppText variant="title" tone="onNight">
            {cta.title}
          </AppText>
          <AppText tone="onNightMuted" style={styles.ctaSub}>
            {cta.description}
          </AppText>
        </View>
        <ButtonRow
          style={styles.actions}
          actions={[
            {
              key: 'quote',
              label: cta.primaryCta || 'Get a free Quote',
              onPress: () => actions.openCalculator(),
            },
            {
              key: 'expert',
              label: cta.secondaryCta || 'Talk to an Expert',
              variant: 'onNight',
              onPress: () => actions.talkToExpert(),
            },
          ]}
        />
      </Card>
    </FadeIn>
  );
}

/**
 * Home sections in display order. Website sections keep their
 * `section-visibility` keys so admins can still hide any of them; adding a
 * section is one entry here.
 */
export const HOME_SECTIONS: readonly HomeSectionDefinition[] = [
  { id: 'stories', visibilityKey: 'clientJourney', Component: StoriesRow },
  { visibilityKey: 'hero', Component: HeroCard, span: 'half' },
  { visibilityKey: 'quickActions', Component: QuickActions, span: 'half' },
  { visibilityKey: 'packages', Component: PackageCarousel },
  { visibilityKey: 'benefits', Component: BenefitsSection },
  { visibilityKey: 'metrics', Component: MetricsSection },
  { visibilityKey: 'excellence', Component: ExcellenceSection },
  { visibilityKey: 'tropics', Component: TropicsSection },
  { visibilityKey: 'process', Component: ProcessSection },
  { visibilityKey: 'clientJourney', Component: TestimonialsSection },
  { visibilityKey: 'calculator', Component: CalculatorSection },
  { visibilityKey: 'partners', Component: PartnersSection },
  { visibilityKey: 'callToAction', Component: CallToActionSection },
];

const createStyles = (t: Theme) =>
  StyleSheet.create({
    fill: { flex: 1 },
    shrink: { flexShrink: 1, gap: 2 },
    bubble: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tile: { flex: 1, gap: t.spacing(1.5) },
    metric: { flex: 1, alignItems: 'flex-start', gap: t.spacing(1) },
    tropic: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
    },
    partner: {
      width: 132,
      height: 68,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing(2),
      backgroundColor: t.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    partnerLogo: { backgroundColor: 'transparent' },
    step: {
      flex: 1,
      flexDirection: 'row',
      gap: t.spacing(3),
      paddingVertical: t.spacing(1),
    },
    stepNumber: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    testimonial: { flex: 1, gap: t.spacing(1) },
    thumb: { borderRadius: t.radius.md, marginBottom: t.spacing(2) },
    play: {
      position: 'absolute',
      alignSelf: 'center',
      top: '50%',
      marginTop: -24,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    quote: { marginTop: t.spacing(1) },
    watch: { alignSelf: 'flex-start', paddingHorizontal: 0 },
    journey: { alignSelf: 'flex-start', marginTop: t.spacing(3) },
    actions: { marginTop: t.spacing(5) },
    ctaWrap: { marginBottom: t.spacing(8) },
    cta: { padding: t.spacing(6), borderRadius: t.radius.xl },
    ctaSun: { position: 'absolute', right: -50, bottom: -50 },
    ctaCopy: { maxWidth: 520 },
    ctaSub: { marginTop: t.spacing(2) },
  });
