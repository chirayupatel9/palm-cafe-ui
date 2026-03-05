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
  primary: '#334b26',
  secondary: '#91590b',
  accent: '#a57f42',
  background: '#e1e5df',
  surface: '#e1e5df',
  text: {
    primary: '#0b0f05',
    muted: '#b3af9b',
    disabled: '#91590b'
  },
  border: '#b3af9b',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const defaultDarkColors: ThemeColors = {
  primary: '#334b26',
  secondary: '#91590b',
  accent: '#a57f42',
  background: '#0b0f05',
  surface: '#253419',
  text: {
    primary: '#e1e5df',
    muted: '#b3af9b',
    disabled: '#a57f42'
  },
  border: '#334b26',
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
