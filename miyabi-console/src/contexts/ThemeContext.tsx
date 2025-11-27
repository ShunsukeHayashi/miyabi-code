/**
 * Theme Context - Global Theme Management
 *
 * Provides:
 * - Theme state (light/dark)
 * - Theme toggle function
 * - Design tokens based on current theme
 * - Local storage persistence
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTokens, type Theme, type DesignTokens } from '../styles/design-tokens'

interface ThemeContextType {
  theme: Theme
  tokens: DesignTokens
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'miyabi-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or default to 'dark' (TCG focus)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'

    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }

    // Default to dark mode (TCG gaming aesthetic)
    return 'dark'
  })

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    // Update document root class for global styles
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const tokens = getTokens(theme)
      metaThemeColor.setAttribute('content', tokens.colors.background.primary)
    }
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const tokens = getTokens(theme)
  const isDark = theme === 'dark'

  return (
    <ThemeContext.Provider
      value={{
        theme,
        tokens,
        toggleTheme,
        setTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility hook for accessing tokens directly
export function useTokens() {
  const { tokens } = useTheme()
  return tokens
}

// Utility hook for checking dark mode
export function useDarkMode() {
  const { isDark } = useTheme()
  return isDark
}
