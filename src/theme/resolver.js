/**
 * Theme Resolution System
 * 
 * Resolves the final theme based on:
 * 1. UI role (superadmin vs cafe)
 * 2. Theme mode (light/dark)
 * 3. Cafe branding overrides (if applicable)
 */

import { defaultLightTheme, defaultDarkTheme, createTheme } from './tokens';

/**
 * Resolve final theme
 * 
 * @param {Object} params
 * @param {string} params.uiRole - 'superadmin' | 'cafe' | 'customer'
 * @param {boolean} params.isDarkMode - Whether dark mode is enabled
 * @param {Object} params.cafeBranding - Cafe branding overrides (if applicable)
 * @returns {Object} Resolved theme object
 */
export function resolveTheme({ uiRole, isDarkMode, cafeBranding = null }) {
  // Start with base theme based on mode
  const baseTheme = isDarkMode ? defaultDarkTheme : defaultLightTheme;
  
  // Super Admin UI never uses cafe branding
  if (uiRole === 'superadmin') {
    return baseTheme;
  }
  
  // For cafe/customer UI, apply branding overrides if provided
  if (cafeBranding && (uiRole === 'cafe' || uiRole === 'customer')) {
    const brandingColors = {
      ...baseTheme.colors,
    };
    
    // Apply primary color override
    if (cafeBranding.primaryColor) {
      brandingColors.primary = cafeBranding.primaryColor;
    }
    
    // Apply accent color override (optional)
    if (cafeBranding.accentColor) {
      brandingColors.accent = cafeBranding.accentColor;
    }
    
    // Create themed version with branding
    return createTheme(brandingColors, baseTheme);
  }
  
  // Return base theme if no branding
  return baseTheme;
}

/**
 * Determine UI role from current route
 * 
 * @param {string} pathname - Current route pathname
 * @returns {string} UI role
 */
export function getUIRoleFromRoute(pathname) {
  if (pathname.startsWith('/superadmin')) {
    return 'superadmin';
  }
  if (pathname.startsWith('/customer')) {
    return 'customer';
  }
  // Default to cafe role for admin/chef/reception routes
  return 'cafe';
}

/**
 * Extract cafe branding from cafe settings
 * 
 * @param {Object} cafeSettings - Cafe settings object
 * @returns {Object|null} Branding object or null
 */
export function extractCafeBranding(cafeSettings) {
  if (!cafeSettings) {
    return null;
  }
  
  return {
    logoUrl: cafeSettings.logo_url || null,
    primaryColor: cafeSettings.primary_color || null,
    accentColor: cafeSettings.accent_color || null,
  };
}
