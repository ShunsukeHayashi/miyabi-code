/**
 * Miyabi Mission Control - Recommended Tailwind Configuration
 *
 * This is the recommended Tailwind config based on the Mission Control Design System.
 * To use this configuration:
 * 1. Backup your current tailwind.config.ts
 * 2. Replace or merge this configuration with your existing one
 * 3. Run `npm install` to ensure all dependencies are installed
 *
 * @see DESIGN_SYSTEM.md for design system documentation
 * @see COMPONENT_STYLES.md for component-specific styles
 */

import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ========================================
      // COLORS - Mission Control Palette
      // ========================================
      colors: {
        // CSS variable-based colors (recommended for theme switching)
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Primary Miyabi Colors
        miyabi: {
          blue: "#3B82F6",
          purple: "#A855F7",
          green: "#10B981",
          red: "#EF4444",
          amber: "#F59E0B",
        },

        // Extended color palette with shades
        "miyabi-blue": {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6", // Primary
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },

        "miyabi-purple": {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7", // Primary
          600: "#9333EA",
          700: "#7E22CE",
          800: "#6B21A8",
          900: "#581C87",
          950: "#3B0764",
        },

        "miyabi-green": {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981", // Primary
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },

        "miyabi-red": {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444", // Primary
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
        },

        "miyabi-amber": {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // Primary
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },

        // Semantic status colors (shorthand)
        status: {
          idle: "#4B5563", // gray-600
          running: "#3B82F6", // miyabi-blue
          completed: "#10B981", // miyabi-green
          failed: "#EF4444", // miyabi-red
          warning: "#F59E0B", // miyabi-amber
        },
      },

      // ========================================
      // TYPOGRAPHY
      // ========================================
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Monaco",
          ...defaultTheme.fontFamily.mono,
        ],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.5" }], // 14px
        base: ["1rem", { lineHeight: "1.5" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.6" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.4" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "1.4" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "1.3" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "1.2" }], // 36px
        "5xl": ["3rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }], // 60px
      },

      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },

      // ========================================
      // SPACING & SIZING
      // ========================================
      spacing: {
        xs: "0.5rem", // 8px
        sm: "1rem", // 16px
        md: "1.5rem", // 24px
        lg: "2rem", // 32px
        xl: "3rem", // 48px
        "2xl": "4rem", // 64px
        "3xl": "6rem", // 96px
      },

      // ========================================
      // BREAKPOINTS (Custom)
      // ========================================
      screens: {
        xs: "320px", // Small phones
        sm: "640px", // Large phones
        md: "768px", // Tablets
        lg: "1024px", // Small laptops
        xl: "1280px", // Desktop
        "2xl": "1536px", // Large desktop
      },

      // ========================================
      // BORDERS & RADIUS
      // ========================================
      borderRadius: {
        none: "0",
        sm: "0.25rem", // 4px
        DEFAULT: "0.5rem", // 8px
        md: "0.5rem", // 8px
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px
        "2xl": "1.5rem", // 24px
        full: "9999px",
      },

      borderWidth: {
        DEFAULT: "1px",
        0: "0",
        2: "2px",
        4: "4px",
        8: "8px",
      },

      // ========================================
      // SHADOWS
      // ========================================
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)",
        none: "none",
      },

      // ========================================
      // ANIMATION & TRANSITIONS
      // ========================================
      transitionProperty: {
        colors:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
        opacity: "opacity",
        transform: "transform",
        all: "all",
      },

      transitionDuration: {
        DEFAULT: "200ms",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms",
      },

      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)", // ease-in-out
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)", // ease-in
        out: "cubic-bezier(0, 0, 0.2, 1)", // ease-out
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)", // ease-in-out
      },

      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-bottom": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },

      animation: {
        "spin-slow": "spin-slow 3s linear infinite",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
      },

      // ========================================
      // BACKDROP BLUR (for modals, overlays)
      // ========================================
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },

      // ========================================
      // Z-INDEX SCALE
      // ========================================
      zIndex: {
        0: "0",
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        "modal-backdrop": "1040",
        modal: "1050",
        popover: "1060",
        tooltip: "1070",
      },

      // ========================================
      // GRID TEMPLATES
      // ========================================
      gridTemplateColumns: {
        "auto-fill-100": "repeat(auto-fill, minmax(100px, 1fr))",
        "auto-fill-200": "repeat(auto-fill, minmax(200px, 1fr))",
        "auto-fill-300": "repeat(auto-fill, minmax(300px, 1fr))",
        "auto-fit-100": "repeat(auto-fit, minmax(100px, 1fr))",
        "auto-fit-200": "repeat(auto-fit, minmax(200px, 1fr))",
        "auto-fit-300": "repeat(auto-fit, minmax(300px, 1fr))",
      },
    },
  },

  // ========================================
  // PLUGINS
  // ========================================
  plugins: [
    // Recommended plugins for Mission Control
    // Uncomment and install as needed:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'),
  ],
};

export default config;
