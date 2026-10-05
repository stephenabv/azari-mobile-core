import { SocialPlatformRegistry } from '../social/SocialPlatform';

const registry = new SocialPlatformRegistry();
const https = (url: string) => url.startsWith('https://');

describe('SocialPlatformRegistry', () => {
  it.each([
    ['https://www.facebook.com/azarisolar', 'facebook'],
    ['https://m.facebook.com/azarisolar', 'facebook'],
    ['https://instagram.com/azari.solar', 'instagram'],
    ['https://www.tiktok.com/@azarisolar', 'tiktok'],
    ['https://youtu.be/abc', 'youtube'],
  ])('detects %s as %s', (url, id) => {
    expect(registry.detect(url)?.id).toBe(id);
  });

  it('does not match look-alike hosts', () => {
    expect(registry.detect('https://notfacebook.com/x')).toBeNull();
    expect(registry.detect('https://facebook.com.evil.example/x')).toBeNull();
  });

  it('only recognises https links', () => {
    expect(registry.detect('http://facebook.com/x')).toBeNull();
    expect(registry.detect('ftp://facebook.com/x')).toBeNull();
  });

  it('keeps content order, drops disallowed links and falls back to a generic site', () => {
    const links = registry.links(
      {
        facebook: { name: 'facebook', url: 'https://facebook.com/azari' },
        bad: { name: 'Bad', url: 'http://example.com' },
        empty: null,
        site: { name: '', url: 'https://example.com/azari' },
      },
      https,
    );
    expect(links.map(l => [l.name, l.platform?.id ?? null])).toEqual([
      ['facebook', 'facebook'],
      ['https://example.com/azari', null],
    ]);
  });
});
