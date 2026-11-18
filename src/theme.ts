import { useColorScheme } from 'react-native';

import type { DayType } from '@/engine/types';

const light = {
  bg: '#F1EBDD',
  surface: '#F8F4EA',
  surfaceAlt: '#E7DFCC',
  border: '#D4C9B0',
  text: '#1B2A44',
  textMuted: '#5B6577',
  primary: '#1B2A44',
  onPrimary: '#F1EBDD',
  accent: '#4A6A8F',
  accentSoft: '#C9D4E2',
  danger: '#8C3B2E',
  work: '#1B2A44',
  rest: '#7E93AE',
};

const dark: typeof light = {
  bg: '#0E1522',
  surface: '#152035',
  surfaceAlt: '#1C2A43',
  border: '#2A3A57',
  text: '#ECE5D4',
  textMuted: '#9AA6BA',
  primary: '#ECE5D4',
  onPrimary: '#0E1522',
  accent: '#8FAAD0',
  accentSoft: '#2A3D5E',
  danger: '#D98572',
  work: '#ECE5D4',
  rest: '#6F86A8',
};

export type Palette = typeof light;
export const Palettes = { light, dark };

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Day-type tints, used on chips and the history calendar. */
export function dayColor(day: DayType, p: Palette): string {
  const isDark = p === dark;
  switch (day) {
    case 'upper':
      return isDark ? '#8FAAD0' : '#4A6A8F';
    case 'lower':
      return isDark ? '#C7B48A' : '#8A7444';
    case 'full':
      return isDark ? '#ECE5D4' : '#1B2A44';
    case 'mobility':
      return isDark ? '#8DB8A6' : '#4F7A69';
    default:
      return p.border;
  }
}

export const Font = {
  display: 'Cinzel_700Bold',
  displaySemi: 'Cinzel_600SemiBold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const Space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 8, md: 14, lg: 22, pill: 999 };
