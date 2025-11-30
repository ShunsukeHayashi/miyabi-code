#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
const execAsync = promisify(exec);
// Zod schemas for input validation
const CodexExecSchema = z.object({
    prompt: z.string(),
    model: z.enum(['sonnet', 'opus', 'haiku']).optional(),
    cd: z.string().optional(),
    search: z.boolean().optional(),
    full_auto: z.boolean().optional(),
});
const CodexReplySchema = z.object({
    prompt: z.string(),
    model: z.enum(['sonnet', 'opus', 'haiku']).optional(),
    cd: z.string().optional(),
    search: z.boolean().optional(),
    full_auto: z.boolean().optional(),
});
const CodexExecYoloSchema = z.object({
    prompt: z.string(),
    model: z.enum(['sonnet', 'opus', 'haiku']).optional(),
    cd: z.string().optional(),
    confirm_danger: z.boolean().optional(),
});
const CodexResumeSchema = z.object({
    cd: z.string().optional(),
});
/**
 * Execute codex command with options
 */
async function execCodex(args) {
    try {
        const command = `codex ${args.join(' ')}`;
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 300000, // 5 minutes timeout
        });
        return stdout || stderr || 'Command completed successfully';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Codex CLI error: ${errorMessage}`);
    }
}
/**
 * Build codex command arguments
 */
function buildCodexArgs(subcommand, prompt, options) {
    const args = [subcommand];
    // Add model flag
    if (options.model) {
        args.push('--model', options.model);
    }
    // Add working directory flag
    if (options.cd) {
        args.push('--cd', options.cd);
    }
    // Add search flag
    if (options.search) {
        args.push('--search');
    }
    // Add full-auto flag
    if (options.fullAuto) {
        args.push('--full-auto');
    }
    // Add YOLO flag (DANGEROUS!)
    if (options.yolo) {
        args.push('--yolo');
    }
    // Add the prompt (quoted)
    args.push(`"${prompt.replace(/"/g, '\\"')}"`);
    return args;
}
/**
 * Tool 1: Execute codex with standard options
 */
async function codexExec(prompt, model, cd, search, fullAuto) {
    const args = buildCodexArgs('exec', prompt, {
        model,
        cd,
        search,
        fullAuto,
    });
    return await execCodex(args);
}
/**
 * Tool 2: Execute codex in YOLO mode (DANGEROUS!)
 */
async function codexExecYolo(prompt, model, cd, confirmDanger) {
    if (!confirmDanger) {
        throw new Error('⚠️ YOLO mode is EXTREMELY DANGEROUS! It runs all commands without approval or sandboxing. ' +
            'Set confirm_danger: true to proceed. ' +
            'Only use in externally hardened environments!');
    }
    const args = buildCodexArgs('exec', prompt, {
        model,
        cd,
        yolo: true,
    });
    const warning = '🚨 WARNING: Running codex in --yolo mode!\n' +
        'This will execute ALL commands without approval or sandboxing.\n' +
        'Make sure you are in a safe, isolated environment.\n\n';
    const result = await execCodex(args);
    return warning + result;
}
/**
 * Tool 3: Resume previous codex session
 */
async function codexResume(cd) {
    const args = ['resume'];
    if (cd) {
        args.push('--cd', cd);
    }
    return await execCodex(args);
}
/**
 * Tool 4: Get codex version
 */
async function codexVersion() {
    try {
        const { stdout } = await execAsync('codex --version');
        return stdout.trim();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get codex version: ${errorMessage}`);
    }
}
/**
 * Tool 5: Login to codex
 */
async function codexLogin() {
    try {
        const { stdout, stderr } = await execAsync('codex login');
        return stdout || stderr || 'Login initiated';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Login failed: ${errorMessage}`);
    }
}
/**
 * Tool 6: Reply to an existing codex session
 */
async function codexReply(prompt, model, cd, search, fullAuto) {
    const args = buildCodexArgs('reply', prompt, {
        model,
        cd,
        search,
        fullAuto,
    });
    return await execCodex(args);
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
            name: 'codex_exec',
            description: 'Execute a task using Claude Code CLI (codex exec)',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'Task description for codex to execute',
                    },
                    model: {
                        type: 'string',
                        enum: ['sonnet', 'opus', 'haiku'],
                        description: 'Claude model to use (default: sonnet)',
                    },
                    cd: {
                        type: 'string',
                        description: 'Working directory',
                    },
                    search: {
                        type: 'boolean',
                        description: 'Enable web search',
                    },
                    full_auto: {
                        type: 'boolean',
                        description: 'Run without approvals (limited sandboxing)',
                    },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'codex_reply',
            description: 'Reply to an existing Claude Code CLI session (codex reply)',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'Follow-up prompt for the active codex session',
                    },
                    model: {
                        type: 'string',
                        enum: ['sonnet', 'opus', 'haiku'],
                        description: 'Claude model to use (default: sonnet)',
                    },
                    cd: {
                        type: 'string',
                        description: 'Working directory',
                    },
                    search: {
                        type: 'boolean',
                        description: 'Enable web search',
                    },
                    full_auto: {
                        type: 'boolean',
                        description: 'Run without approvals (limited sandboxing)',
                    },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'codex_exec_yolo',
            description: '🚨 DANGEROUS: Execute codex in YOLO mode (NO approvals, NO sandboxing). Only use in isolated environments!',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'Task description',
                    },
                    model: {
                        type: 'string',
                        enum: ['sonnet', 'opus', 'haiku'],
                        description: 'Claude model to use',
                    },
                    cd: {
                        type: 'string',
                        description: 'Working directory',
                    },
                    confirm_danger: {
                        type: 'boolean',
                        description: 'MUST be true to confirm you understand the risks',
                    },
                },
                required: ['prompt', 'confirm_danger'],
            },
        },
        {
            name: 'codex_resume',
            description: 'Resume the previous codex session',
            inputSchema: {
                type: 'object',
                properties: {
                    cd: {
                        type: 'string',
                        description: 'Working directory',
                    },
                },
            },
        },
        {
            name: 'codex_version',
            description: 'Get codex CLI version',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'codex_login',
            description: 'Login to codex (ChatGPT OAuth or API key)',
            inputSchema: {
                type: 'object',
                properties: {},
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
            case 'codex_exec': {
                const validated = CodexExecSchema.parse(args || {});
                result = await codexExec(validated.prompt, validated.model, validated.cd, validated.search, validated.full_auto);
                break;
            }
            case 'codex_reply': {
                const validated = CodexReplySchema.parse(args || {});
                result = await codexReply(validated.prompt, validated.model, validated.cd, validated.search, validated.full_auto);
                break;
            }
            case 'codex_exec_yolo': {
                const validated = CodexExecYoloSchema.parse(args || {});
                result = await codexExecYolo(validated.prompt, validated.model, validated.cd, validated.confirm_danger);
                break;
            }
            case 'codex_resume': {
                const validated = CodexResumeSchema.parse(args || {});
                result = await codexResume(validated.cd);
                break;
            }
            case 'codex_version': {
                result = await codexVersion();
                break;
            }
            case 'codex_login': {
                result = await codexLogin();
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
    console.error('Wrapping Claude Code CLI (codex-cli)');
    // Check if codex CLI is available
    try {
        const version = await codexVersion();
        console.error(`Codex CLI version: ${version}`);
    }
    catch (error) {
        console.error('⚠️  WARNING: codex CLI not found or not accessible');
        console.error('   Please install: npm install -g codex-cli');
    }
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map