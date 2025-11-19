import { z } from 'zod';

/**
 * Thinking levels for Gemini 3 API
 */
export type ThinkingLevel = 'low' | 'high' | 'medium';

/**
 * Response schema for Dynamic UI generation
 */
export const DynamicUIResponseSchema = z.object({
  ui_strategy: z.string().describe('Why this UI layout was chosen (Reasoning log)'),
  title: z.string().describe('Title of the generated UI'),
  react_code: z.string().describe('The full React component string'),
  suggested_next_prompts: z.array(z.string()).optional().describe('Suggested follow-up prompts'),
});

export type DynamicUIResponse = z.infer<typeof DynamicUIResponseSchema>;

/**
 * Response schema for Reasoning tasks
 */
export const ReasoningResponseSchema = z.object({
  reasoning_process: z.string().describe('Step-by-step reasoning process'),
  conclusion: z.string().describe('Final conclusion or answer'),
  confidence_level: z.enum(['low', 'medium', 'high']).describe('Confidence in the conclusion'),
  alternative_perspectives: z.array(z.string()).optional().describe('Alternative viewpoints considered'),
});

export type ReasoningResponse = z.infer<typeof ReasoningResponseSchema>;

/**
 * Response schema for Code Execution
 */
export const CodeExecutionResponseSchema = z.object({
  code: z.string().describe('The code to execute'),
  language: z.string().describe('Programming language'),
  execution_result: z.string().optional().describe('Result of code execution'),
  explanation: z.string().describe('Explanation of what the code does'),
});

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
