/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1f6feb',
          50: '#e6f1ff',
          100: '#b3d7ff',
          200: '#80bdff',
          300: '#4da3ff',
          400: '#1a89ff',
          500: '#1f6feb',
          600: '#1958b8',
          700: '#134185',
          800: '#0d2a52',
          900: '#07131f',
        },
        success: '#3fb950',
        warning: '#d29922',
        danger: '#f85149',
        background: {
          DEFAULT: '#0d1117',
          light: '#161b22',
          lighter: '#1c2128',
        },
        foreground: {
          DEFAULT: '#e6edf3',
          muted: '#8b949e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
