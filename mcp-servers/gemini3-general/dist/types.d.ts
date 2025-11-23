/**
 * Configuration for Gemini 3 client
 */
export interface Gemini3Config {
    apiKey: string;
    model?: string;
    thinkingLevel?: ThinkingLevel;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
}
/**
 * Thinking level for Gemini 3 model
 */
export type ThinkingLevel = 'low' | 'medium' | 'high';
/**
 * Tool configuration
 */
export interface ToolConfig {
    codeExecution?: boolean;
    googleSearch?: boolean;
}
//# sourceMappingURL=types.d.ts.map