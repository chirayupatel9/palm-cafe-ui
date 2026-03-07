import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCafeSettings } from './CafeSettingsContext';
import { useDarkMode } from './DarkModeContext';

export interface CurrentColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  surface: string;
}

export interface ColorSchemeContextValue {
  currentColors: CurrentColors;
  getColor: (colorType: keyof CurrentColors) => string;
  isDarkMode: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export const useColorScheme = (): ColorSchemeContextValue => {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorScheme must be used within a ColorSchemeProvider');
  }
  return context;
};

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

interface ColorSchemeProviderProps {
  children: ReactNode;
}

export const ColorSchemeProvider: React.FC<ColorSchemeProviderProps> = ({ children }) => {
  const { cafeSettings } = useCafeSettings();
  const { isDarkMode } = useDarkMode();
  const [currentColors, setCurrentColors] = useState<CurrentColors>({
    primary: '#334b26',
    secondary: '#91590b',
    accent: '#a57f42',
    background: '#e1e5df',
    text: '#0b0f05',
    surface: '#e1e5df'
  });

  useEffect(() => {
    const newColors: CurrentColors = isDarkMode
      ? {
          primary: cafeSettings.dark_primary_color || '#334b26',
          secondary: cafeSettings.dark_secondary_color || '#91590b',
          accent: cafeSettings.dark_accent_color || '#a57f42',
          background: cafeSettings.dark_background_color || '#0b0f05',
          text: cafeSettings.dark_text_color || '#e1e5df',
          surface: cafeSettings.dark_surface_color || '#253419'
        }
      : {
          primary: cafeSettings.light_primary_color || '#334b26',
          secondary: cafeSettings.light_secondary_color || '#91590b',
          accent: cafeSettings.light_accent_color || '#a57f42',
          background: cafeSettings.light_background_color || '#e1e5df',
          text: cafeSettings.light_text_color || '#0b0f05',
          surface: cafeSettings.light_surface_color || '#e1e5df'
        };

    setCurrentColors(newColors);

    const root = document.documentElement;
    root.style.setProperty('--color-primary', newColors.primary);
    root.style.setProperty('--color-primary-dark', darkenColor(newColors.primary, 15));
    root.style.setProperty('--color-on-primary', '#e1e5df');
    root.style.setProperty('--color-primary-container', isDarkMode ? newColors.surface : newColors.background);
    root.style.setProperty('--color-on-primary-container', newColors.text);
    root.style.setProperty('--color-secondary', newColors.secondary);
    root.style.setProperty('--color-on-secondary', '#e1e5df');
    root.style.setProperty('--color-accent', newColors.accent);
    root.style.setProperty('--color-on-accent', '#e1e5df');
    root.style.setProperty('--color-background', newColors.background);
    root.style.setProperty('--color-on-background', newColors.text);
    root.style.setProperty('--color-surface', newColors.surface);
    root.style.setProperty('--color-on-surface', newColors.text);
    root.style.setProperty('--color-text-primary', newColors.text);
    root.style.setProperty('--color-text', newColors.text);
  }, [cafeSettings, isDarkMode]);

  const getColor = (colorType: keyof CurrentColors): string => {
    return currentColors[colorType] ?? '#334b26';
  };

  const value: ColorSchemeContextValue = { currentColors, getColor, isDarkMode };

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
};
