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
    
    // Apply secondary color override (if provided)
    if (cafeBranding.secondaryColor) {
      brandingColors.secondary = cafeBranding.secondaryColor;
    }
    
    // Apply accent color override (optional)
    if (cafeBranding.accentColor) {
      brandingColors.accent = cafeBranding.accentColor;
    }
    
    // Apply background color override
    if (cafeBranding.backgroundColor) {
      brandingColors.background = cafeBranding.backgroundColor;
    }
    
    // Apply text color override
    if (cafeBranding.textColor) {
      brandingColors.text = {
        ...brandingColors.text,
        primary: cafeBranding.textColor,
      };
    }
    
    // Apply surface color override
    if (cafeBranding.surfaceColor) {
      brandingColors.surface = cafeBranding.surfaceColor;
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
  if (pathname.startsWith('/customer') || pathname.startsWith('/cafe/')) {
    return 'customer';
  }
  // Default to cafe role for admin/chef/reception routes
  return 'cafe';
}

/**
 * Extract cafe branding from cafe settings
 * 
 * @param {Object} cafeSettings - Cafe settings object
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {Object|null} Branding object or null
 */
export function extractCafeBranding(cafeSettings, isDarkMode = false) {
  if (!cafeSettings) {
    return null;
  }
  
  // Use light or dark colors based on mode
  const primaryColor = isDarkMode 
    ? (cafeSettings.dark_primary_color || cafeSettings.primary_color || null)
    : (cafeSettings.light_primary_color || cafeSettings.primary_color || null);
    
  const secondaryColor = isDarkMode
    ? (cafeSettings.dark_secondary_color || cafeSettings.secondary_color || null)
    : (cafeSettings.light_secondary_color || cafeSettings.secondary_color || null);
    
  const accentColor = isDarkMode
    ? (cafeSettings.dark_accent_color || cafeSettings.accent_color || null)
    : (cafeSettings.light_accent_color || cafeSettings.accent_color || null);
  
  // Extract background, text, and surface colors
  const backgroundColor = isDarkMode
    ? (cafeSettings.dark_background_color || null)
    : (cafeSettings.light_background_color || null);
    
  const textColor = isDarkMode
    ? (cafeSettings.dark_text_color || null)
    : (cafeSettings.light_text_color || null);
    
  const surfaceColor = isDarkMode
    ? (cafeSettings.dark_surface_color || null)
    : (cafeSettings.light_surface_color || null);
  
  return {
    logoUrl: cafeSettings.logo_url || null,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textColor,
    surfaceColor,
  };
}
