#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
const execAsync = promisify(exec);
// Zod schemas
const ProcessIdSchema = z.object({
    pid: z.number(),
});
const ProcessSearchSchema = z.object({
    query: z.string(),
    limit: z.number().optional(),
});
const ProcessListSchema = z.object({
    sort_by: z.enum(['cpu', 'memory', 'pid', 'name']).optional(),
    limit: z.number().optional(),
});
/**
 * Get detailed information about a specific process
 */
async function getProcessInfo(pid) {
    const processes = await si.processes();
    const process = processes.list.find((p) => p.pid === pid);
    if (!process) {
        throw new Error(`Process with PID ${pid} not found`);
    }
    return {
        pid: process.pid,
        parent_pid: process.parentPid,
        name: process.name,
        command: process.command,
        params: process.params,
        path: process.path,
        started: process.started,
        user: process.user,
        cpu_percent: Math.round(process.cpu * 100) / 100,
        memory_percent: Math.round(process.mem * 100) / 100,
        memory_rss_mb: Math.round((process.memRss / 1024 / 1024) * 100) / 100,
        memory_vsz_mb: Math.round((process.memVsz / 1024 / 1024) * 100) / 100,
        state: process.state,
        priority: process.priority,
        nice: process.nice,
    };
}
/**
 * Get list of all processes with optional sorting and limiting
 */
async function getProcessList(sortBy, limit) {
    const processes = await si.processes();
    let sorted = [...processes.list];
    // Sort processes
    switch (sortBy) {
        case 'cpu':
            sorted.sort((a, b) => b.cpu - a.cpu);
            break;
        case 'memory':
            sorted.sort((a, b) => b.mem - a.mem);
            break;
        case 'pid':
            sorted.sort((a, b) => a.pid - b.pid);
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            sorted.sort((a, b) => b.cpu - a.cpu); // Default: sort by CPU
    }
    // Limit results
    if (limit) {
        sorted = sorted.slice(0, limit);
    }
    return {
        summary: {
            total: processes.all,
            running: processes.running,
            blocked: processes.blocked,
            sleeping: processes.sleeping,
        },
        processes: sorted.map((p) => ({
            pid: p.pid,
            parent_pid: p.parentPid,
            name: p.name,
            cpu_percent: Math.round(p.cpu * 100) / 100,
            memory_percent: Math.round(p.mem * 100) / 100,
            memory_mb: Math.round((p.memRss / 1024 / 1024) * 100) / 100,
            state: p.state,
            user: p.user,
            command: p.command,
        })),
    };
}
/**
 * Search for processes by name or command
 */
async function searchProcesses(query, limit) {
    const processes = await si.processes();
    const queryLower = query.toLowerCase();
    const matches = processes.list.filter((p) => p.name.toLowerCase().includes(queryLower) ||
        p.command.toLowerCase().includes(queryLower));
    // Sort by CPU usage
    matches.sort((a, b) => b.cpu - a.cpu);
    const limited = limit ? matches.slice(0, limit) : matches;
    return {
        query,
        matches_found: matches.length,
        results: limited.map((p) => ({
            pid: p.pid,
            name: p.name,
            command: p.command,
            cpu_percent: Math.round(p.cpu * 100) / 100,
            memory_mb: Math.round((p.memRss / 1024 / 1024) * 100) / 100,
            state: p.state,
            user: p.user,
        })),
    };
}
/**
 * Get process tree (parent-child relationships)
 */
async function getProcessTree() {
    try {
        // Use pstree command if available (macOS/Linux)
        const { stdout } = await execAsync('pstree -p 2>/dev/null || pstree 2>/dev/null');
        return {
            tree_format: 'text',
            output: stdout.trim(),
        };
    }
    catch (error) {
        // Fallback: build tree from process list
        const processes = await si.processes();
        // Build parent-child map
        const processMap = new Map();
        const children = new Map();
        for (const p of processes.list) {
            processMap.set(p.pid, p);
            if (!children.has(p.parentPid)) {
                children.set(p.parentPid, []);
            }
            children.get(p.parentPid).push(p.pid);
        }
        // Find root processes (init, launchd, etc.)
        const roots = processes.list.filter((p) => p.parentPid === 0 || p.pid === 1);
        const buildTree = (pid, depth = 0) => {
            const proc = processMap.get(pid);
            if (!proc)
                return null;
            const childPids = children.get(pid) || [];
            return {
                pid: proc.pid,
                name: proc.name,
                cpu: Math.round(proc.cpu * 100) / 100,
                children: childPids.map((childPid) => buildTree(childPid, depth + 1)).filter(Boolean),
            };
        };
        return {
            tree_format: 'json',
            roots: roots.map((r) => buildTree(r.pid)),
        };
    }
}
/**
 * Get file descriptors for a process (using lsof)
 */
async function getProcessFileDescriptors(pid) {
    try {
        const { stdout } = await execAsync(`lsof -p ${pid} 2>/dev/null`);
        const lines = stdout.trim().split('\n').slice(1); // Skip header
        const fds = [];
        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length >= 9) {
                const [command, pidStr, user, fd, type, device, sizeOff, node, name] = parts;
                fds.push({
                    fd,
                    type,
                    name: parts.slice(8).join(' '), // Handle names with spaces
                });
            }
        }
        return {
            pid,
            file_descriptors: fds,
            total: fds.length,
        };
    }
    catch (error) {
        throw new Error(`Failed to get file descriptors for PID ${pid}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get environment variables for a process
 */
async function getProcessEnvironment(pid) {
    try {
        // Read from /proc on Linux, use ps on macOS
        let envVars = {};
        try {
            // Try reading /proc (Linux)
            const { readFile } = await import('fs/promises');
            const environ = await readFile(`/proc/${pid}/environ`, 'utf-8');
            const pairs = environ.split('\0').filter(Boolean);
            for (const pair of pairs) {
                const [key, ...valueParts] = pair.split('=');
                if (key) {
                    envVars[key] = valueParts.join('=');
                }
            }
        }
        catch {
            // Fallback: use ps command (limited info on macOS)
            const { stdout } = await execAsync(`ps eww ${pid} 2>/dev/null`);
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
                // Parse environment from ps output (format varies by OS)
                envVars = { note: 'Limited environment info available on this platform' };
            }
        }
        return {
            pid,
            environment: envVars,
            count: Object.keys(envVars).length,
        };
    }
    catch (error) {
        throw new Error(`Failed to get environment for PID ${pid}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get child processes of a specific process
 */
async function getProcessChildren(pid) {
    const processes = await si.processes();
    const children = processes.list.filter((p) => p.parentPid === pid);
    return {
        parent_pid: pid,
        children_count: children.length,
        children: children.map((p) => ({
            pid: p.pid,
            name: p.name,
            command: p.command,
            cpu_percent: Math.round(p.cpu * 100) / 100,
            memory_mb: Math.round((p.memRss / 1024 / 1024) * 100) / 100,
            state: p.state,
        })),
    };
}
/**
 * Get top processes by resource usage
 */
async function getTopProcesses(limit = 10) {
    const processes = await si.processes();
    const byCpu = [...processes.list]
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, limit)
        .map((p) => ({
        pid: p.pid,
        name: p.name,
        cpu_percent: Math.round(p.cpu * 100) / 100,
        memory_mb: Math.round((p.memRss / 1024 / 1024) * 100) / 100,
        command: p.command,
    }));
    const byMemory = [...processes.list]
        .sort((a, b) => b.mem - a.mem)
        .slice(0, limit)
        .map((p) => ({
        pid: p.pid,
        name: p.name,
        cpu_percent: Math.round(p.cpu * 100) / 100,
        memory_mb: Math.round((p.memRss / 1024 / 1024) * 100) / 100,
        command: p.command,
    }));
    return {
        top_by_cpu: byCpu,
        top_by_memory: byMemory,
    };
}
// Create MCP Server
const server = new Server({
    name: 'miyabi-process-inspector',
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
            name: 'process_info',
            description: 'Get detailed information about a specific process by PID',
            inputSchema: {
                type: 'object',
                properties: {
                    pid: {
                        type: 'number',
                        description: 'Process ID',
                    },
                },
                required: ['pid'],
            },
        },
        {
            name: 'process_list',
            description: 'Get list of all processes with optional sorting and limiting',
            inputSchema: {
                type: 'object',
                properties: {
                    sort_by: {
                        type: 'string',
                        enum: ['cpu', 'memory', 'pid', 'name'],
                        description: 'Sort processes by (default: cpu)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of processes to return',
                    },
                },
            },
        },
        {
            name: 'process_search',
            description: 'Search for processes by name or command',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query (name or command)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of results',
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'process_tree',
            description: 'Get process tree (parent-child relationships)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'process_file_descriptors',
            description: 'Get file descriptors for a specific process (requires lsof)',
            inputSchema: {
                type: 'object',
                properties: {
                    pid: {
                        type: 'number',
                        description: 'Process ID',
                    },
                },
                required: ['pid'],
            },
        },
        {
            name: 'process_environment',
            description: 'Get environment variables for a specific process',
            inputSchema: {
                type: 'object',
                properties: {
                    pid: {
                        type: 'number',
                        description: 'Process ID',
                    },
                },
                required: ['pid'],
            },
        },
        {
            name: 'process_children',
            description: 'Get child processes of a specific process',
            inputSchema: {
                type: 'object',
                properties: {
                    pid: {
                        type: 'number',
                        description: 'Parent process ID',
                    },
                },
                required: ['pid'],
            },
        },
        {
            name: 'process_top',
            description: 'Get top processes by CPU and memory usage',
            inputSchema: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Number of top processes to return (default: 10)',
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
            case 'process_info': {
                const validated = ProcessIdSchema.parse(args);
                const data = await getProcessInfo(validated.pid);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_list': {
                const validated = ProcessListSchema.parse(args || {});
                const data = await getProcessList(validated.sort_by, validated.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_search': {
                const validated = ProcessSearchSchema.parse(args);
                const data = await searchProcesses(validated.query, validated.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_tree': {
                const data = await getProcessTree();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_file_descriptors': {
                const validated = ProcessIdSchema.parse(args);
                const data = await getProcessFileDescriptors(validated.pid);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_environment': {
                const validated = ProcessIdSchema.parse(args);
                const data = await getProcessEnvironment(validated.pid);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_children': {
                const validated = ProcessIdSchema.parse(args);
                const data = await getProcessChildren(validated.pid);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'process_top': {
                const validated = z.object({ limit: z.number().optional() }).parse(args || {});
                const data = await getTopProcesses(validated.limit);
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
    console.error('Miyabi Process Inspector MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map