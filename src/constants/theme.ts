export const Colors = {
  dark: {
    // ELWO Midnight & Obsidian Surfaces
    background: '#060814',
    backgroundSecondary: '#0B1020',
    backgroundTertiary: '#12182E',
    surface: '#0B1020',
    surfaceElevated: '#12182E',
    card: '#0E1428',
    cardHighlight: '#18203D',
    modalBackground: '#080C1A',

    // ELWO Modern Electric Violet & Radiant Cyan Palette (No Green!)
    primary: '#8B5CF6', // Signature ELWO Electric Violet
    primaryMuted: 'rgba(139, 92, 246, 0.14)',
    primaryGlow: 'rgba(139, 92, 246, 0.4)',
    secondary: '#00D2FF', // Radiant Electric Cyan
    secondaryGlow: 'rgba(0, 210, 255, 0.35)',
    accentViolet: '#A78BFA',
    accentRose: '#F43F5E',
    accentAmber: '#FBBF24',

    // High Legibility Minimalist Typography
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textDisabled: '#475569',

    // Micro Borders & Dividers
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.16)',
    borderAccent: 'rgba(139, 92, 246, 0.35)',

    // Controls & Navigation
    tint: '#8B5CF6',
    tabIconDefault: '#64748B',
    tabIconSelected: '#8B5CF6',
    danger: '#EF4444',
    success: '#00D2FF',
    surfaceOverlay: 'rgba(6, 8, 20, 0.90)',
  },
  light: {
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
    backgroundTertiary: '#E2E8F0',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    card: '#FFFFFF',
    cardHighlight: '#F1F5F9',
    modalBackground: '#FFFFFF',
    primary: '#7C3AED',
    primaryMuted: 'rgba(124, 58, 237, 0.1)',
    primaryGlow: 'rgba(124, 58, 237, 0.25)',
    secondary: '#0284C7',
    accentViolet: '#8B5CF6',
    accentRose: '#E11D48',
    accentAmber: '#D97706',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    borderAccent: 'rgba(124, 58, 237, 0.3)',
    tint: '#7C3AED',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#7C3AED',
    danger: '#DC2626',
    success: '#0284C7',
    surfaceOverlay: 'rgba(255, 255, 255, 0.88)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Typography = {
  hero: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  title1: {
    fontSize: 21,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  title2: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  title3: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  bodyMedium: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 15,
  },
  micro: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
};

export const Shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  player: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  }),
};
