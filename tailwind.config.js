/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #f8f9f7)',
          100: 'var(--color-primary-100, #f1f3f0)',
          200: 'var(--color-primary-200, #e3e7e1)',
          300: 'var(--color-primary-300, #d1d7cd)',
          400: 'var(--color-primary-400, #b8c2b0)',
          500: 'var(--color-primary, #75826b)',
          600: 'var(--color-primary, #6a7560)',
          700: 'var(--color-primary, #5a6351)',
          800: 'var(--color-primary, #4a5243)',
          900: 'var(--color-primary, #3e4538)',
        },
        secondary: {
          50: 'var(--color-secondary-50, #f0f3f8)',
          100: 'var(--color-secondary-100, #e1e7f1)',
          200: 'var(--color-secondary-200, #c3d0e3)',
          300: 'var(--color-secondary-300, #9db3d0)',
          400: 'var(--color-secondary-400, #6b8bb8)',
          500: 'var(--color-secondary, #153059)',
          600: 'var(--color-secondary, #132b50)',
          700: 'var(--color-secondary, #102443)',
          800: 'var(--color-secondary, #0d1d37)',
          900: 'var(--color-secondary, #0b192f)',
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
        }
      }
    },
  },
  plugins: [],
} 