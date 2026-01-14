/**
 * Theme Context
 * 
 * Centralized theme management that:
 * - Resolves theme based on UI role, mode, and branding
 * - Provides theme tokens to components
 * - Applies CSS custom properties
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from './DarkModeContext';
import { useCafeSettings } from './CafeSettingsContext';
import { useAuth } from './AuthContext';
import { resolveTheme, getUIRoleFromRoute, extractCafeBranding } from '../theme/resolver';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
  const { user } = useAuth();
  
  // Determine UI role
  const uiRole = useMemo(() => {
    // If user is superadmin, always use superadmin role
    if (user?.role === 'superadmin') {
      return 'superadmin';
    }
    // Otherwise, determine from route
    return getUIRoleFromRoute(location.pathname);
  }, [user?.role, location.pathname]);
  
  // Extract cafe branding (only for cafe/customer roles)
  const cafeBranding = useMemo(() => {
    if (uiRole === 'superadmin') {
      return null; // Super Admin never uses cafe branding
    }
    return extractCafeBranding(cafeSettings);
  }, [uiRole, cafeSettings]);
  
  // Resolve final theme
  const theme = useMemo(() => {
    return resolveTheme({
      uiRole,
      isDarkMode,
      cafeBranding,
    });
  }, [uiRole, isDarkMode, cafeBranding]);
  
  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color tokens
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-muted', theme.colors.text.muted);
    root.style.setProperty('--color-text-disabled', theme.colors.text.disabled);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);
    
    // Apply spacing tokens
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Apply radius tokens
    Object.entries(theme.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    // Apply shadow tokens
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }, [theme]);
  
  const value = {
    theme,
    uiRole,
    cafeBranding,
    isDarkMode,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
