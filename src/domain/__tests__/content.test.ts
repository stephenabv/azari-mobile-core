import { parseContent } from '../content/SiteContent';
import { parseRichText } from '../journey/RichText';
import { projectFilters } from '../projects/ProjectFilter';
import { ProjectFacts, YouTube, type Project } from '../projects/Project';
import { talkValidator } from '../talk/TalkInquiry';
import { inquiryValidator } from '../inquiry/PackageInquiry';
import { compareVersions, isBelowMinimum } from '../versioning/Version';

describe('site content', () => {
  it('falls back per key on malformed content and drops bad items', () => {
    expect(parseContent('hero', 'nonsense').primaryCta).toBe(
      'Calculate Your Savings',
    );
    expect(
      parseContent('metrics', {
        items: [{ value: '1', label: 'A', order: 1 }, { bad: true }],
      }).items,
    ).toEqual([{ value: '1', label: 'A', order: 1 }]);
  });
});

describe('parseRichText', () => {
  it('keeps formatting and only safe links', () => {
    const [p] = parseRichText(
      '<p>Hi <strong>there</strong> <a href="javascript:alert(1)">bad</a> <a href="https://azari.solar">ok</a></p>',
    );
    expect(p).toEqual([
      { text: 'Hi ', bold: false, italic: false, href: null },
      { text: 'there', bold: true, italic: false, href: null },
      { text: ' ', bold: false, italic: false, href: null },
      { text: 'bad', bold: false, italic: false, href: null },
      { text: ' ', bold: false, italic: false, href: null },
      { text: 'ok', bold: false, italic: false, href: 'https://azari.solar' },
    ]);
  });
});

describe('form validators', () => {
  it('mirror the server talk-to-expert rules', () => {
    expect(
      talkValidator.all({
        name: 'Ana',
        email: 'a@mailinator.com',
        phone: '12345',
        province: 'Cebu',
        city: 'Cebu',
        message: 'short',
      }),
    ).toEqual({
      email: 'Disposable or temporary email domains are not allowed.',
      phone: 'Please enter a valid Philippine phone number.',
      message: 'Message must be at least 10 characters.',
    });
    expect(talkValidator.field('phone', '+63 917-123-4567')).toBeNull();
  });

  it('requires the 10 digits after +63 for package inquiries', () => {
    expect(inquiryValidator.field('phone', '9171234567')).toBeNull();
    expect(inquiryValidator.field('phone', '09171234567')).not.toBeNull();
  });
});

describe('projects', () => {
  const project = {
    id: 'p1',
    title: 'Home',
    subtitle: null,
    category: 'Residential',
    system: '8.1kWp Hybrid (10kWh)',
    savings: '₱8,000/mo',
    imageUrl: '/a.jpg',
    videoUrl: 'https://youtu.be/abcdefghijk',
    isRecent: true,
    sortOrder: 1,
    stats: [],
    performanceMetrics: [],
    technicalBreakdown: [],
    galleryImages: [],
    heroCards: [],
    testimonial: null,
    electricalSystem: null,
    loadKw: 6,
    productionKwp: null,
    storageKwh: null,
  } satisfies Project;

  it('derives hero chips from system text when fields are empty', () => {
    expect(new ProjectFacts(project).heroChips().map(c => c.value)).toEqual([
      '6kW',
      '10kWh',
      '8.1kWp',
      '₱8,000/mo',
      'Single-Phase',
    ]);
  });

  it('builds filters from data, keeping website order', () => {
    expect(
      projectFilters([project, { ...project, category: 'Agricultural' }]).map(
        f => f.label,
      ),
    ).toEqual([
      'All Projects',
      'Recent Projects',
      'Residential Projects',
      'Commercial Projects',
      'Industrial Projects',
      'Agricultural Projects',
    ]);
  });

  it('normalises YouTube links', () => {
    expect(YouTube.watchUrl(project.videoUrl)).toBe(
      'https://www.youtube.com/watch?v=abcdefghijk',
    );
    expect(YouTube.id('https://example.com/watch?v=abcdefghijk')).toBeNull();
  });
});

describe('versions', () => {
  it('compares semver numerically', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0);
    expect(isBelowMinimum('1.0.0', '1.0.1')).toBe(true);
    expect(isBelowMinimum('1.0.0', null)).toBe(false);
  });
});
