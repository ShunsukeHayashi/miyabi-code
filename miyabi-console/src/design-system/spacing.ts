/**
 * Miyabi Console - Spacing System
 * Based on DESIGN_SYSTEM.md v1.0
 * 8px Base Grid System
 */

export const spacing = {
  // Base Spacing (Tailwind Scale)
  base: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
    48: '12rem',   // 192px
  },

  // Section Spacing (Responsive)
  section: {
    mobile: 'py-12 px-4',        // 48px vertical, 16px horizontal
    tablet: 'py-20 px-6',        // 80px vertical, 24px horizontal
    desktop: 'py-32 px-8',       // 128px vertical, 32px horizontal
    responsive: 'py-12 sm:py-20 md:py-32 px-4 sm:px-6 lg:px-8',
  },

  // Card Spacing (Responsive)
  card: {
    mobile: 'p-6',               // 24px
    tablet: 'p-8',               // 32px
    desktop: 'p-12',             // 48px
    responsive: 'p-6 sm:p-8 md:p-10 lg:p-12',
  },

  // Margin Bottom (Responsive)
  marginBottom: {
    small: 'mb-4 sm:mb-6 md:mb-8',           // 16→24→32px
    medium: 'mb-8 sm:mb-12 md:mb-16',        // 32→48→64px
    large: 'mb-8 sm:mb-12 md:mb-16 lg:mb-20',// 32→48→64→80px
  },

  // Gap (Flex/Grid)
  gap: {
    small: 'gap-2 sm:gap-3',                 // 8→12px
    medium: 'gap-4 sm:gap-6',                // 16→24px
    large: 'gap-6 sm:gap-8',                 // 24→32px
  },
} as const;

// Preset Spacing Patterns
export const spacingPresets = {
  // Hero Section
  heroSection: 'mb-8 sm:mb-12 md:mb-16 lg:mb-20',

  // Card Container
  cardContainer: 'p-6 sm:p-8 md:p-10 lg:p-12',

  // Feature List
  featureList: 'space-y-3 sm:space-y-4',

  // Button Group
  buttonGroup: 'space-x-3',

  // Page Container
  pageContainer: 'max-w-md sm:max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6 lg:px-8',
} as const;

// Example Usage:
// <section className={spacing.section.responsive}>
// <Card className={spacing.card.responsive}>
// <div className={spacingPresets.featureList}>
