/**
 * Theme Resolution System - Resolves final theme by UI role, mode, and cafe branding.
 */

import { defaultLightTheme, defaultDarkTheme, createTheme, Theme, ThemeColors } from './tokens';

export type UIRole = 'superadmin' | 'cafe' | 'customer';

export interface CafeBranding {
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  surfaceColor: string | null;
}

export interface ResolveThemeParams {
  uiRole: UIRole;
  isDarkMode: boolean;
  cafeBranding?: CafeBranding | null;
}

export function resolveTheme({ uiRole, isDarkMode, cafeBranding = null }: ResolveThemeParams): Theme {
  const baseTheme = isDarkMode ? defaultDarkTheme : defaultLightTheme;

  if (uiRole === 'superadmin') {
    return baseTheme;
  }

  if (cafeBranding && (uiRole === 'cafe' || uiRole === 'customer')) {
    const brandingColors: ThemeColors = {
      ...baseTheme.colors
    };

    if (cafeBranding.primaryColor) {
      brandingColors.primary = cafeBranding.primaryColor;
    }
    if (cafeBranding.secondaryColor) {
      brandingColors.secondary = cafeBranding.secondaryColor;
    }
    if (cafeBranding.accentColor) {
      brandingColors.accent = cafeBranding.accentColor;
    }
    if (cafeBranding.backgroundColor) {
      brandingColors.background = cafeBranding.backgroundColor;
    }
    if (cafeBranding.textColor) {
      brandingColors.text = {
        ...brandingColors.text,
        primary: cafeBranding.textColor
      };
    }
    if (cafeBranding.surfaceColor) {
      brandingColors.surface = cafeBranding.surfaceColor;
    }

    return createTheme(brandingColors, baseTheme);
  }

  return baseTheme;
}

export function getUIRoleFromRoute(pathname: string): UIRole {
  if (pathname.startsWith('/superadmin')) {
    return 'superadmin';
  }
  if (pathname.startsWith('/customer') || pathname.startsWith('/cafe/')) {
    return 'customer';
  }
  return 'cafe';
}

export interface CafeSettingsBrandingSource {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  light_primary_color?: string | null;
  light_secondary_color?: string | null;
  light_accent_color?: string | null;
  light_background_color?: string | null;
  light_text_color?: string | null;
  light_surface_color?: string | null;
  dark_primary_color?: string | null;
  dark_secondary_color?: string | null;
  dark_accent_color?: string | null;
  dark_background_color?: string | null;
  dark_text_color?: string | null;
  dark_surface_color?: string | null;
}

export function extractCafeBranding(
  cafeSettings: CafeSettingsBrandingSource | null | undefined,
  isDarkMode = false
): CafeBranding | null {
  if (!cafeSettings) {
    return null;
  }

  const primaryColor = isDarkMode
    ? (cafeSettings.dark_primary_color ?? cafeSettings.primary_color ?? null)
    : (cafeSettings.light_primary_color ?? cafeSettings.primary_color ?? null);
  const secondaryColor = isDarkMode
    ? (cafeSettings.dark_secondary_color ?? cafeSettings.secondary_color ?? null)
    : (cafeSettings.light_secondary_color ?? cafeSettings.secondary_color ?? null);
  const accentColor = isDarkMode
    ? (cafeSettings.dark_accent_color ?? cafeSettings.accent_color ?? null)
    : (cafeSettings.light_accent_color ?? cafeSettings.accent_color ?? null);
  const backgroundColor = isDarkMode
    ? cafeSettings.dark_background_color ?? null
    : cafeSettings.light_background_color ?? null;
  const textColor = isDarkMode
    ? cafeSettings.dark_text_color ?? null
    : cafeSettings.light_text_color ?? null;
  const surfaceColor = isDarkMode
    ? cafeSettings.dark_surface_color ?? null
    : cafeSettings.light_surface_color ?? null;

  return {
    logoUrl: cafeSettings.logo_url ?? null,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textColor,
    surfaceColor
  };
}
