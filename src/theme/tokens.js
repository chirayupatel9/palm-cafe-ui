/**
 * Design Token System
 * 
 * Centralized design tokens for the application.
 * These tokens form the foundation of the theming system.
 */

// Base design tokens (semantic tokens)
export const baseTokens = {
  // Spacing scale (4px base unit)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
};

// Default color palette (light mode)
export const defaultLightColors = {
  primary: '#6F4E37',
  secondary: '#153059',
  accent: '#D4A574',
  background: '#F5F5DC',
  surface: '#FFFFFF',
  text: {
    primary: '#2C1810',
    muted: '#6B7280',
    disabled: '#9CA3AF',
  },
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Default color palette (dark mode)
export const defaultDarkColors = {
  primary: '#8B6F47',
  secondary: '#A0826D',
  accent: '#D4A574',
  background: '#1a1612',
  surface: '#2c241d',
  text: {
    primary: '#F5F5DC',
    muted: '#9CA3AF',
    disabled: '#6B7280',
  },
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
};

/**
 * Generate theme object from base tokens and colors
 */
export function createTheme(colors, tokens = baseTokens) {
  return {
    colors,
    ...tokens,
  };
}

/**
 * Default themes
 */
export const defaultLightTheme = createTheme(defaultLightColors);
export const defaultDarkTheme = createTheme(defaultDarkColors);
