/**
 * Miyabi Design Tokens - Unified Design System
 *
 * Purpose: Establish consistent visual language across all pages
 * - Agent Gallery (TCG/Gaming aesthetic)
 * - Dashboard/Agents (Apple minimalist aesthetic)
 *
 * Theme Philosophy:
 * - Dark mode: TCG gaming focus with glass-morphism
 * - Light mode: Jonathan Ive minimalist aesthetic
 */

export type Theme = 'light' | 'dark'

export interface DesignTokens {
  colors: {
    background: {
      primary: string
      secondary: string
      tertiary: string
      gradient: string
    }
    text: {
      primary: string
      secondary: string
      tertiary: string
      inverse: string
    }
    accent: {
      primary: string
      primaryHover: string
      secondary: string
      success: string
      warning: string
      error: string
    }
    surface: {
      card: string
      cardHover: string
      cardBorder: string
      overlay: string
      glass: string
    }
  }
  typography: {
    hero: string
    title: string
    heading: string
    stat: string
    body: string
    caption: string
  }
  spacing: {
    sectionY: string
    sectionX: string
    cardGap: string
  }
  effects: {
    blur: string
    shadow: string
    transition: string
  }
}

// Light Theme (Jonathan Ive Minimalism)
export const lightTokens: DesignTokens = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F7',
      tertiary: '#FAFAFA',
      gradient: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)',
    },
    text: {
      primary: '#1D1D1F',
      secondary: '#86868B',
      tertiary: '#AEAEB2',
      inverse: '#FFFFFF',
    },
    accent: {
      primary: '#0066CC',
      primaryHover: '#0052A3',
      secondary: '#5E5CE6',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    },
    surface: {
      card: '#FFFFFF',
      cardHover: '#F5F5F7',
      cardBorder: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.05)',
      glass: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    hero: 'text-7xl md:text-8xl lg:text-[120px] font-light tracking-tighter leading-none',
    title: 'text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-none',
    heading: 'text-4xl md:text-5xl font-light tracking-tight',
    stat: 'text-5xl md:text-6xl font-normal leading-none',
    body: 'text-base font-normal',
    caption: 'text-xs font-medium uppercase tracking-wide',
  },
  spacing: {
    sectionY: 'py-24 md:py-32',
    sectionX: 'px-5',
    cardGap: 'gap-8 md:gap-12',
  },
  effects: {
    blur: 'backdrop-blur-[20px]',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'transition-all duration-200 ease-in-out',
  },
}

// Dark Theme (TCG Gaming Aesthetic)
export const darkTokens: DesignTokens = {
  colors: {
    background: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #581C87 50%, #0F172A 100%)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      inverse: '#1D1D1F',
    },
    accent: {
      primary: '#0EA5E9',
      primaryHover: '#0284C7',
      secondary: '#8B5CF6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    surface: {
      card: 'rgba(255, 255, 255, 0.05)',
      cardHover: 'rgba(255, 255, 255, 0.1)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.3)',
      glass: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    hero: 'text-7xl md:text-8xl lg:text-[120px] font-light tracking-tighter leading-none',
    title: 'text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-none',
    heading: 'text-4xl md:text-5xl font-light tracking-tight',
    stat: 'text-5xl md:text-6xl font-normal leading-none',
    body: 'text-base font-normal',
    caption: 'text-xs font-medium uppercase tracking-wide',
  },
  spacing: {
    sectionY: 'py-24 md:py-32',
    sectionX: 'px-5',
    cardGap: 'gap-8 md:gap-12',
  },
  effects: {
    blur: 'backdrop-blur-lg',
    shadow: '0 0 20px rgba(0, 0, 0, 0.5)',
    transition: 'transition-all duration-200 ease-in-out',
  },
}

// Theme getter function
export function getTokens(theme: Theme): DesignTokens {
  return theme === 'dark' ? darkTokens : lightTokens
}

// Rarity colors (for Agent Gallery TCG cards)
export const rarityColors = {
  UR: {
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
    border: '#FFD700',
    glow: '0 0 30px rgba(255, 215, 0, 0.8)',
  },
  SSR: {
    gradient: 'linear-gradient(135deg, #E0E0E0 0%, #C0C0C0 50%, #A8A8A8 100%)',
    border: '#E0E0E0',
    glow: '0 0 25px rgba(224, 224, 224, 0.7)',
  },
  SR: {
    gradient: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #03A9F4 100%)',
    border: '#4FC3F7',
    glow: '0 0 20px rgba(79, 195, 247, 0.6)',
  },
  R: {
    gradient: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)',
    border: '#42A5F5',
    glow: '0 0 15px rgba(66, 165, 245, 0.5)',
  },
  UC: {
    gradient: 'linear-gradient(135deg, #90CAF9 0%, #64B5F6 100%)',
    border: '#90CAF9',
    glow: '0 0 10px rgba(144, 202, 249, 0.3)',
  },
  C: {
    gradient: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
    border: '#BDBDBD',
    glow: 'none',
  },
}

// Attribute colors (for Agent Gallery)
export const attributeColors = {
  Light: { color: '#FFD700', emoji: '☀️' },
  Dark: { color: '#8B00FF', emoji: '🌙' },
  Fire: { color: '#FF4500', emoji: '🔥' },
  Water: { color: '#1E90FF', emoji: '💧' },
  Wind: { color: '#00CED1', emoji: '💨' },
  Earth: { color: '#8B4513', emoji: '🌍' },
  Thunder: { color: '#FFD700', emoji: '⚡' },
}
