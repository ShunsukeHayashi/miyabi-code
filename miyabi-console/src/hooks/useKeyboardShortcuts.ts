/**
 * Keyboard Shortcuts Hook - Power user features
 *
 * Keyboard shortcuts:
 * - / : Focus input (quick search/command)
 * - Cmd/Ctrl + L : Clear chat history
 * - Esc : Stop generation / clear focus
 */

import { useEffect } from 'react';

interface ShortcutConfig {
  focusInput: () => void;
  clearChat: () => void;
  stopGeneration: () => void;
}

export const useKeyboardShortcuts = ({ focusInput, clearChat, stopGeneration }: ShortcutConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" - Focus input (like Slack, Discord)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        focusInput();
      }

      // Cmd/Ctrl + L - Clear chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        clearChat();
      }

      // Esc - Stop generation
      if (e.key === 'Escape') {
        stopGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusInput, clearChat, stopGeneration]);
};
