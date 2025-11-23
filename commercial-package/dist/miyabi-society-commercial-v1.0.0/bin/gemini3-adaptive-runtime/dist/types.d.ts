import { z } from 'zod';
/**
 * Thinking levels for Gemini 3 API
 */
export type ThinkingLevel = 'low' | 'high' | 'medium';
/**
 * Response schema for Dynamic UI generation
 */
export declare const DynamicUIResponseSchema: z.ZodObject<{
    ui_strategy: z.ZodString;
    title: z.ZodString;
    react_code: z.ZodString;
    suggested_next_prompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    ui_strategy: string;
    title: string;
    react_code: string;
    suggested_next_prompts?: string[] | undefined;
}, {
    ui_strategy: string;
    title: string;
    react_code: string;
    suggested_next_prompts?: string[] | undefined;
}>;
export type DynamicUIResponse = z.infer<typeof DynamicUIResponseSchema>;
/**
 * Response schema for Reasoning tasks
 */
export declare const ReasoningResponseSchema: z.ZodObject<{
    reasoning_process: z.ZodString;
    conclusion: z.ZodString;
    confidence_level: z.ZodEnum<["low", "medium", "high"]>;
    alternative_perspectives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    reasoning_process: string;
    conclusion: string;
    confidence_level: "low" | "high" | "medium";
    alternative_perspectives?: string[] | undefined;
}, {
    reasoning_process: string;
    conclusion: string;
    confidence_level: "low" | "high" | "medium";
    alternative_perspectives?: string[] | undefined;
}>;
export type ReasoningResponse = z.infer<typeof ReasoningResponseSchema>;
/**
 * Response schema for Code Execution
 */
export declare const CodeExecutionResponseSchema: z.ZodObject<{
    code: z.ZodString;
    language: z.ZodString;
    execution_result: z.ZodOptional<z.ZodString>;
    explanation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    language: string;
    explanation: string;
    execution_result?: string | undefined;
}, {
    code: string;
    language: string;
    explanation: string;
    execution_result?: string | undefined;
}>;
export type CodeExecutionResponse = z.infer<typeof CodeExecutionResponseSchema>;
/**
 * Tool configuration
 */
export interface ToolConfig {
    codeExecution?: boolean;
    googleSearch?: boolean;
    fileSearch?: boolean;
    urlContext?: boolean;
}
/**
 * Gemini 3 API request configuration
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
 * Dynamic UI generation request
 */
export interface DynamicUIRequest {
    prompt: string;
    contextUrls?: string[];
    contextFiles?: Array<{
        mimeType: string;
        fileUri: string;
    }>;
    currentScreenState?: Record<string, unknown>;
    thinkingLevel?: ThinkingLevel;
}
/**
 * Reasoning request
 */
export interface ReasoningRequest {
    question: string;
    context?: string;
    thinkingLevel?: ThinkingLevel;
    includeAlternatives?: boolean;
}
/**
 * Code execution request
 */
export interface CodeExecutionRequest {
    task: string;
    language?: string;
    context?: string;
    thinkingLevel?: ThinkingLevel;
}
//# sourceMappingURL=types.d.ts.map