#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { z } from 'zod';
// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
}
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});
// Zod schemas for input validation
const CodeInputSchema = z.object({
    code: z.string(),
    language: z.string().optional(),
    context: z.string().optional(),
});
const PromptInputSchema = z.object({
    prompt: z.string(),
    language: z.string().optional(),
    context: z.string().optional(),
});
const ReviewInputSchema = z.object({
    code: z.string(),
    language: z.string().optional(),
    focus: z.string().optional(), // performance, security, readability, etc.
});
const FixInputSchema = z.object({
    code: z.string(),
    error: z.string(),
    language: z.string().optional(),
});
const CompleteInputSchema = z.object({
    code: z.string(),
    cursor_position: z.number().optional(),
    language: z.string().optional(),
});
/**
 * Call OpenAI API with system and user messages
 */
async function callOpenAI(systemPrompt, userPrompt) {
    try {
        const response = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 4000,
        });
        return response.choices[0]?.message?.content || 'No response generated';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`OpenAI API error: ${errorMessage}`);
    }
}
/**
 * Tool 1: Generate code from prompt
 */
async function generateCode(prompt, language, context) {
    const systemPrompt = `You are an expert programmer. Generate clean, efficient, and well-documented code based on the user's requirements.
${language ? `Target language: ${language}` : ''}
${context ? `Context: ${context}` : ''}
Provide only the code with minimal explanation.`;
    const userPrompt = prompt;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 2: Explain code
 */
async function explainCode(code, language, context) {
    const systemPrompt = `You are an expert code reviewer and teacher. Explain the provided code in clear, concise language.
${language ? `Language: ${language}` : ''}
${context ? `Context: ${context}` : ''}
Include:
1. Overall purpose
2. Key components and their roles
3. Important algorithms or patterns used
4. Potential improvements or concerns`;
    const userPrompt = `Explain this code:\n\n\`\`\`\n${code}\n\`\`\``;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 3: Review code
 */
async function reviewCode(code, language, focus) {
    const systemPrompt = `You are an expert code reviewer. Perform a thorough code review.
${language ? `Language: ${language}` : ''}
${focus ? `Focus on: ${focus}` : 'Focus on: code quality, performance, security, and best practices'}

Provide:
1. Overall assessment
2. Specific issues (if any)
3. Suggestions for improvement
4. Security concerns (if any)
5. Performance considerations`;
    const userPrompt = `Review this code:\n\n\`\`\`\n${code}\n\`\`\``;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 4: Suggest refactoring
 */
async function refactorCode(code, language, context) {
    const systemPrompt = `You are an expert in code refactoring. Suggest improvements to make the code more maintainable, readable, and efficient.
${language ? `Language: ${language}` : ''}
${context ? `Context: ${context}` : ''}

Provide:
1. Refactored code
2. Explanation of changes
3. Benefits of the refactoring`;
    const userPrompt = `Refactor this code:\n\n\`\`\`\n${code}\n\`\`\``;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 5: Fix bugs
 */
async function fixCode(code, error, language) {
    const systemPrompt = `You are an expert debugger. Analyze the code and error message, then provide a fix.
${language ? `Language: ${language}` : ''}

Provide:
1. Root cause analysis
2. Fixed code
3. Explanation of the fix
4. Prevention tips`;
    const userPrompt = `Fix this code:\n\n\`\`\`\n${code}\n\`\`\`\n\nError:\n${error}`;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 6: Generate tests
 */
async function generateTests(code, language, context) {
    const systemPrompt = `You are an expert in test-driven development. Generate comprehensive unit tests for the provided code.
${language ? `Language: ${language}` : ''}
${context ? `Context: ${context}` : ''}

Provide:
1. Unit tests covering main functionality
2. Edge case tests
3. Test setup and teardown (if needed)
4. Explanation of test coverage`;
    const userPrompt = `Generate tests for this code:\n\n\`\`\`\n${code}\n\`\`\``;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 7: Generate documentation
 */
async function generateDocumentation(code, language, context) {
    const systemPrompt = `You are an expert technical writer. Generate comprehensive documentation for the provided code.
${language ? `Language: ${language}` : ''}
${context ? `Context: ${context}` : ''}

Provide:
1. Function/class documentation
2. Parameter descriptions
3. Return value descriptions
4. Usage examples
5. Notes on edge cases or limitations`;
    const userPrompt = `Generate documentation for this code:\n\n\`\`\`\n${code}\n\`\`\``;
    return await callOpenAI(systemPrompt, userPrompt);
}
/**
 * Tool 8: Complete code
 */
async function completeCode(code, cursorPosition, language) {
    const systemPrompt = `You are an expert code completion assistant. Complete the code intelligently based on context.
${language ? `Language: ${language}` : ''}

Provide only the completion, not the entire code.`;
    const position = cursorPosition !== undefined ? `\nCursor at position: ${cursorPosition}` : '';
    const userPrompt = `Complete this code:${position}\n\n\`\`\`\n${code}\n\`\`\``;
    return await callOpenAI(systemPrompt, userPrompt);
}
// Create MCP Server
const server = new Server({
    name: 'miyabi-codex',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'codex_generate',
            description: 'Generate code from a natural language prompt',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'Description of what code to generate',
                    },
                    language: {
                        type: 'string',
                        description: 'Target programming language (optional)',
                    },
                    context: {
                        type: 'string',
                        description: 'Additional context or requirements (optional)',
                    },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'codex_explain',
            description: 'Explain what a piece of code does',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to explain',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                    context: {
                        type: 'string',
                        description: 'Additional context (optional)',
                    },
                },
                required: ['code'],
            },
        },
        {
            name: 'codex_review',
            description: 'Perform a code review and provide feedback',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to review',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                    focus: {
                        type: 'string',
                        description: 'Review focus: performance, security, readability, etc. (optional)',
                    },
                },
                required: ['code'],
            },
        },
        {
            name: 'codex_refactor',
            description: 'Suggest refactoring improvements for code',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to refactor',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                    context: {
                        type: 'string',
                        description: 'Additional context (optional)',
                    },
                },
                required: ['code'],
            },
        },
        {
            name: 'codex_fix',
            description: 'Fix bugs and errors in code',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code with bugs',
                    },
                    error: {
                        type: 'string',
                        description: 'Error message or description',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                },
                required: ['code', 'error'],
            },
        },
        {
            name: 'codex_test',
            description: 'Generate unit tests for code',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to test',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                    context: {
                        type: 'string',
                        description: 'Testing framework or requirements (optional)',
                    },
                },
                required: ['code'],
            },
        },
        {
            name: 'codex_document',
            description: 'Generate documentation for code',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to document',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                    context: {
                        type: 'string',
                        description: 'Documentation style or requirements (optional)',
                    },
                },
                required: ['code'],
            },
        },
        {
            name: 'codex_complete',
            description: 'Complete partially written code',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Partial code to complete',
                    },
                    cursor_position: {
                        type: 'number',
                        description: 'Cursor position in the code (optional)',
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language (optional)',
                    },
                },
                required: ['code'],
            },
        },
    ],
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        let result;
        switch (name) {
            case 'codex_generate': {
                const validated = PromptInputSchema.parse(args || {});
                result = await generateCode(validated.prompt, validated.language, validated.context);
                break;
            }
            case 'codex_explain': {
                const validated = CodeInputSchema.parse(args || {});
                result = await explainCode(validated.code, validated.language, validated.context);
                break;
            }
            case 'codex_review': {
                const validated = ReviewInputSchema.parse(args || {});
                result = await reviewCode(validated.code, validated.language, validated.focus);
                break;
            }
            case 'codex_refactor': {
                const validated = CodeInputSchema.parse(args || {});
                result = await refactorCode(validated.code, validated.language, validated.context);
                break;
            }
            case 'codex_fix': {
                const validated = FixInputSchema.parse(args || {});
                result = await fixCode(validated.code, validated.error, validated.language);
                break;
            }
            case 'codex_test': {
                const validated = CodeInputSchema.parse(args || {});
                result = await generateTests(validated.code, validated.language, validated.context);
                break;
            }
            case 'codex_document': {
                const validated = CodeInputSchema.parse(args || {});
                result = await generateDocumentation(validated.code, validated.language, validated.context);
                break;
            }
            case 'codex_complete': {
                const validated = CompleteInputSchema.parse(args || {});
                result = await completeCode(validated.code, validated.cursor_position, validated.language);
                break;
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Miyabi Codex MCP Server running on stdio');
    console.error(`Using OpenAI model: ${OPENAI_MODEL}`);
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map