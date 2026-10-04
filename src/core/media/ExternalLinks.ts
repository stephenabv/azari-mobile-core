import { Linking } from 'react-native';
import { HttpUrl } from '../http/HttpUrl';

export type LinkKind = 'web' | 'email' | 'phone';

const EMAIL = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE = /^tel:\+?[0-9-]{5,20}$/i;

/**
 * Opens links outside the app. Only https, mailto and tel are allowed so
 * content edited in the admin console can never launch arbitrary schemes.
 */
export const ExternalLinks = {
  classify(url: string): LinkKind | null {
    const value = url.trim();
    if (HttpUrl.isHttps(value)) return 'web';
    if (EMAIL.test(value)) return 'email';
    if (PHONE.test(value.replace(/\s/g, ''))) return 'phone';
    return null;
  },

  isAllowed(url: string | null | undefined): url is string {
    return !!url && ExternalLinks.classify(url) !== null;
  },

  async open(url: string | null | undefined): Promise<boolean> {
    if (!ExternalLinks.isAllowed(url)) return false;
    try {
      await Linking.openURL(url.trim().replace(/^tel:\s*/i, 'tel:'));
      return true;
    } catch {
      return false;
    }
  },

  email(address: string): string {
    return `mailto:${address.trim()}`;
  },

  phone(number: string): string {
    return `tel:${number.replace(/[^\d+]/g, '')}`;
  },
} as const;
