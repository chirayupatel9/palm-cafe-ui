import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from './DarkModeContext';
import { useCafeSettings } from './CafeSettingsContext';
import { useAuth } from './AuthContext';
import { resolveTheme, getUIRoleFromRoute, extractCafeBranding } from '../theme/resolver';
import type { Theme } from '../theme/tokens';
import type { UIRole } from '../theme/resolver';
import type { CafeBranding } from '../theme/resolver';

export interface ThemeContextValue {
  theme: Theme;
  uiRole: UIRole;
  cafeBranding: CafeBranding | null;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const darkenColor = (color: string, percent = 15): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const newR = Math.max(0, Math.floor(r * (1 - percent / 100)));
  const newG = Math.max(0, Math.floor(g * (1 - percent / 100)));
  const newB = Math.max(0, Math.floor(b * (1 - percent / 100)));
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
  const { user } = useAuth();

  const uiRole = useMemo((): UIRole => {
    if (user?.role === 'superadmin') return 'superadmin';
    return getUIRoleFromRoute(location.pathname);
  }, [user?.role, location.pathname]);

  const cafeBranding = useMemo(() => {
    if (uiRole === 'superadmin') return null;
    return extractCafeBranding(cafeSettings, isDarkMode);
  }, [uiRole, cafeSettings, isDarkMode]);

  const theme = useMemo(
    () =>
      resolveTheme({
        uiRole,
        isDarkMode,
        cafeBranding
      }),
    [uiRole, isDarkMode, cafeBranding]
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-dark', darkenColor(theme.colors.primary, 15));
    root.style.setProperty('--color-on-primary', '#FFFFFF');
    root.style.setProperty('--color-primary-container', isDarkMode ? theme.colors.surface : theme.colors.background);
    root.style.setProperty('--color-on-primary-container', theme.colors.text.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-on-secondary', '#FFFFFF');
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-on-accent', '#FFFFFF');
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-on-background', theme.colors.text.primary);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-on-surface', theme.colors.text.primary);
    root.style.setProperty('--color-surface-variant', isDarkMode ? theme.colors.border : theme.colors.background);
    root.style.setProperty('--color-on-surface-variant', theme.colors.text.muted);
    root.style.setProperty('--color-outline', theme.colors.border);
    root.style.setProperty('--color-outline-variant', isDarkMode ? theme.colors.border : theme.colors.background);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-on-success', '#FFFFFF');
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-on-warning', '#FFFFFF');
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-on-error', '#FFFFFF');
    root.style.setProperty('--color-info', theme.colors.info);
    root.style.setProperty('--color-on-info', '#FFFFFF');
    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-secondary', theme.colors.text.muted);
    root.style.setProperty('--color-text-disabled', theme.colors.text.disabled);
    root.style.setProperty('--color-text-muted', theme.colors.text.muted);
    root.style.setProperty('--color-border', theme.colors.border);
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    Object.entries(theme.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }, [theme, isDarkMode]);

  const value: ThemeContextValue = { theme, uiRole, cafeBranding, isDarkMode };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
