/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--color-primary)', 50: 'var(--color-primary-50, #e8ebe6)', 100: 'var(--color-primary-100, #d1d7cc)', 200: 'var(--color-primary-200, #a3af99)', 300: 'var(--color-primary-300, #6b7d5c)', 400: 'var(--color-primary-400, #4d5c42)', 500: 'var(--color-primary)', 600: 'var(--color-primary)', 700: 'var(--color-primary)', 800: 'var(--color-primary)', 900: 'var(--color-primary)' },
        secondary: { DEFAULT: 'var(--color-secondary)', 50: 'var(--color-secondary-50, #f5efe5)', 100: 'var(--color-secondary-100, #e6d9c4)', 200: 'var(--color-secondary-200, #cdb389)', 300: 'var(--color-secondary-300, #a57f42)', 400: 'var(--color-secondary-400, #91590b)', 500: 'var(--color-secondary)', 600: 'var(--color-secondary)', 700: 'var(--color-secondary)', 800: 'var(--color-secondary)', 900: 'var(--color-secondary)' },
        accent: { DEFAULT: 'var(--color-accent)', 50: 'var(--color-accent-50, #f5efe5)', 100: 'var(--color-accent-100, #e6d9c4)', 200: 'var(--color-accent-200, #cdb389)', 300: 'var(--color-accent-300, #b3935c)', 400: 'var(--color-accent-400, #a57f42)', 500: 'var(--color-accent)', 600: 'var(--color-accent)', 700: 'var(--color-accent)', 800: 'var(--color-accent)', 900: 'var(--color-accent)' },
        background: { DEFAULT: 'var(--color-background)' },
        surface: { DEFAULT: 'var(--color-surface)' },
        text: { primary: 'var(--color-text-primary)', muted: 'var(--color-text-muted)', disabled: 'var(--color-text-disabled)' },
        'muted-foreground': 'var(--color-text-muted)',
        border: { DEFAULT: 'var(--color-border)' },
        success: { DEFAULT: 'var(--color-success)' },
        warning: { DEFAULT: 'var(--color-warning)' },
        error: { DEFAULT: 'var(--color-error)' },
        info: { DEFAULT: 'var(--color-info)' },
        warm: { 50: '#fdfbf7', 100: '#faf6ed', 200: '#f4ecdb', 300: '#ecdfc4', 400: '#e1cfa8', 500: '#d4bc8a', 600: '#c4a76e', 700: '#b08f55', 800: '#927447', 900: '#785e3c' },
        /* Palette: #e1e5df #b3af9b #a57f42 #91590b #334b26 #0b0f05 */
        palette: {
          light: '#e1e5df',
          muted: '#b3af9b',
          accent: '#a57f42',
          brown: '#91590b',
          green: '#334b26',
          dark: '#0b0f05'
        },
        'background-light': 'var(--surface-page)', 'background-dark': 'var(--surface-page)', 'text-light': 'var(--color-on-surface)', 'text-dark': 'var(--color-on-surface)', 'text-subtle-light': 'var(--color-on-surface-variant)', 'text-subtle-dark': 'var(--color-on-surface-variant)', 'card-light': 'var(--surface-card)', 'card-dark': 'var(--surface-card)', 'chip-light': 'var(--color-primary-container)', 'chip-dark': 'var(--color-primary-container)' },
      keyframes: { 'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } }, 'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } } },
      animation: { 'accordion-down': 'accordion-down 0.2s ease-out', 'accordion-up': 'accordion-up 0.2s ease-out' }
    }
  },
  plugins: []
};
