#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { simpleGit } from 'simple-git';
import { z } from 'zod';
// Repository path - default to miyabi-private root
const REPO_PATH = process.env.MIYABI_REPO_PATH || '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private';
const git = simpleGit(REPO_PATH);
// Zod schemas for input validation
const EmptySchema = z.object({});
const LimitSchema = z.object({ limit: z.number().optional() });
const FileSchema = z.object({ file: z.string() });
const BranchCompareSchema = z.object({ branch1: z.string(), branch2: z.string() });
const BranchSchema = z.object({ branch: z.string() });
// Create MCP Server
const server = new Server({
    name: 'miyabi-git-inspector',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'git_status',
            description: 'Get current git status (modified, staged, untracked files)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'git_branch_list',
            description: 'List all branches with remote tracking info',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'git_current_branch',
            description: 'Get current branch name',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'git_log',
            description: 'Get commit history',
            inputSchema: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Number of commits to retrieve (default: 20)',
                    },
                },
            },
        },
        {
            name: 'git_worktree_list',
            description: 'List all git worktrees',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'git_diff',
            description: 'Get diff of unstaged changes',
            inputSchema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        description: 'Specific file to diff (optional)',
                    },
                },
            },
        },
        {
            name: 'git_staged_diff',
            description: 'Get diff of staged changes',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'git_remote_list',
            description: 'List all remotes',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'git_branch_ahead_behind',
            description: 'Check how many commits ahead/behind a branch is from origin',
            inputSchema: {
                type: 'object',
                properties: {
                    branch: {
                        type: 'string',
                        description: 'Branch name (default: current branch)',
                    },
                },
            },
        },
        {
            name: 'git_file_history',
            description: 'Get commit history for a specific file',
            inputSchema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        description: 'File path',
                    },
                    limit: {
                        type: 'number',
                        description: 'Number of commits (default: 10)',
                    },
                },
            },
        },
    ],
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case 'git_status': {
                const status = await git.status();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                current_branch: status.current,
                                ahead: status.ahead,
                                behind: status.behind,
                                staged: status.staged,
                                modified: status.modified,
                                not_added: status.not_added,
                                deleted: status.deleted,
                                renamed: status.renamed,
                                conflicted: status.conflicted,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'git_branch_list': {
                const branches = await git.branch(['-vv']);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                current: branches.current,
                                all: branches.all,
                                branches: branches.branches,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'git_current_branch': {
                const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
                return {
                    content: [
                        {
                            type: 'text',
                            text: branch.trim(),
                        },
                    ],
                };
            }
            case 'git_log': {
                const validated = LimitSchema.parse(args);
                const limit = validated.limit || 20;
                const log = await git.log({ maxCount: limit });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(log.all, null, 2),
                        },
                    ],
                };
            }
            case 'git_worktree_list': {
                const worktrees = await git.raw(['worktree', 'list', '--porcelain']);
                return {
                    content: [
                        {
                            type: 'text',
                            text: worktrees,
                        },
                    ],
                };
            }
            case 'git_diff': {
                const validated = args ? FileSchema.partial().parse(args) : {};
                const diff = validated.file
                    ? await git.diff([validated.file])
                    : await git.diff();
                return {
                    content: [
                        {
                            type: 'text',
                            text: diff || 'No unstaged changes',
                        },
                    ],
                };
            }
            case 'git_staged_diff': {
                const diff = await git.diff(['--staged']);
                return {
                    content: [
                        {
                            type: 'text',
                            text: diff || 'No staged changes',
                        },
                    ],
                };
            }
            case 'git_remote_list': {
                const remotes = await git.getRemotes(true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(remotes, null, 2),
                        },
                    ],
                };
            }
            case 'git_branch_ahead_behind': {
                const validated = BranchSchema.partial().parse(args);
                const branch = validated.branch || (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
                const result = await git.raw(['rev-list', '--left-right', '--count', `origin/${branch}...${branch}`]);
                const [behind, ahead] = result.trim().split('\t').map(Number);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ branch, ahead, behind }, null, 2),
                        },
                    ],
                };
            }
            case 'git_file_history': {
                const validated = z
                    .object({
                    file: z.string(),
                    limit: z.number().optional(),
                })
                    .parse(args);
                const limit = validated.limit || 10;
                const log = await git.log({ maxCount: limit, file: validated.file });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(log.all, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
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
    console.error('Miyabi Git Inspector MCP Server running on stdio');
    console.error(`Repository: ${REPO_PATH}`);
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map