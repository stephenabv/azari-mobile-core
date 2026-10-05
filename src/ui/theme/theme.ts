import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export interface Palette {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  /** Brand coral. A fill colour: text on it uses `onAccent`. */
  accent: string;
  accentPressed: string;
  onAccent: string;
  /** Coral dark enough to read as text on `background` / `surfaceRaised`. */
  accentText: string;
  /** Tinted fill for selected cards and soft call-outs. */
  accentSoft: string;
  /** Brand sun yellow, for highlights on `night` surfaces. */
  sun: string;
  /** Deep hero / tab bar surface and the text that sits on it. */
  night: string;
  onNight: string;
  onNightMuted: string;
  /** Active tab highlight: coral at 80% opacity. */
  tabHighlight: string;
  danger: string;
  success: string;
  overlay: string;
  skeleton: string;
  shadow: string;
}

export type TypeVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption';

export interface Theme {
  dark: boolean;
  colors: Palette;
  spacing: (steps: number) => number;
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  type: Record<TypeVariant, TextStyle>;
  /** Soft card elevation that works on both platforms. */
  elevation: ViewStyle;
}

const BRAND = {
  coral: '#FC615A',
  coralPressed: '#E54E47',
  sun: '#FFD600',
  night: '#111111',
} as const;

/**
 * Website gradients (azari.solar), as ordered colour stops. Primary buttons
 * use `action`; the logo uses `sun` for its rays and `panels` for its stripes.
 */
export const GRADIENTS = Object.freeze({
  action: ['#FA8248', '#FC5C5C'],
  sun: ['#FFE800', '#FFD600', '#FFD100'],
  panels: ['#FA8248', '#FC5C5C'],
} as const satisfies Record<string, readonly string[]>);

/** Full-screen loader surface: the website's page loader colours. */
export const LOADER_SURFACE = Object.freeze({
  dark: '#0A0A0A',
  light: '#F4F4F4',
});

const LIGHT: Palette = {
  background: '#F4F4F4',
  surface: '#E9E9E9',
  surfaceRaised: '#FFFFFF',
  border: '#E2E2E2',
  text: '#111111',
  textMuted: '#5E6168',
  accent: BRAND.coral,
  accentPressed: BRAND.coralPressed,
  onAccent: '#0A0A0A',
  accentText: '#C9372F',
  accentSoft: '#FFE7E3',
  sun: BRAND.sun,
  night: BRAND.night,
  onNight: '#FFFFFF',
  onNightMuted: '#9A9DA3',
  tabHighlight: 'rgba(250,110,82,0.8)',
  danger: '#C62828',
  success: '#1E7E34',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#E6E6E6',
  shadow: '#0A0A0A',
};

const DARK: Palette = {
  background: '#0A0A0A',
  surface: '#1C1C1C',
  surfaceRaised: '#141414',
  border: '#262626',
  text: '#EDEDED',
  textMuted: '#9A9DA3',
  accent: BRAND.coral,
  accentPressed: BRAND.coralPressed,
  onAccent: '#0A0A0A',
  accentText: '#FC615A',
  accentSoft: '#2A1714',
  sun: BRAND.sun,
  night: '#161616',
  onNight: '#FFFFFF',
  onNightMuted: '#9A9DA3',
  tabHighlight: 'rgba(250,110,82,0.8)',
  danger: '#FF6B6B',
  success: '#4ADE80',
  overlay: 'rgba(0,0,0,0.7)',
  skeleton: '#1A1A1A',
  shadow: '#000000',
};

/**
 * Bundled brand fonts (PostScript names, identical to the file names in each
 * app's fonts folder so Android and iOS resolve them the same way). The weight
 * lives in the face, so no fontWeight is set alongside a custom family:
 * Android would otherwise synthesise a second, fake bold.
 */
export const FONTS = {
  displayHeavy: 'Sora-ExtraBold',
  display: 'Sora-Bold',
  regular: 'DMSans-Regular',
  medium: 'DMSans-Medium',
  semibold: 'DMSans-SemiBold',
  bold: 'DMSans-Bold',
} as const;

/** Compact scale: page titles 22, section heads 16-18, body 14. */
const TYPE: Theme['type'] = {
  display: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  heading: { fontFamily: FONTS.bold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20 },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 16 },
};

function elevationFor(palette: Palette, dark: boolean): ViewStyle {
  if (dark) return {};
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: 2 },
  });
}

export function createTheme(dark: boolean): Theme {
  const colors = dark ? DARK : LIGHT;
  return {
    dark,
    colors,
    spacing: steps => steps * 4,
    radius: { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 },
    type: TYPE,
    elevation: elevationFor(colors, dark),
  };
}
