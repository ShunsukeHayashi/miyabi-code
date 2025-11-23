import { Part } from '@google/generative-ai';
import { Gemini3Config, ThinkingLevel, ToolConfig } from './types.js';
/**
 * Gemini 3 API Client for UI/UX Design
 * Specialized for design reviews, prototyping, and usability analysis
 */
export declare class Gemini3UXClient {
    private genAI;
    private config;
    private model;
    constructor(config: Gemini3Config);
    /**
     * Generate content with structured output
     */
    generateStructuredContent<T>(prompt: string, responseSchema: Record<string, unknown>, options?: {
        thinkingLevel?: ThinkingLevel;
        tools?: ToolConfig;
        contextParts?: Part[];
    }): Promise<T>;
    /**
     * Generate content with text output
     */
    generateContent(prompt: string, options?: {
        thinkingLevel?: ThinkingLevel;
        tools?: ToolConfig;
        contextParts?: Part[];
    }): Promise<string>;
    /**
     * Get model information
     */
    getModelInfo(): string;
}
//# sourceMappingURL=gemini-client.d.ts.map