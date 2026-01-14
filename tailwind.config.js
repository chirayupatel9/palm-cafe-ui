/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme tokens - use CSS variables
        primary: {
          DEFAULT: 'var(--color-primary)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        background: {
          DEFAULT: 'var(--color-background)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          muted: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
        },
        // Legacy color scales for backward compatibility
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50, #fef6ed)',
          100: 'var(--color-primary-100, #fdebd4)',
          200: 'var(--color-primary-200, #fad4a9)',
          300: 'var(--color-primary-300, #f7b975)',
          400: 'var(--color-primary-400, #f49c44)',
          500: 'var(--color-primary)',
          600: 'var(--color-primary)',
          700: 'var(--color-primary)',
          800: 'var(--color-primary)',
          900: 'var(--color-primary)',
        },
        secondary: {
          50: 'var(--color-secondary-50, #f0f3f8)',
          100: 'var(--color-secondary-100, #e1e7f1)',
          200: 'var(--color-secondary-200, #c3d0e3)',
          300: 'var(--color-secondary-300, #9db3d0)',
          400: 'var(--color-secondary-400, #6b8bb8)',
          500: 'var(--color-secondary)',
          600: 'var(--color-secondary)',
          700: 'var(--color-secondary)',
          800: 'var(--color-secondary)',
          900: 'var(--color-secondary)',
        },
        accent: {
          50: '#fdf8f3',
          100: '#fbf1e8',
          200: '#f6e3d1',
          300: '#f0d0b5',
          400: '#e8b88d',
          500: '#e0a066',
          600: '#d4894a',
          700: '#c6733a',
          800: '#a85f32',
          900: '#8a4d2a',
        },
        warm: {
          50: '#fdfbf7',
          100: '#faf6ed',
          200: '#f4ecdb',
          300: '#ecdfc4',
          400: '#e1cfa8',
          500: '#d4bc8a',
          600: '#c4a76e',
          700: '#b08f55',
          800: '#927447',
          900: '#785e3c',
        },
        'background-light': '#f8f7f6',
        'background-dark': '#221910',
        'text-light': '#3D2C22',
        'text-dark': '#f8f7f6',
        'text-subtle-light': '#A16642',
        'text-subtle-dark': '#b0a294',
        'card-light': '#ffffff',
        'card-dark': '#2a1f14',
        'chip-light': '#f3ede7',
        'chip-dark': '#3d2c22',
      }
    },
  },
  plugins: [],
} 