import { z } from 'zod';
/**
 * Response schema for Dynamic UI generation
 */
export const DynamicUIResponseSchema = z.object({
    ui_strategy: z.string().describe('Why this UI layout was chosen (Reasoning log)'),
    title: z.string().describe('Title of the generated UI'),
    react_code: z.string().describe('The full React component string'),
    suggested_next_prompts: z.array(z.string()).optional().describe('Suggested follow-up prompts'),
});
/**
 * Response schema for Reasoning tasks
 */
export const ReasoningResponseSchema = z.object({
    reasoning_process: z.string().describe('Step-by-step reasoning process'),
    conclusion: z.string().describe('Final conclusion or answer'),
    confidence_level: z.enum(['low', 'medium', 'high']).describe('Confidence in the conclusion'),
    alternative_perspectives: z.array(z.string()).optional().describe('Alternative viewpoints considered'),
});
/**
 * Response schema for Code Execution
 */
export const CodeExecutionResponseSchema = z.object({
    code: z.string().describe('The code to execute'),
    language: z.string().describe('Programming language'),
    execution_result: z.string().optional().describe('Result of code execution'),
    explanation: z.string().describe('Explanation of what the code does'),
});
//# sourceMappingURL=types.js.map