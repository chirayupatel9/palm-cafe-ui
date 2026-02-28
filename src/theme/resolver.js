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
 * Return the final theme object for the given UI role and mode, applying cafe branding overrides when applicable.
 *
 * For 'superadmin' the base theme is returned unchanged. For 'cafe' and 'customer', provided cafeBranding values
 * override corresponding color fields on the base theme before creating the final theme.
 *
 * @param {Object} params - Function parameters.
 * @param {'superadmin'|'cafe'|'customer'} params.uiRole - UI role that determines branding applicability.
 * @param {boolean} params.isDarkMode - Whether dark mode is active; selects the base theme.
 * @param {Object|null} [params.cafeBranding=null] - Optional branding overrides (e.g., primaryColor, secondaryColor, accentColor, backgroundColor, textColor, surfaceColor, logoUrl).
 * @returns {Object} The resolved theme object with branding applied when appropriate.
 */
export function resolveTheme({ uiRole, isDarkMode, cafeBranding = null }) {
  // Start with base theme based on mode
  const baseTheme = isDarkMode ? defaultDarkTheme : defaultLightTheme;
  
  // Super Admin UI never uses cafe branding
  if (uiRole === 'superadmin') {
    return baseTheme;
  }

  // For cafe and customer UI, apply branding overrides if provided
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
