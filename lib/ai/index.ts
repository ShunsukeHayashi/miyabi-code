/**
 * AI Library Main Exports
 * Phase 2.1 AI Generative Content Engine
 */

export * from './gemini/client';

// Version and module info
export const AI_LIBRARY_VERSION = '2.1.0';
export const SUPPORTED_MODELS = ['gemini-2.0-flash-exp', 'gemini-1.5-pro'] as const;
export const SUPPORTED_LANGUAGES = ['ja', 'en', 'zh', 'ko', 'es'] as const;
