#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { glob } from 'glob';
import { stat, readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { z } from 'zod';
// Base directory for file operations
const BASE_DIR = process.env.MIYABI_WATCH_DIR || '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private';
// Zod schemas
const PathSchema = z.object({
    path: z.string(),
});
const RecentChangesSchema = z.object({
    directory: z.string().optional(),
    minutes: z.number().optional(),
    limit: z.number().optional(),
    pattern: z.string().optional(),
});
const FileSearchSchema = z.object({
    pattern: z.string(),
    directory: z.string().optional(),
});
const FileTreeSchema = z.object({
    directory: z.string().optional(),
    depth: z.number().optional(),
});
const FileCompareSchema = z.object({
    path1: z.string(),
    path2: z.string(),
});
const ChangesSinceSchema = z.object({
    directory: z.string().optional(),
    since: z.string(), // ISO timestamp
    pattern: z.string().optional(),
});
/**
 * Get detailed file/directory stats
 */
async function getFileStats(path) {
    const fullPath = path.startsWith('/') ? path : join(BASE_DIR, path);
    const stats = await stat(fullPath);
    return {
        path: relative(BASE_DIR, fullPath),
        full_path: fullPath,
        size_bytes: stats.size,
        size_mb: Math.round((stats.size / 1024 / 1024) * 100) / 100,
        is_file: stats.isFile(),
        is_directory: stats.isDirectory(),
        is_symlink: stats.isSymbolicLink(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
        permissions: stats.mode.toString(8),
    };
}
/**
 * Get recently changed files
 */
async function getRecentChanges(directory, minutes, limit, pattern) {
    const searchDir = directory ? join(BASE_DIR, directory) : BASE_DIR;
    const cutoffTime = minutes
        ? new Date(Date.now() - minutes * 60 * 1000)
        : new Date(0);
    // Use glob to find files
    const globPattern = pattern || '**/*';
    const files = await glob(globPattern, {
        cwd: searchDir,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
        absolute: true,
        nodir: true,
    });
    const fileInfos = [];
    for (const file of files) {
        try {
            const stats = await stat(file);
            if (stats.mtime >= cutoffTime) {
                fileInfos.push({
                    path: relative(BASE_DIR, file),
                    name: file.split('/').pop() || '',
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString(),
                    is_directory: stats.isDirectory(),
                    is_file: stats.isFile(),
                });
            }
        }
        catch (error) {
            // Skip files that can't be read
        }
    }
    // Sort by modification time (newest first)
    fileInfos.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    const limited = limit ? fileInfos.slice(0, limit) : fileInfos;
    return {
        directory: searchDir,
        cutoff_time: cutoffTime.toISOString(),
        total_found: fileInfos.length,
        returned: limited.length,
        files: limited,
    };
}
/**
 * Search for files by pattern
 */
async function searchFiles(pattern, directory) {
    const searchDir = directory ? join(BASE_DIR, directory) : BASE_DIR;
    const files = await glob(pattern, {
        cwd: searchDir,
        ignore: ['**/node_modules/**', '**/.git/**'],
        absolute: true,
    });
    const fileInfos = [];
    for (const file of files) {
        try {
            const stats = await stat(file);
            fileInfos.push({
                path: relative(BASE_DIR, file),
                name: file.split('/').pop() || '',
                size: stats.size,
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
                is_directory: stats.isDirectory(),
                is_file: stats.isFile(),
            });
        }
        catch (error) {
            // Skip files that can't be read
        }
    }
    return {
        pattern,
        search_directory: searchDir,
        total_found: fileInfos.length,
        files: fileInfos,
    };
}
/**
 * Get directory tree structure
 */
async function getDirectoryTree(directory, maxDepth) {
    const rootDir = directory ? join(BASE_DIR, directory) : BASE_DIR;
    const depth = maxDepth || 3;
    async function buildTree(dir, currentDepth) {
        if (currentDepth > depth)
            return null;
        const stats = await stat(dir);
        const name = dir.split('/').pop() || dir;
        if (stats.isFile()) {
            return {
                name,
                type: 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
            };
        }
        if (stats.isDirectory()) {
            // Skip common ignored directories
            if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'build') {
                return null;
            }
            const entries = await readdir(dir);
            const children = [];
            for (const entry of entries.slice(0, 100)) {
                // Limit to 100 entries per directory
                try {
                    const child = await buildTree(join(dir, entry), currentDepth + 1);
                    if (child) {
                        children.push(child);
                    }
                }
                catch (error) {
                    // Skip entries that can't be read
                }
            }
            return {
                name,
                type: 'directory',
                children: children.sort((a, b) => {
                    // Directories first, then files
                    if (a.type === b.type)
                        return a.name.localeCompare(b.name);
                    return a.type === 'directory' ? -1 : 1;
                }),
            };
        }
        return null;
    }
    const tree = await buildTree(rootDir, 0);
    return {
        root_directory: rootDir,
        max_depth: depth,
        tree,
    };
}
/**
 * Compare two files (basic comparison)
 */
async function compareFiles(path1, path2) {
    const fullPath1 = path1.startsWith('/') ? path1 : join(BASE_DIR, path1);
    const fullPath2 = path2.startsWith('/') ? path2 : join(BASE_DIR, path2);
    const [stats1, stats2] = await Promise.all([stat(fullPath1), stat(fullPath2)]);
    // Basic comparison
    const comparison = {
        file1: {
            path: relative(BASE_DIR, fullPath1),
            size: stats1.size,
            modified: stats1.mtime.toISOString(),
        },
        file2: {
            path: relative(BASE_DIR, fullPath2),
            size: stats2.size,
            modified: stats2.mtime.toISOString(),
        },
        same_size: stats1.size === stats2.size,
        size_diff_bytes: stats1.size - stats2.size,
        file1_newer: stats1.mtime > stats2.mtime,
        time_diff_seconds: Math.abs((stats1.mtime.getTime() - stats2.mtime.getTime()) / 1000),
    };
    // If both are files and same size, compare content
    if (stats1.isFile() && stats2.isFile() && stats1.size === stats2.size && stats1.size < 1024 * 1024) {
        // Only compare if < 1MB
        try {
            const [content1, content2] = await Promise.all([
                readFile(fullPath1, 'utf-8'),
                readFile(fullPath2, 'utf-8'),
            ]);
            comparison.identical_content = content1 === content2;
        }
        catch (error) {
            comparison.content_comparison_error = 'Could not read file contents';
        }
    }
    return comparison;
}
/**
 * Get files changed since a specific timestamp
 */
async function getChangesSince(since, directory, pattern) {
    const searchDir = directory ? join(BASE_DIR, directory) : BASE_DIR;
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
        throw new Error(`Invalid timestamp: ${since}`);
    }
    const globPattern = pattern || '**/*';
    const files = await glob(globPattern, {
        cwd: searchDir,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        absolute: true,
        nodir: true,
    });
    const changedFiles = [];
    for (const file of files) {
        try {
            const stats = await stat(file);
            if (stats.mtime >= sinceDate) {
                changedFiles.push({
                    path: relative(BASE_DIR, file),
                    name: file.split('/').pop() || '',
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString(),
                    is_directory: stats.isDirectory(),
                    is_file: stats.isFile(),
                });
            }
        }
        catch (error) {
            // Skip files that can't be read
        }
    }
    // Sort by modification time (newest first)
    changedFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    return {
        since: sinceDate.toISOString(),
        directory: searchDir,
        total_changed: changedFiles.length,
        files: changedFiles,
    };
}
// Create MCP Server
const server = new Server({
    name: 'miyabi-file-watcher',
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
            name: 'file_stats',
            description: 'Get detailed statistics for a file or directory',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'File or directory path (relative to base directory)',
                    },
                },
                required: ['path'],
            },
        },
        {
            name: 'file_recent_changes',
            description: 'Get recently changed files (sorted by modification time)',
            inputSchema: {
                type: 'object',
                properties: {
                    directory: {
                        type: 'string',
                        description: 'Directory to search (relative to base, optional)',
                    },
                    minutes: {
                        type: 'number',
                        description: 'Only show files changed in last N minutes (optional)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of files to return (optional)',
                    },
                    pattern: {
                        type: 'string',
                        description: 'Glob pattern to filter files (optional)',
                    },
                },
            },
        },
        {
            name: 'file_search',
            description: 'Search for files by glob pattern',
            inputSchema: {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'string',
                        description: 'Glob pattern (e.g., "**/*.ts", "src/**/*.json")',
                    },
                    directory: {
                        type: 'string',
                        description: 'Directory to search in (optional)',
                    },
                },
                required: ['pattern'],
            },
        },
        {
            name: 'file_tree',
            description: 'Get directory tree structure',
            inputSchema: {
                type: 'object',
                properties: {
                    directory: {
                        type: 'string',
                        description: 'Root directory for tree (optional)',
                    },
                    depth: {
                        type: 'number',
                        description: 'Maximum depth to traverse (default: 3)',
                    },
                },
            },
        },
        {
            name: 'file_compare',
            description: 'Compare two files (size, modification time, and optionally content)',
            inputSchema: {
                type: 'object',
                properties: {
                    path1: {
                        type: 'string',
                        description: 'First file path',
                    },
                    path2: {
                        type: 'string',
                        description: 'Second file path',
                    },
                },
                required: ['path1', 'path2'],
            },
        },
        {
            name: 'file_changes_since',
            description: 'Get files changed since a specific timestamp',
            inputSchema: {
                type: 'object',
                properties: {
                    since: {
                        type: 'string',
                        description: 'ISO timestamp (e.g., "2025-01-19T10:00:00Z")',
                    },
                    directory: {
                        type: 'string',
                        description: 'Directory to search (optional)',
                    },
                    pattern: {
                        type: 'string',
                        description: 'Glob pattern to filter files (optional)',
                    },
                },
                required: ['since'],
            },
        },
    ],
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case 'file_stats': {
                const validated = PathSchema.parse(args);
                const data = await getFileStats(validated.path);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'file_recent_changes': {
                const validated = RecentChangesSchema.parse(args || {});
                const data = await getRecentChanges(validated.directory, validated.minutes, validated.limit, validated.pattern);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'file_search': {
                const validated = FileSearchSchema.parse(args);
                const data = await searchFiles(validated.pattern, validated.directory);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'file_tree': {
                const validated = FileTreeSchema.parse(args || {});
                const data = await getDirectoryTree(validated.directory, validated.depth);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'file_compare': {
                const validated = FileCompareSchema.parse(args);
                const data = await compareFiles(validated.path1, validated.path2);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'file_changes_since': {
                const validated = ChangesSinceSchema.parse(args);
                const data = await getChangesSince(validated.since, validated.directory, validated.pattern);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
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
    console.error('Miyabi File Watcher MCP Server running on stdio');
    console.error(`Base directory: ${BASE_DIR}`);
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map