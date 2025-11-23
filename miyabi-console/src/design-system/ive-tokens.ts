/**
 * Miyabi Design System - Jonathan Ive Edition
 *
 * Philosophy:
 * 1. Extreme Minimalism - Remove all decoration, keep only essence
 * 2. Generous Whitespace - Luxury of emptiness (py-48 = 192px)
 * 3. Refined Colors - Grayscale foundation + ONE accent color
 * 4. Typography-Focused - Huge ultra-light titles with bold size contrast
 * 5. Subtle Animation - Natural, inevitable, imperceptible (200ms)
 *
 * Reference: Apple.com, iPhone product pages, AirPods Pro
 */

// ==========================================
// 1. COLORS - Grayscale + Single Accent
// ==========================================

export const iveColors = {
  // Grayscale Foundation (ONLY these for 99% of UI)
  primary: '#FFFFFF',        // Pure white backgrounds
  secondary: '#F9FAFB',      // Subtle gray for cards (gray-50)
  text: {
    primary: '#111827',      // Near-black (gray-900)
    secondary: '#6B7280',    // Medium gray (gray-500)
    tertiary: '#9CA3AF',     // Light gray (gray-400)
  },

  // Single Accent Color (Use SPARINGLY - primary CTA ONLY)
  accent: '#2563EB',         // Blue-600 - THE ONLY color in entire UI

  // Borders & Dividers
  border: '#E5E7EB',         // Gray-200
  divider: '#D1D5DB',        // Gray-300 for h-px delicate lines

  // States (Grayscale variations, NO color)
  hover: '#F3F4F6',          // Gray-100
  active: '#E5E7EB',         // Gray-200
  disabled: '#F9FAFB',       // Gray-50

  // Semantic (Grayscale-first, minimal color)
  success: '#10B981',        // Green-500 (use ONLY for critical success states)
  warning: '#F59E0B',        // Amber-500 (use ONLY for critical warnings)
  error: '#EF4444',          // Red-500 (use ONLY for critical errors)
} as const

// ==========================================
// 2. TYPOGRAPHY - Massive Ultra-Light Titles
// ==========================================

export const iveTypography = {
  // Hero (Landing page main title)
  hero: {
    className: 'text-[120px] font-extralight tracking-tighter leading-none',
    fontSize: '120px',
    fontWeight: 200,  // Ultra-light
    lineHeight: 1,
    letterSpacing: '-0.05em',
  },

  // H1 (Page titles)
  h1: {
    className: 'text-7xl md:text-8xl font-extralight tracking-tight leading-none',
    fontSize: { base: '72px', md: '96px' },
    fontWeight: 200,
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },

  // H2 (Section titles)
  h2: {
    className: 'text-5xl font-light tracking-tight leading-tight',
    fontSize: '48px',
    fontWeight: 300,  // Light
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },

  // H3 (Subsection titles)
  h3: {
    className: 'text-3xl font-normal tracking-tight',
    fontSize: '30px',
    fontWeight: 400,  // Normal
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },

  // Body (Regular text)
  body: {
    className: 'text-xl font-light text-gray-600',
    fontSize: '20px',
    fontWeight: 300,
    lineHeight: 1.6,
  },

  // Caption (Small text)
  caption: {
    className: 'text-sm font-light text-gray-500',
    fontSize: '14px',
    fontWeight: 300,
    lineHeight: 1.4,
  },

  // Micro (Tiny labels)
  micro: {
    className: 'text-xs font-normal text-gray-400 uppercase tracking-wide',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '0.05em',
  },
} as const

// ==========================================
// 3. SPACING - Generous Whitespace
// ==========================================

export const iveSpacing = {
  // Section Padding (Vertical spacing between major sections)
  section: {
    mobile: 'py-16',      // 64px
    desktop: 'py-24 md:py-48',  // 96px → 192px (Apple standard)
  },

  // Element Margin (Space between elements)
  element: {
    xs: 'mb-4',           // 16px
    sm: 'mb-8',           // 32px
    md: 'mb-12',          // 48px
    lg: 'mb-16',          // 64px
    xl: 'mb-24',          // 96px
  },

  // Grid Gap
  grid: {
    tight: 'gap-4',       // 16px
    normal: 'gap-8',      // 32px
    loose: 'gap-12 md:gap-16',  // 48px → 64px
  },

  // Card/Container Padding
  container: {
    sm: 'p-6',            // 24px
    md: 'p-8 md:p-12',    // 32px → 48px
    lg: 'p-12 md:p-16',   // 48px → 64px
  },

  // Divider Spacing (Space around 1px lines)
  divider: {
    vertical: 'my-16 md:my-24',   // 64px → 96px
    horizontal: 'mx-8',            // 32px
  },
} as const

// ==========================================
// 4. ANIMATION - Subtle & Imperceptible
// ==========================================

export const iveAnimation = {
  // Duration (ALWAYS 200ms, no exceptions)
  duration: '200ms',

  // Easing (Natural, inevitable movement)
  easing: 'ease-in-out',

  // Properties (GPU-accelerated ONLY)
  properties: ['opacity', 'transform'],

  // Tailwind Classes
  hover: 'transition-all duration-200 ease-in-out',
  fadeIn: 'transition-opacity duration-200 ease-in-out',
  slideIn: 'transition-transform duration-200 ease-in-out',

  // Framer Motion Variants
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeInOut' }
      },
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2, ease: 'easeInOut' }
      },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2, ease: 'easeInOut' }
      },
    },
  },

  // FORBIDDEN (Never use these)
  forbidden: [
    'bounce',
    'pulse',
    'ping',
    'shake',
    'wiggle',
    'spin',
    'animate-pulse',
    'animate-bounce',
  ],
} as const

// ==========================================
// 5. COMPONENTS - Ive-Approved Patterns
// ==========================================

export const iveComponents = {
  // Delicate 1px Divider (Ive's signature)
  divider: {
    horizontal: 'h-px bg-gray-200',
    vertical: 'w-px bg-gray-200',
    accent: 'h-px w-24 bg-gray-300',  // Short decorative line
  },

  // Card (No shadow, use border instead)
  card: {
    base: 'bg-white border border-gray-100',
    hover: 'hover:border-gray-200 transition-colors duration-200',
  },

  // Button
  button: {
    // Primary (THE ONLY blue element in entire UI)
    primary: 'bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200',

    // Secondary (Grayscale)
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors duration-200',

    // Ghost (Minimal)
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200',
  },

  // Input
  input: {
    base: 'border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200',
  },
} as const

// ==========================================
// 6. LAYOUT - Grid & Containers
// ==========================================

export const iveLayout = {
  // Container Max Width
  container: {
    sm: 'max-w-3xl',      // 768px
    md: 'max-w-5xl',      // 1024px
    lg: 'max-w-7xl',      // 1280px
  },

  // Grid Columns
  grid: {
    twoColumn: 'grid grid-cols-1 lg:grid-cols-2',
    threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    fourColumn: 'grid grid-cols-2 lg:grid-cols-4',
  },
} as const

// ==========================================
// 7. PRINCIPLES - Quick Reference
// ==========================================

export const ivePrinciples = [
  '1. Extreme Minimalism - Remove all decoration, keep only essence',
  '2. Generous Whitespace - py-48 (192px) for sections',
  '3. Refined Colors - Grayscale + blue-600 for primary CTA ONLY',
  '4. Typography-Focused - text-[120px] font-extralight for heroes',
  '5. Subtle Animation - 200ms ease-in-out, opacity/transform only',
] as const

// ==========================================
// 8. DO vs DON'T Examples
// ==========================================

export const iveExamples = {
  DO: {
    hero: 'text-[120px] font-extralight tracking-tighter leading-none text-gray-900',
    section: 'py-48 px-5',
    divider: 'h-px w-24 bg-gray-300 mx-auto my-20',
    button: 'bg-blue-600 text-white px-8 py-3 transition-colors duration-200',
  },

  DONT: {
    hero: 'text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text',
    section: 'py-2 px-3 bg-gradient-to-br from-blue-900 to-purple-900',
    divider: 'border-4 border-dashed border-rainbow animate-pulse',
    button: 'bg-gradient-to-r from-green-400 to-blue-500 shadow-2xl animate-bounce',
  },
} as const

// ==========================================
// Export All
// ==========================================

export const miyabiIveDesignSystem = {
  colors: iveColors,
  typography: iveTypography,
  spacing: iveSpacing,
  animation: iveAnimation,
  components: iveComponents,
  layout: iveLayout,
  principles: ivePrinciples,
  examples: iveExamples,
} as const

export default miyabiIveDesignSystem
