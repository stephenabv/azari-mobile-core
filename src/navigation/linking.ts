import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

const PROJECT_ID = /^[A-Za-z0-9_-]{1,64}$/;
const BRAND = /^[\p{L}\p{N} ._&-]{1,60}$/u;

/**
 * Website URLs open the matching native screen (App Links / Universal Links
 * are declared in each shell). Paths mirror azari-client's routes, and
 * parameters are validated before any screen sees them.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  // Verified App Links / Universal Links only; no custom URL schemes.
  prefixes: ['https://azari.solar', 'https://www.azari.solar'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: '',
          Packages: {
            path: 'packages',
            parse: { brand: (v: string) => (BRAND.test(v) ? v : '') },
          },
          Calculator: 'solar-calculator',
          Projects: 'projects',
          More: 'more',
        },
      },
      ProjectDetail: {
        path: 'projects/:id',
        parse: { id: (v: string) => (PROJECT_ID.test(v) ? v : '') },
      },
      ClientJourney: 'client-journey',
      PrivacyPolicy: 'privacy-policy',
      TermsConditions: 'terms-and-conditions',
    },
  },
};
