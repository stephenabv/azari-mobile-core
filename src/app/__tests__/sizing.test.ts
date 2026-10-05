import { imageLoaderWidth } from '../../ui/components/RemoteImage';
import { splashLogoWidth } from '../AnimatedSplash';

describe('loader sizing', () => {
  it('sizes the splash logo like the website: clamp(64, 14vmin, 112)', () => {
    expect(splashLogoWidth(320, 640)).toBe(64);
    expect(splashLogoWidth(600, 900)).toBe(84);
    expect(splashLogoWidth(1180, 820)).toBe(112);
  });

  it('keeps image loaders readable on small tiles and modest on large ones', () => {
    expect(imageLoaderWidth(80)).toBe(28);
    expect(imageLoaderWidth(200)).toBe(48);
    expect(imageLoaderWidth(900)).toBe(72);
  });
});
