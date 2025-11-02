/**
 * Tauri runtime detection and safe API wrapper
 * Prevents errors when running in browser mode (vite dev) vs Tauri mode (tauri dev)
 */

/**
 * Check if Tauri runtime is available
 * In Tauri v2, we check for __TAURI_INTERNALS__ instead of __TAURI__
 */
export function isTauriAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Tauri v2 uses __TAURI_INTERNALS__
  // Also check for __TAURI__ for backwards compatibility
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

/**
 * Safe wrapper for Tauri invoke
 * Returns null and logs warning if Tauri is not available
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  if (!isTauriAvailable()) {
    console.warn(
      `[Tauri] Cannot invoke "${command}" - Tauri runtime not available. ` +
      `Are you running in browser mode? Use 'npm run tauri dev' instead of 'npm run dev'.`
    );
    return null;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`[Tauri] Failed to invoke "${command}":`, error);
    throw error;
  }
}

/**
 * Safe wrapper for Tauri event listener
 * Returns a no-op unsubscribe function if Tauri is not available
 */
export async function safeListen<T>(
  event: string,
  callback: (payload: T) => void
): Promise<() => void> {
  if (!isTauriAvailable()) {
    console.warn(
      `[Tauri] Cannot listen to "${event}" - Tauri runtime not available. ` +
      `Are you running in browser mode? Use 'npm run tauri dev' instead of 'npm run dev'.`
    );
    return () => {}; // Return no-op unsubscribe function
  }

  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen<T>(event, (evt) => {
      callback(evt.payload);
    });
    return unlisten;
  } catch (error) {
    console.error(`[Tauri] Failed to listen to "${event}":`, error);
    throw error;
  }
}

/**
 * Get Tauri runtime status message for UI
 */
export function getTauriStatusMessage(): string {
  if (isTauriAvailable()) {
    return 'Tauri runtime detected - Full functionality available';
  }
  return 'Tauri runtime not detected - Running in browser mode. Use "npm run tauri dev" for full functionality.';
}
