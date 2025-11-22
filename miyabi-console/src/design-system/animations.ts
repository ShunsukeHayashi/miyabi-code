/**
 * Miyabi Console - Animation System
 * Based on DESIGN_SYSTEM.md v1.0
 * Jonathan Ive Principles: Subtle & Natural
 */

import type { Transition, Variants } from 'framer-motion';

// Transition Durations
export const duration = {
  fast: 0.1,      // 100ms - Hover effects
  normal: 0.2,    // 200ms - Standard transitions ✅ Default
  slow: 0.3,      // 300ms - Complex animations
} as const;

// Easing Functions
export const easing = {
  easeOut: [0, 0, 0.2, 1],          // ✅ Default - Natural deceleration
  easeIn: [0.4, 0, 1, 1],           // Acceleration
  easeInOut: [0.4, 0, 0.2, 1],      // Smooth both ends
} as const;

// Standard Transitions
export const transitions = {
  // Default Transition (200ms easeOut)
  default: {
    duration: duration.normal,
    ease: easing.easeOut,
  } as Transition,

  // Fast Transition (100ms)
  fast: {
    duration: duration.fast,
    ease: easing.easeOut,
  } as Transition,

  // Slow Transition (300ms)
  slow: {
    duration: duration.slow,
    ease: easing.easeOut,
  } as Transition,
} as const;

// Animation Variants
export const variants = {
  // Page Enter Animation
  pageEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: transitions.default,
  } as Variants,

  // Fade In
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.default,
  } as Variants,

  // Slide Up
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
    transition: transitions.default,
  } as Variants,

  // Scale
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: transitions.default,
  } as Variants,
} as const;

// Hover & Tap Animations
export const interactions = {
  // Button Hover (Subtle Scale)
  buttonHover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: duration.fast },
  },

  // Card Hover (Subtle Lift)
  cardHover: {
    whileHover: { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    transition: { duration: duration.normal },
  },

  // Icon Hover (Rotate)
  iconHover: {
    whileHover: { rotate: 5 },
    transition: { duration: duration.fast },
  },
} as const;

// CSS Transition Classes
export const cssTransitions = {
  // Default
  default: 'transition-all duration-200 ease-out',

  // Colors
  colors: 'transition-colors duration-200 ease-out',

  // Transform
  transform: 'transition-transform duration-200 ease-out',

  // Opacity
  opacity: 'transition-opacity duration-200 ease-out',

  // Fast
  fast: 'transition-all duration-100 ease-out',

  // Slow
  slow: 'transition-all duration-300 ease-out',
} as const;

// Animation Presets
export const animationPresets = {
  // Page Container
  pageContainer: {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: variants.pageEnter,
  },

  // Stagger Children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  // Stagger Item
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
} as const;

// Example Usage:
// <motion.div {...variants.pageEnter}>
// <motion.button {...interactions.buttonHover}>
// <div className={cssTransitions.default}>
