// Powered by OnSpace.AI
export const Colors = {
  // Base
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#1C2128',
  surfaceBorder: '#21262D',
  card: '#1C2128',

  // Brand
  primary: '#00C896',
  primaryDim: '#00C89620',
  primaryText: '#00E5AD',

  // Semantic
  gain: '#00C896',
  gainBg: '#00C89615',
  loss: '#FF4D4F',
  lossBg: '#FF4D4F15',
  warning: '#FFA940',
  warningBg: '#FFA94015',

  // Text
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  textInverse: '#0D1117',

  // Chart
  chartLine: '#00C896',
  chartGrid: '#21262D',
  chartFill: '#00C89610',

  // Tab
  tabActive: '#00C896',
  tabInactive: '#484F58',
  tabBar: '#0D1117',
  tabBorder: '#21262D',
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

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  hero: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
