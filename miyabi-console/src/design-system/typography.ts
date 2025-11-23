/**
 * Miyabi Console - Typography System
 * Based on DESIGN_SYSTEM.md v1.0
 * Jonathan Ive Design Principles
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ].join(', '),
  },

  // Font Sizes (Tailwind Classes)
  fontSize: {
    display: 'text-8xl',      // 96px - Hero Title (Desktop)
    h1: 'text-7xl',           // 72px - Page Title
    h2: 'text-5xl',           // 48px - Section Title
    h3: 'text-4xl',           // 36px - Subsection Title
    h4: 'text-2xl',           // 24px - Card Title
    bodyLarge: 'text-xl',     // 20px - Subtitle
    body: 'text-base',        // 16px - Body Text
    bodySmall: 'text-sm',     // 14px - Small Text
    caption: 'text-xs',       // 12px - Caption, Legal
  },

  // Font Weights
  fontWeight: {
    light: 'font-light',      // 300 - ✅ Titles, Subtitles
    normal: 'font-normal',    // 400 - ✅ Body Text
    medium: 'font-medium',    // 500 - ✅ Emphasis
    semibold: 'font-semibold',// 600 - △ Brand Name Only
  },

  // Letter Spacing
  letterSpacing: {
    tight: 'tracking-tight',   // -0.025em - ✅ Titles
    normal: 'tracking-normal', // 0em - ✅ Body
  },

  // Line Heights
  lineHeight: {
    none: 'leading-none',      // 1.0 - Display, H1
    tight: 'leading-tight',    // 1.25 - H2, H3
    normal: 'leading-normal',  // 1.5 - Body
    relaxed: 'leading-relaxed',// 1.75 - Lists
  },
} as const;

// Preset Typography Styles
export const typographyPresets = {
  // Hero Title (Login Page)
  heroTitle: `text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 leading-none`,

  // Page Title
  pageTitle: `text-5xl md:text-7xl font-light tracking-tight text-gray-900 leading-none`,

  // Section Title
  sectionTitle: `text-3xl md:text-5xl font-normal text-gray-900 leading-tight`,

  // Subtitle
  subtitle: `text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light tracking-tight`,

  // Body Text
  body: `text-base font-normal text-gray-700 leading-normal`,

  // Caption
  caption: `text-xs font-normal text-gray-500 leading-normal`,
} as const;

// Text Color Classes
export const textColors = {
  primary: 'text-gray-900',
  secondary: 'text-gray-600',
  tertiary: 'text-gray-500',
  accent: 'text-blue-600',
  accentHover: 'hover:text-blue-700',
} as const;

// Example Usage:
// <h1 className={typographyPresets.heroTitle}>Miyabi Console</h1>
// <p className={typographyPresets.body}>Body text here</p>
