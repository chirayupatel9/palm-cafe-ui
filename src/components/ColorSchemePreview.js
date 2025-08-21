import React from 'react';
import { useColorScheme } from '../contexts/ColorSchemeContext';
import { useDarkMode } from '../contexts/DarkModeContext';

const ColorSchemePreview = () => {
  const { currentColors } = useColorScheme();
  const { isDarkMode } = useDarkMode();

  const colorTypes = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'text', label: 'Text' }
  ];

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700" style={{ backgroundColor: currentColors.surface }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: currentColors.text }}>
        Current Color Scheme ({isDarkMode ? 'Dark' : 'Light'} Mode)
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {colorTypes.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center space-y-2">
            <div 
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: currentColors[key] }}
            ></div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: currentColors.text }}>
                {label}
              </p>
              <p className="text-xs font-mono" style={{ color: currentColors.secondary }}>
                {currentColors[key]}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Component Preview */}
      <div className="space-y-4">
        <h4 className="text-md font-medium" style={{ color: currentColors.text }}>Component Preview</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Preview */}
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: currentColors.surface, 
            borderColor: currentColors.secondary,
            color: currentColors.text 
          }}>
            <h5 className="font-medium mb-2">Card Component</h5>
            <p className="text-sm" style={{ color: currentColors.secondary }}>
              This is how cards will look with the current color scheme.
            </p>
          </div>
          
          {/* Button Preview */}
          <div className="space-y-2">
            <button 
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ 
                backgroundColor: currentColors.secondary, 
                color: currentColors.background 
              }}
            >
              Primary Button
            </button>
            <button 
              className="px-4 py-2 rounded-lg font-medium border transition-colors"
              style={{ 
                backgroundColor: currentColors.surface, 
                color: currentColors.text,
                borderColor: currentColors.secondary 
              }}
            >
              Secondary Button
            </button>
          </div>
        </div>
        
        {/* Text Preview */}
        <div className="space-y-2">
          <h5 className="font-medium" style={{ color: currentColors.text }}>Text Preview</h5>
          <p style={{ color: currentColors.text }}>This is primary text color.</p>
          <p style={{ color: currentColors.secondary }}>This is secondary text color.</p>
          <p style={{ color: currentColors.accent }}>This is accent text color.</p>
        </div>
      </div>
    </div>
  );
};

export default ColorSchemePreview; 