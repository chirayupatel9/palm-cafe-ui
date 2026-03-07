import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = '' }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className={`glass-card h-10 w-10 flex items-center justify-center p-2 border border-[var(--color-outline-variant)] rounded-lg transition-all duration-200 hover:scale-105 hover:bg-[var(--surface-table)]/70 shadow-sm ${
        isDarkMode
          ? 'text-yellow-300'
          : 'text-yellow-500'
      } ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

export default DarkModeToggle;
