import type { TextStyle } from 'react-native';

export interface Palette {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentPressed: string;
  onAccent: string;
  danger: string;
  success: string;
  overlay: string;
  skeleton: string;
}

export interface Theme {
  dark: boolean;
  colors: Palette;
  spacing: (steps: number) => number;
  radius: { sm: number; md: number; lg: number; pill: number };
  type: Record<
    'display' | 'title' | 'heading' | 'body' | 'label' | 'caption',
    TextStyle
  >;
}

const BRAND = { coral: '#FC615A', coralPressed: '#E54D46' };

const LIGHT: Palette = {
  background: '#FFFFFF',
  surface: '#F8F8F8',
  surfaceRaised: '#FFFFFF',
  border: '#E5E5E5',
  text: '#111111',
  textMuted: '#5F636A',
  accent: BRAND.coral,
  accentPressed: BRAND.coralPressed,
  onAccent: '#FFFFFF',
  danger: '#C62828',
  success: '#1E8E3E',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#ECECEC',
};

const DARK: Palette = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceRaised: '#1C1C1C',
  border: '#2A2A2A',
  text: '#F5F5F5',
  textMuted: '#A1A1AA',
  accent: BRAND.coral,
  accentPressed: BRAND.coralPressed,
  onAccent: '#FFFFFF',
  danger: '#FF6B6B',
  success: '#4ADE80',
  overlay: 'rgba(0,0,0,0.7)',
  skeleton: '#1F1F1F',
};

const TYPE: Theme['type'] = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
};

export function createTheme(dark: boolean): Theme {
  return {
    dark,
    colors: dark ? DARK : LIGHT,
    spacing: steps => steps * 4,
    radius: { sm: 8, md: 12, lg: 20, pill: 999 },
    type: TYPE,
  };
}
