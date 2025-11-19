#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { z } from 'zod';
// Log base directory
const LOG_BASE_DIR = process.env.MIYABI_LOG_DIR || '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private';
// Zod schemas
const EmptySchema = z.object({});
const LogSearchSchema = z.object({
    query: z.string(),
    source: z.string().optional(),
    level: z.string().optional(),
});
const LogRecentSchema = z.object({
    source: z.string().optional(),
    level: z.string().optional(),
    minutes: z.number().optional(),
    limit: z.number().optional(),
});
const LogTailSchema = z.object({
    source: z.string(),
    lines: z.number(),
});
/**
 * Find all log files in the repository
 */
async function findLogFiles() {
    const patterns = [
        '**/logs/**/*.log',
        '**/*.log',
        '**/npm-debug.log',
        '**/error.log',
        '**/combined.log',
    ];
    const sources = [];
    for (const pattern of patterns) {
        try {
            const files = await glob(pattern, {
                cwd: LOG_BASE_DIR,
                ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
                absolute: true,
            });
            for (const file of files) {
                try {
                    const stats = await import('fs/promises').then((fs) => fs.stat(file));
                    sources.push({
                        name: file.replace(LOG_BASE_DIR, '').replace(/^\//, ''),
                        path: file,
                        size: stats.size,
                    });
                }
                catch (error) {
                    // Skip files that can't be read
                }
            }
        }
        catch (error) {
            // Skip patterns that don't match
        }
    }
    return sources;
}
/**
 * Read and parse log file
 */
async function readLogFile(path, maxLines) {
    try {
        const content = await readFile(path, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        if (maxLines) {
            return lines.slice(-maxLines);
        }
        return lines;
    }
    catch (error) {
        throw new Error(`Failed to read log file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Parse log entry (simple format detection)
 */
function parseLogEntry(line, source, lineNumber) {
    // Try to detect timestamp and level
    const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
    const levelMatch = line.match(/\[(error|warn|info|debug)\]/i) || line.match(/(error|warn|info|debug):/i);
    return {
        source,
        level: levelMatch ? levelMatch[1].toLowerCase() : 'info',
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        message: line,
        line: lineNumber,
    };
}
/**
 * Get recent log entries
 */
async function getRecentLogs(source, level, minutes, limit) {
    const sources = await findLogFiles();
    const filteredSources = source
        ? sources.filter((s) => s.name.includes(source))
        : sources;
    const allEntries = [];
    const cutoffTime = minutes
        ? new Date(Date.now() - minutes * 60 * 1000)
        : new Date(0);
    for (const logSource of filteredSources) {
        const lines = await readLogFile(logSource.path, limit || 100);
        lines.forEach((line, index) => {
            const entry = parseLogEntry(line, logSource.name, index + 1);
            if (entry) {
                const entryTime = new Date(entry.timestamp);
                if (entryTime >= cutoffTime) {
                    if (!level || entry.level === level.toLowerCase()) {
                        allEntries.push(entry);
                    }
                }
            }
        });
    }
    // Sort by timestamp descending
    allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return limit ? allEntries.slice(0, limit) : allEntries;
}
/**
 * Search logs
 */
async function searchLogs(query, source, level) {
    const sources = await findLogFiles();
    const filteredSources = source
        ? sources.filter((s) => s.name.includes(source))
        : sources;
    const results = [];
    for (const logSource of filteredSources) {
        const lines = await readLogFile(logSource.path);
        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
                const entry = parseLogEntry(line, logSource.name, index + 1);
                if (entry) {
                    if (!level || entry.level === level.toLowerCase()) {
                        results.push(entry);
                    }
                }
            }
        });
    }
    return results;
}
/**
 * Get errors from logs
 */
async function getErrors(minutes) {
    return await getRecentLogs(undefined, 'error', minutes);
}
/**
 * Get warnings from logs
 */
async function getWarnings(minutes) {
    return await getRecentLogs(undefined, 'warn', minutes);
}
/**
 * Tail log file
 */
async function tailLog(source, lines) {
    const sources = await findLogFiles();
    const matchingSource = sources.find((s) => s.name.includes(source));
    if (!matchingSource) {
        throw new Error(`Log source not found: ${source}`);
    }
    return await readLogFile(matchingSource.path, lines);
}
// Create MCP Server
const server = new Server({
    name: 'miyabi-log-aggregator',
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
            name: 'log_sources',
            description: 'List all available log sources in the Miyabi system',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'log_get_recent',
            description: 'Get recent log entries, optionally filtered by source, level, and time',
            inputSchema: {
                type: 'object',
                properties: {
                    source: {
                        type: 'string',
                        description: 'Filter by log source (partial match)',
                    },
                    level: {
                        type: 'string',
                        description: 'Filter by log level (error, warn, info, debug)',
                    },
                    minutes: {
                        type: 'number',
                        description: 'Only show logs from last N minutes',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of entries to return',
                    },
                },
            },
        },
        {
            name: 'log_search',
            description: 'Search logs for a specific query string',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query (case-insensitive)',
                    },
                    source: {
                        type: 'string',
                        description: 'Filter by log source (optional)',
                    },
                    level: {
                        type: 'string',
                        description: 'Filter by log level (optional)',
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'log_get_errors',
            description: 'Get all error-level log entries',
            inputSchema: {
                type: 'object',
                properties: {
                    minutes: {
                        type: 'number',
                        description: 'Only show errors from last N minutes (optional)',
                    },
                },
            },
        },
        {
            name: 'log_get_warnings',
            description: 'Get all warning-level log entries',
            inputSchema: {
                type: 'object',
                properties: {
                    minutes: {
                        type: 'number',
                        description: 'Only show warnings from last N minutes (optional)',
                    },
                },
            },
        },
        {
            name: 'log_tail',
            description: 'Get the last N lines from a specific log file',
            inputSchema: {
                type: 'object',
                properties: {
                    source: {
                        type: 'string',
                        description: 'Log source name (partial match)',
                    },
                    lines: {
                        type: 'number',
                        description: 'Number of lines to retrieve',
                    },
                },
                required: ['source', 'lines'],
            },
        },
    ],
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case 'log_sources': {
                const sources = await findLogFiles();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(sources, null, 2),
                        },
                    ],
                };
            }
            case 'log_get_recent': {
                const validated = LogRecentSchema.parse(args || {});
                const logs = await getRecentLogs(validated.source, validated.level, validated.minutes, validated.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(logs, null, 2),
                        },
                    ],
                };
            }
            case 'log_search': {
                const validated = LogSearchSchema.parse(args);
                const results = await searchLogs(validated.query, validated.source, validated.level);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2),
                        },
                    ],
                };
            }
            case 'log_get_errors': {
                const validated = z.object({ minutes: z.number().optional() }).parse(args || {});
                const errors = await getErrors(validated.minutes);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(errors, null, 2),
                        },
                    ],
                };
            }
            case 'log_get_warnings': {
                const validated = z.object({ minutes: z.number().optional() }).parse(args || {});
                const warnings = await getWarnings(validated.minutes);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(warnings, null, 2),
                        },
                    ],
                };
            }
            case 'log_tail': {
                const validated = LogTailSchema.parse(args);
                const lines = await tailLog(validated.source, validated.lines);
                return {
                    content: [
                        {
                            type: 'text',
                            text: lines.join('\n'),
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
    console.error('Miyabi Log Aggregator MCP Server running on stdio');
    console.error(`Log base directory: ${LOG_BASE_DIR}`);
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map