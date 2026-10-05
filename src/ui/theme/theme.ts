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
  coral: '#FA6E52',
  coralPressed: '#E85A3F',
  sun: '#FFD600',
  night: '#121318',
} as const;

const LIGHT: Palette = {
  background: '#F6F5F2',
  surface: '#ECEAE5',
  surfaceRaised: '#FFFFFF',
  border: '#E2E0DA',
  text: '#15161A',
  textMuted: '#5B5E66',
  accent: BRAND.coral,
  accentPressed: BRAND.coralPressed,
  onAccent: '#15161A',
  accentText: '#C73E2C',
  accentSoft: '#FFE9E4',
  sun: BRAND.sun,
  night: BRAND.night,
  onNight: '#FFFFFF',
  onNightMuted: '#B4B7BF',
  tabHighlight: 'rgba(250,110,82,0.8)',
  danger: '#C62828',
  success: '#1E7E34',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#E6E4DF',
  shadow: '#14141E',
};

const DARK: Palette = {
  background: '#0E0F13',
  surface: '#1F2128',
  surfaceRaised: '#17191F',
  border: '#2A2C34',
  text: '#F5F5F7',
  textMuted: '#A3A6AE',
  accent: BRAND.coral,
  accentPressed: BRAND.coralPressed,
  onAccent: '#15161A',
  accentText: '#FF8A70',
  accentSoft: '#3A211C',
  sun: BRAND.sun,
  night: '#1C1E25',
  onNight: '#FFFFFF',
  onNightMuted: '#B4B7BF',
  tabHighlight: 'rgba(250,110,82,0.8)',
  danger: '#FF6B6B',
  success: '#4ADE80',
  overlay: 'rgba(0,0,0,0.7)',
  skeleton: '#22242B',
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
