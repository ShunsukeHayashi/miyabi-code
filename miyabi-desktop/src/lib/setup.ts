/**
 * Setup state management utilities
 * Manages first-time setup completion status using localStorage
 */

const SETUP_COMPLETE_KEY = "miyabi_setup_complete";

/**
 * Check if initial setup has been completed
 */
export const isSetupComplete = (): boolean => {
  if (typeof window === "undefined") return true; // SSR safety
  return localStorage.getItem(SETUP_COMPLETE_KEY) === "true";
};

/**
 * Mark initial setup as complete
 */
export const markSetupComplete = (): void => {
  if (typeof window === "undefined") return; // SSR safety
  localStorage.setItem(SETUP_COMPLETE_KEY, "true");
};

/**
 * Reset setup status (for testing/debugging)
 */
export const resetSetup = (): void => {
  if (typeof window === "undefined") return; // SSR safety
  localStorage.removeItem(SETUP_COMPLETE_KEY);
};
