const brandColors = {
  primary: {
    DEFAULT: '#2563eb',
    soft: '#eff6ff',
  },
  surface: {
    DEFAULT: '#f8fafc',
    dark: '#111827',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#64748b',
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const spacingScale = {
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  64: '16rem',
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: brandColors,
        // Agent role colors (Design System - HSL format)
        agent: {
          coordinator: 'hsl(239, 84%, 67%)', // Indigo
          codegen: 'hsl(142, 76%, 59%)', // Green
          review: 'hsl(45, 93%, 58%)', // Yellow
          deployment: 'hsl(0, 84%, 60%)', // Red
          issue: 'hsl(213, 94%, 68%)', // Blue
          pr: 'hsl(271, 91%, 73%)', // Purple
          refresher: 'hsl(180, 65%, 55%)', // Cyan
        },
        // Status colors (Design System)
        status: {
          success: 'hsl(142, 76%, 59%)', // Green
          warning: 'hsl(45, 93%, 58%)', // Yellow
          error: 'hsl(0, 84%, 60%)', // Red
          info: 'hsl(213, 94%, 68%)', // Blue
        },
        // CSS Variable-based colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        display: ['4.5rem', { lineHeight: '0.9', fontWeight: '200' }],
        h1: ['3rem', { lineHeight: '1.05', fontWeight: '300' }],
        h2: ['2rem', { lineHeight: '1.1', fontWeight: '400' }],
        'body-lg': ['1.25rem', { lineHeight: '1.35' }],
        body: ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.45' }],
      },
      fontWeight: {
        light: 300, // Design System default for Ultra Minimalism
        normal: 400,
        medium: 500,
        semibold: 600,
      },
      spacing: {
        ...spacingScale,
        sidebar: 'var(--sidebar-width)',
        'status-bar': 'var(--status-bar-height)',
        'panel-header': 'var(--panel-header-height)',
      },
      transitionDuration: {
        'default': 'var(--default-transition)',
      },
      boxShadow: {
        'brand-xs': '0 1px 2px rgba(15, 23, 42, 0.08)',
        'brand-sm': '0 2px 6px rgba(15, 23, 42, 0.12)',
        'brand-md': '0 12px 32px rgba(15, 23, 42, 0.18)',
        focus: '0 0 0 3px rgba(37, 99, 235, 0.25)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
