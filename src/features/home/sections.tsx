import React, { useState, type ComponentType } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import type { SiteContentBundle } from '../../data/CatalogRepository';
import { YouTube } from '../../domain/projects/Project';
import type { CalculatorSeed, TalkInquiryParams } from './homeTypes';
import {
  AppText,
  Button,
  Card,
  Grid,
  RemoteImage,
  Section,
} from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { SavingsCalculatorCard } from './SavingsCalculatorCard';

/** What every home section receives. */
export interface HomeSectionProps {
  content: SiteContentBundle;
  actions: HomeActions;
}

export interface HomeActions {
  openCalculator(seed?: CalculatorSeed): void;
  openProjects(): void;
  openJourney(): void;
  talkToExpert(params?: TalkInquiryParams): void;
}

/** One entry per website home section; `visibilityKey` matches `section-visibility`. */
export interface HomeSectionDefinition {
  visibilityKey: string;
  Component: ComponentType<HomeSectionProps>;
}

const useStyles = () => useThemedStyles(createStyles);

function HeroSection({ content, actions }: HomeSectionProps) {
  const styles = useStyles();
  const hero = content.get('hero');
  const highlight = hero.highlightWords.trim();
  return (
    <View style={styles.hero}>
      <AppText variant="display" accessibilityRole="header">
        <AppText
          variant="display"
          tone={
            highlight && hero.headerPart1.includes(highlight)
              ? 'accent'
              : 'default'
          }
        >
          {hero.headerPart1}
        </AppText>{' '}
        {hero.headerPart2}
      </AppText>
      {hero.subtext ? (
        <AppText tone="muted" style={styles.heroSub}>
          {hero.subtext}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={hero.primaryCta}
          onPress={() => actions.openCalculator()}
        />
        <Button
          label={hero.secondaryCta}
          variant="secondary"
          onPress={actions.openProjects}
        />
      </View>
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
        {items.map(m => (
          <Card key={`${m.label}-${m.value}`} style={styles.metric}>
            <AppText variant="title" tone="accent">
              {m.value}
            </AppText>
            <AppText variant="caption" tone="muted">
              {m.label}
            </AppText>
          </Card>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.partnerRow}
      >
        {partners.items.map(p => (
          <View key={p.name} style={styles.partner}>
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
        ))}
      </ScrollView>
    </Section>
  );
}

function BenefitsSection({ content }: HomeSectionProps) {
  const items = [...content.get('benefits').items].sort(
    (a, b) => a.order - b.order,
  );
  if (!items.length) return null;
  return (
    <Section eyebrow="Why solar" title="Benefits">
      <Grid maxColumns={3} minItemWidth={240}>
        {items.map(b => (
          <Card key={b.title}>
            <AppText variant="heading">{b.title}</AppText>
            <AppText tone="muted">{b.description}</AppText>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

function ExcellenceSection({ content }: HomeSectionProps) {
  const items = content.get('excellence').items;
  if (!items.length) return null;
  return (
    <Section eyebrow="Engineered excellence" title="Built to perform">
      <Grid maxColumns={3} minItemWidth={240}>
        {items.map(item => (
          <Card key={item.title}>
            {item.number ? (
              <AppText variant="title" tone="accent">
                {item.number}
              </AppText>
            ) : null}
            <AppText variant="heading">{item.title}</AppText>
            <AppText tone="muted">{item.description}</AppText>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

function TropicsSection({ content }: HomeSectionProps) {
  const tropics = content.get('tropics');
  const installed = content
    .get('metrics')
    .items.find(i => i.label === 'INSTALLED')?.value;
  const header = tropics.header
    .split(/\n|<br\s*\/?\s*>/i)
    .map(s => s.trim())
    .filter(Boolean)
    .join(' ');
  const cards = [
    {
      value: 'Climate Resilience',
      label: 'Engineered for typhoons, heat and humidity',
    },
    ...(installed
      ? [{ value: installed, label: 'SOLAR ASSETS DEPLOYED' }]
      : []),
    {
      value: `${tropics.performanceRating}%`,
      label: 'AVERAGE ELECTRICITY BILL REDUCTION FOR OUR CLIENTS',
    },
  ];
  return (
    <Section title={header} subtitle={tropics.subtext || undefined}>
      <Grid maxColumns={3} minItemWidth={200}>
        {cards.map(c => (
          <Card key={c.label}>
            <AppText variant="title" tone="accent">
              {c.value}
            </AppText>
            <AppText variant="caption" tone="muted">
              {c.label}
            </AppText>
          </Card>
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
      <Grid maxColumns={4} minItemWidth={220}>
        {steps.map((step, i) => (
          <View key={`${step.title}-${i}`} style={styles.step}>
            <AppText variant="title" tone="accent">
              {step.number || String(i + 1).padStart(2, '0')}
            </AppText>
            <AppText variant="heading">{step.title}</AppText>
            <AppText tone="muted">{step.description}</AppText>
          </View>
        ))}
      </Grid>
    </Section>
  );
}

function TestimonialsSection({ content, actions }: HomeSectionProps) {
  const styles = useStyles();
  const { size } = useResponsive();
  const entries = content.get('clientJourney').entries;
  const [index, setIndex] = useState(0);
  if (!entries.length) return null;
  const visible = size === 'compact' ? 1 : 2;
  const page = entries.slice(index, index + visible);

  return (
    <Section title="Our clients journey to Energy Independence">
      <Grid maxColumns={visible} minItemWidth={260}>
        {page.map(entry => {
          const video = YouTube.watchUrl(entry.videoUrl);
          return (
            <Card key={entry.id}>
              {video ? (
                <RemoteImage
                  source={YouTube.thumbnail(entry.videoUrl)}
                  aspectRatio={16 / 9}
                  style={styles.thumb}
                  accessibilityLabel={`${entry.name} video`}
                />
              ) : null}
              <AppText variant="heading">{entry.name}</AppText>
              <AppText variant="caption" tone="muted">
                {entry.location}
              </AppText>
              <AppText style={styles.quote}>{entry.testimonial}</AppText>
              {video ? (
                <Button
                  label="Watch the video"
                  variant="ghost"
                  compact
                  onPress={() => void ExternalLinks.open(video)}
                />
              ) : null}
            </Card>
          );
        })}
      </Grid>
      <View style={styles.pager}>
        <Button
          label="Previous"
          variant="secondary"
          compact
          disabled={index === 0}
          onPress={() => setIndex(i => Math.max(0, i - visible))}
        />
        <AppText variant="label">{`${
          Math.floor(index / visible) + 1
        }/${Math.ceil(entries.length / visible)}`}</AppText>
        <Button
          label="Next"
          variant="secondary"
          compact
          disabled={index + visible >= entries.length}
          onPress={() =>
            setIndex(i => Math.min(entries.length - 1, i + visible))
          }
        />
      </View>
      <Button
        label="See the client journey"
        variant="ghost"
        onPress={actions.openJourney}
      />
    </Section>
  );
}

function CalculatorSection({ actions }: HomeSectionProps) {
  return (
    <Section title="Calculate Your Savings">
      <SavingsCalculatorCard onGetQuote={actions.openCalculator} />
    </Section>
  );
}

function CallToActionSection({ content, actions }: HomeSectionProps) {
  const styles = useStyles();
  const cta = content.get('cta');
  return (
    <Card style={styles.cta}>
      <AppText variant="title">{cta.title}</AppText>
      <AppText tone="muted" style={styles.heroSub}>
        {cta.description}
      </AppText>
      <View style={styles.actions}>
        <Button
          label={cta.primaryCta || 'Get a free Quote'}
          onPress={() => actions.openCalculator()}
        />
        <Button
          label={cta.secondaryCta || 'Talk to an Expert'}
          variant="secondary"
          onPress={() => actions.talkToExpert()}
        />
      </View>
    </Card>
  );
}

/**
 * Website home sections in website order. Admins hide any of them through
 * `section-visibility`; adding a section is one entry here.
 */
export const HOME_SECTIONS: readonly HomeSectionDefinition[] = [
  { visibilityKey: 'hero', Component: HeroSection },
  { visibilityKey: 'metrics', Component: MetricsSection },
  { visibilityKey: 'partners', Component: PartnersSection },
  { visibilityKey: 'benefits', Component: BenefitsSection },
  { visibilityKey: 'excellence', Component: ExcellenceSection },
  { visibilityKey: 'tropics', Component: TropicsSection },
  { visibilityKey: 'process', Component: ProcessSection },
  { visibilityKey: 'clientJourney', Component: TestimonialsSection },
  { visibilityKey: 'calculator', Component: CalculatorSection },
  { visibilityKey: 'callToAction', Component: CallToActionSection },
];

const createStyles = (t: Theme) =>
  StyleSheet.create({
    hero: { marginBottom: t.spacing(10), paddingTop: t.spacing(4) },
    heroSub: { marginTop: t.spacing(3) },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(3),
      marginTop: t.spacing(6),
    },
    metric: { alignItems: 'flex-start', gap: t.spacing(1) },
    partnerRow: { gap: t.spacing(3) },
    partner: {
      width: 140,
      height: 72,
      borderRadius: t.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing(2),
      backgroundColor: t.colors.surfaceRaised,
    },
    partnerLogo: { backgroundColor: 'transparent' },
    step: { gap: t.spacing(1), paddingVertical: t.spacing(2) },
    thumb: { borderRadius: t.radius.md, marginBottom: t.spacing(3) },
    quote: { marginTop: t.spacing(2) },
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing(4),
      marginTop: t.spacing(4),
    },
    cta: { padding: t.spacing(6), marginBottom: t.spacing(10) },
  });
