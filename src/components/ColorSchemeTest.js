import React from 'react';
import { useColorScheme } from '../contexts/ColorSchemeContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';

const ColorSchemeTest = () => {
  const { currentColors, isDarkMode } = useColorScheme();
  const { cafeSettings } = useCafeSettings();

  // Get computed CSS custom properties
  const getComputedCSSProperty = (propertyName) => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim();
    }
    return 'N/A';
  };

  const computedSurfaceColor = getComputedCSSProperty('--color-surface');
  const computedBackgroundColor = getComputedCSSProperty('--color-background');
  const computedTextColor = getComputedCSSProperty('--color-text');

  return (
    <div className="space-y-6">
      {/* Raw Cafe Settings Debug */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Raw Cafe Settings Debug</h4>
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Has light_surface_color:</strong> {'light_surface_color' in cafeSettings ? 'YES' : 'NO'}
          </div>
          <div className="text-sm">
            <strong>Has dark_surface_color:</strong> {'dark_surface_color' in cafeSettings ? 'YES' : 'NO'}
          </div>
          <div className="text-sm">
            <strong>light_surface_color value:</strong> {cafeSettings.light_surface_color || 'UNDEFINED'}
          </div>
          <div className="text-sm">
            <strong>dark_surface_color value:</strong> {cafeSettings.dark_surface_color || 'UNDEFINED'}
          </div>
          <div className="text-sm">
            <strong>All color fields:</strong>
          </div>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(
              Object.keys(cafeSettings).filter(key => key.includes('color')),
              null,
              2
            )}
          </pre>
        </div>
      </div>

      {/* Surface Color Test Section */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Surface Color Test</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-2">Current Surface Color:</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: currentColors.surface }}
                ></div>
                <span className="font-mono text-sm">{currentColors.surface}</span>
              </div>
              <div className="text-sm text-gray-600">
                Computed CSS: {computedSurfaceColor}
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">Surface Color Test Elements:</h5>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded border">
                <span className="text-sm">This should use surface color</span>
              </div>
              <div className="card p-3">
                <span className="text-sm">Card component test</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Context Display */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Current Colors from Context</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(currentColors).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: value }}
              ></div>
              <div>
                <div className="font-medium text-sm">{key}</div>
                <div className="text-xs text-gray-600 font-mono">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cafe Settings Display */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Cafe Settings Colors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium mb-2">Light Mode Colors</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: cafeSettings.light_surface_color }}
                ></div>
                <span className="text-sm">Surface: {cafeSettings.light_surface_color}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: cafeSettings.light_background_color }}
                ></div>
                <span className="text-sm">Background: {cafeSettings.light_background_color}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: cafeSettings.light_text_color }}
                ></div>
                <span className="text-sm">Text: {cafeSettings.light_text_color}</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">Dark Mode Colors</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: cafeSettings.dark_surface_color }}
                ></div>
                <span className="text-sm">Surface: {cafeSettings.dark_surface_color}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: cafeSettings.dark_background_color }}
                ></div>
                <span className="text-sm">Background: {cafeSettings.dark_background_color}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: cafeSettings.dark_text_color }}
                ></div>
                <span className="text-sm">Text: {cafeSettings.dark_text_color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Custom Properties Test */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">CSS Custom Properties Test</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-2">Computed Values:</h5>
            <div className="space-y-1 text-sm">
              <div>--color-surface: <span className="font-mono">{computedSurfaceColor}</span></div>
              <div>--color-background: <span className="font-mono">{computedBackgroundColor}</span></div>
              <div>--color-text: <span className="font-mono">{computedTextColor}</span></div>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">Test Elements:</h5>
            <div className="space-y-2">
              <div className="bg-white p-2 rounded text-sm">
                bg-white class test
              </div>
              <div className="card p-2 text-sm">
                card class test
              </div>
              <div className="bg-gray-50 p-2 rounded text-sm">
                bg-gray-50 class test
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode Status */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Dark Mode Status</h4>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-2 rounded ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}>
            Current Mode: {isDarkMode ? 'Dark' : 'Light'}
          </div>
          <div className="text-sm">
            <div>Expected Surface: {isDarkMode ? cafeSettings.dark_surface_color : cafeSettings.light_surface_color}</div>
            <div>Actual Surface: {currentColors.surface}</div>
          </div>
        </div>
      </div>

      {/* Tailwind Class Tests */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Tailwind Class Tests</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-2">Background Classes:</h5>
            <div className="space-y-2">
              <div className="bg-white p-2 rounded text-sm">bg-white</div>
              <div className="bg-gray-50 p-2 rounded text-sm">bg-gray-50</div>
              <div className="bg-gray-100 p-2 rounded text-sm">bg-gray-100</div>
              <div className="bg-gray-200 p-2 rounded text-sm">bg-gray-200</div>
              <div className="bg-gray-300 p-2 rounded text-sm">bg-gray-300</div>
              <div className="bg-gray-800 p-2 rounded text-sm">bg-gray-800</div>
              <div className="bg-gray-900 p-2 rounded text-sm">bg-gray-900</div>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">Text Classes:</h5>
            <div className="space-y-2">
              <div className="text-white bg-gray-800 p-2 rounded text-sm">text-white</div>
              <div className="text-gray-900 p-2 rounded text-sm">text-gray-900</div>
              <div className="text-gray-800 p-2 rounded text-sm">text-gray-800</div>
              <div className="text-gray-700 p-2 rounded text-sm">text-gray-700</div>
              <div className="text-gray-600 p-2 rounded text-sm">text-gray-600</div>
              <div className="text-gray-500 p-2 rounded text-sm">text-gray-500</div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Tests */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Component Tests</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">Button Tests:</h5>
            <div className="space-x-2">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-materialize">Materialize Button</button>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">Input Test:</h5>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Test input field"
            />
          </div>
          <div>
            <h5 className="font-medium mb-2">Navigation Tests:</h5>
            <div className="space-x-2">
              <button className="nav-active px-3 py-2 rounded">Active Nav</button>
              <button className="nav-inactive px-3 py-2 rounded">Inactive Nav</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorSchemeTest; 