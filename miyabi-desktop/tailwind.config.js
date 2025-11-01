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
        'xl': '0.75rem', // 12px (Design System default)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontWeight: {
        light: 300, // Design System default for Ultra Minimalism
        normal: 400,
        medium: 500,
        semibold: 600,
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
        'status-bar': 'var(--status-bar-height)',
        'panel-header': 'var(--panel-header-height)',
      },
      transitionDuration: {
        'default': 'var(--default-transition)',
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
