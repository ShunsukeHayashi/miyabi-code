/**
 * TCG Gallery Page - Trading Card Game Collection View
 *
 * This page is a placeholder for the TCG-style agent gallery.
 * It will display agents as collectible trading cards.
 */

import { useTheme } from '@/contexts/ThemeContext';

export default function TCGGalleryPage() {
  const { tokens, isDark } = useTheme();

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-200"
      style={{
        background: isDark
          ? tokens.colors.background.gradient
          : tokens.colors.background.primary
      }}
    >
      <div className="max-w-7xl mx-auto">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: tokens.colors.text.primary }}
        >
          TCG Gallery
        </h1>
        <p className="text-lg mb-8" style={{ color: tokens.colors.text.secondary }}>
          Trading Card Game style agent collection - Coming soon
        </p>

        <div
          className="rounded-2xl p-12 border text-center"
          style={{
            backgroundColor: tokens.colors.surface.glass,
            borderColor: tokens.colors.surface.cardBorder
          }}
        >
          <p className="text-2xl mb-4" style={{ color: tokens.colors.text.tertiary }}>
            Under Construction
          </p>
          <p style={{ color: tokens.colors.text.secondary }}>
            Visit the Agent Gallery for the current card view experience
          </p>
        </div>
      </div>
    </div>
  );
}
