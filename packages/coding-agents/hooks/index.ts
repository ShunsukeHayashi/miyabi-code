/**
 * Hook System
 *
 * Exports all hook-related functionality
 */

export { HookManager } from './hook-manager';
export * from './built-in/index';
export * from '../types/hooks';
export { setupDiscordNotifications, createHookManagerWithDiscordNotifications } from './setup-discord-notifications';
