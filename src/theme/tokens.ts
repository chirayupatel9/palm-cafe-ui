/**
 * Design Token System - Centralized design tokens for the application.
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    muted: string;
    disabled: string;
  };
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface BaseTokens {
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

export const baseTokens: BaseTokens = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease'
  }
};

export const defaultLightColors: ThemeColors = {
  primary: '#6F4E37',
  secondary: '#153059',
  accent: '#D4A574',
  background: '#F7F4EF',
  surface: '#FFFCF7',
  text: {
    primary: '#2C1810',
    muted: '#6B7280',
    disabled: '#9CA3AF'
  },
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const defaultDarkColors: ThemeColors = {
  primary: '#8B6F47',
  secondary: '#A0826D',
  accent: '#D4A574',
  background: '#1a1612',
  surface: '#2c241d',
  text: {
    primary: '#F7F4EF',
    muted: '#9CA3AF',
    disabled: '#6B7280'
  },
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA'
};

export interface Theme {
  colors: ThemeColors;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

export function createTheme(colors: ThemeColors, tokens: BaseTokens = baseTokens): Theme {
  return {
    colors,
    ...tokens
  };
}

export const defaultLightTheme = createTheme(defaultLightColors);
export const defaultDarkTheme = createTheme(defaultDarkColors);
