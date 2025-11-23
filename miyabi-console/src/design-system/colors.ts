/**
 * Miyabi Console - Design System Colors
 * Based on DESIGN_DEFINITION.md & Jonathan Ive Design Principles
 * Version: 2.0.0
 * Last Updated: 2025-11-19
 *
 * Design Philosophy:
 * - Jony Ive Style: Minimalist grayscale palette
 * - Single accent color (blue-600)
 * - No multi-color gradients
 * - Clean, professional, timeless
 */

export const colors = {
  // Jony Ive Grayscale Palette (PRIMARY COLORS)
  ive: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
    // Single Accent Color
    accent: '#2563EB', // blue-600
  },

  // Brand Colors (DEPRECATED - Use ive.accent instead)
  brand: {
    purple: '#764ba2',
    blue: '#667eea',
    pink: '#f093fb',
    cyan: '#4facfe',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Status Colors (Agent/Task Status)
  status: {
    pending: '#9CA3AF',
    running: '#8B5CF6',
    analyzing: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    paused: '#D4C5F9',
  },

  // Activity Type Colors
  activity: {
    agent: '#8B5CF6',
    deployment: '#EF4444',
    system: '#3B82F6',
    user: '#06B6D4',
  },
} as const;

export const gradients = {
  // Jony Ive Style Gradients (MINIMALIST - 2 colors max, subtle)
  ive: {
    // Subtle grayscale gradients for backgrounds
    white: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
    gray: 'linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%)',
    // Single accent gradient
    accent: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  },

  // Legacy Gradients (DEPRECATED - Avoid using these)
  // Primary Gradient (2-color)
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

  // Hero Gradient (3-color for login screens)
  hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',

  // Background Gradient (4-color)
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 100%)',

  // Status Gradients (MINIMALIST - Use solid colors instead when possible)
  pending: 'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%)',
  running: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  analyzing: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  completed: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  failed: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
  paused: 'linear-gradient(135deg, #D1D5DB 0%, #E5E7EB 100%)',

  // Card Gradients (for stat cards)
  blue: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  green: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  purple: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
  orange: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
} as const;

export const statusColors = {
  pending: {
    color: colors.status.pending,
    gradient: gradients.pending,
    icon: '⏸',
  },
  running: {
    color: colors.status.running,
    gradient: gradients.running,
    icon: '▶️',
  },
  analyzing: {
    color: colors.status.analyzing,
    gradient: gradients.analyzing,
    icon: '🔍',
  },
  completed: {
    color: colors.status.completed,
    gradient: gradients.completed,
    icon: '✅',
  },
  failed: {
    color: colors.status.failed,
    gradient: gradients.failed,
    icon: '❌',
  },
  paused: {
    color: colors.status.paused,
    gradient: gradients.paused,
    icon: '⏸',
  },
} as const;

export const activityTypeIcons = {
  agent: '🤖',
  deployment: '🚀',
  system: '⚙️',
  user: '👤',
} as const;

export const heroUIColorMapping = {
  // Map our semantic colors to HeroUI color prop values
  success: 'success' as const,
  warning: 'warning' as const,
  error: 'danger' as const,
  info: 'primary' as const,

  // Status to HeroUI mapping
  pending: 'default' as const,
  running: 'secondary' as const,
  analyzing: 'primary' as const,
  completed: 'success' as const,
  failed: 'danger' as const,
  paused: 'default' as const,
};
