import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCafeSettings } from './CafeSettingsContext';
import { useDarkMode } from './DarkModeContext';

const ColorSchemeContext = createContext();

export const useColorScheme = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorScheme must be used within a ColorSchemeProvider');
  }
  return context;
};

export const ColorSchemeProvider = ({ children }) => {
  const { cafeSettings } = useCafeSettings();
  const { isDarkMode } = useDarkMode();
  const [currentColors, setCurrentColors] = useState({
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981',
    background: '#FFFFFF',
    text: '#1F2937',
    surface: '#F9FAFB'
  });

  // Update colors when cafe settings or dark mode changes
  useEffect(() => {
    const newColors = isDarkMode ? {
      primary: cafeSettings.dark_primary_color || '#60A5FA',
      secondary: cafeSettings.dark_secondary_color || '#9CA3AF',
      accent: cafeSettings.dark_accent_color || '#34D399',
      background: cafeSettings.dark_background_color || '#111827',
      text: cafeSettings.dark_text_color || '#F9FAFB',
      surface: cafeSettings.dark_surface_color || '#1F2937'
    } : {
      primary: cafeSettings.light_primary_color || '#3B82F6',
      secondary: cafeSettings.light_secondary_color || '#6B7280',
      accent: cafeSettings.light_accent_color || '#10B981',
      background: cafeSettings.light_background_color || '#FFFFFF',
      text: cafeSettings.light_text_color || '#1F2937',
      surface: cafeSettings.light_surface_color || '#F9FAFB'
    };

    setCurrentColors(newColors);

    // Apply CSS custom properties to document root
    const root = document.documentElement;
    root.style.setProperty('--color-primary', newColors.primary);
    root.style.setProperty('--color-secondary', newColors.secondary);
    root.style.setProperty('--color-accent', newColors.accent);
    root.style.setProperty('--color-background', newColors.background);
    root.style.setProperty('--color-text', newColors.text);
    root.style.setProperty('--color-surface', newColors.surface);
  }, [cafeSettings, isDarkMode]);

  const getColor = (colorType) => {
    return currentColors[colorType] || '#3B82F6';
  };

  const value = {
    currentColors,
    getColor,
    isDarkMode
  };

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}; 