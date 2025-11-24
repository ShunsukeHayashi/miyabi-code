#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as si from 'systeminformation';
import { z } from 'zod';
// Zod schemas
const EmptySchema = z.object({});
const ProcessLimitSchema = z.object({
    limit: z.number().optional(),
});
const DiskPathSchema = z.object({
    path: z.string().optional(),
});
/**
 * Get CPU usage information
 */
async function getCpuUsage() {
    const [currentLoad, cpuInfo] = await Promise.all([
        si.currentLoad(),
        si.cpu(),
    ]);
    return {
        overall: {
            usage_percent: Math.round(currentLoad.currentLoad * 100) / 100,
            idle_percent: Math.round(currentLoad.currentLoadIdle * 100) / 100,
            cores: currentLoad.cpus.length,
        },
        per_core: currentLoad.cpus.map((cpu, index) => ({
            core: index,
            usage_percent: Math.round(cpu.load * 100) / 100,
            idle_percent: Math.round(cpu.loadIdle * 100) / 100,
        })),
        cpu_info: {
            manufacturer: cpuInfo.manufacturer,
            brand: cpuInfo.brand,
            speed_ghz: cpuInfo.speed,
            cores: cpuInfo.cores,
            physical_cores: cpuInfo.physicalCores,
        },
    };
}
/**
 * Get memory usage information
 */
async function getMemoryUsage() {
    const mem = await si.mem();
    const totalGB = Math.round((mem.total / 1024 / 1024 / 1024) * 100) / 100;
    const usedGB = Math.round((mem.used / 1024 / 1024 / 1024) * 100) / 100;
    const freeGB = Math.round((mem.free / 1024 / 1024 / 1024) * 100) / 100;
    const availableGB = Math.round((mem.available / 1024 / 1024 / 1024) * 100) / 100;
    return {
        total_gb: totalGB,
        used_gb: usedGB,
        free_gb: freeGB,
        available_gb: availableGB,
        usage_percent: Math.round((mem.used / mem.total) * 10000) / 100,
        swap: {
            total_gb: Math.round((mem.swaptotal / 1024 / 1024 / 1024) * 100) / 100,
            used_gb: Math.round((mem.swapused / 1024 / 1024 / 1024) * 100) / 100,
            free_gb: Math.round((mem.swapfree / 1024 / 1024 / 1024) * 100) / 100,
        },
    };
}
/**
 * Get disk usage information
 */
async function getDiskUsage(path) {
    const disks = await si.fsSize();
    if (path) {
        const disk = disks.find((d) => d.mount === path || d.fs.includes(path));
        if (!disk) {
            throw new Error(`Disk not found for path: ${path}`);
        }
        return formatDiskInfo(disk);
    }
    return disks.map(formatDiskInfo);
}
function formatDiskInfo(disk) {
    return {
        filesystem: disk.fs,
        mount: disk.mount,
        type: disk.type,
        size_gb: Math.round((disk.size / 1024 / 1024 / 1024) * 100) / 100,
        used_gb: Math.round((disk.used / 1024 / 1024 / 1024) * 100) / 100,
        available_gb: Math.round((disk.available / 1024 / 1024 / 1024) * 100) / 100,
        usage_percent: Math.round(disk.use * 100) / 100,
    };
}
/**
 * Get system load average
 */
async function getSystemLoad() {
    const [currentLoad, osInfo] = await Promise.all([
        si.currentLoad(),
        si.osInfo(),
    ]);
    return {
        load_average: {
            '1_min': currentLoad.avgLoad,
            '5_min': currentLoad.currentLoad,
            '15_min': currentLoad.currentLoadIdle,
        },
        os: {
            platform: osInfo.platform,
            distro: osInfo.distro,
            release: osInfo.release,
            arch: osInfo.arch,
        },
    };
}
/**
 * Get comprehensive resource overview
 */
async function getResourceOverview() {
    const [cpu, memory, disks, load, processes] = await Promise.all([
        getCpuUsage(),
        getMemoryUsage(),
        getDiskUsage(),
        getSystemLoad(),
        si.processes(),
    ]);
    return {
        timestamp: new Date().toISOString(),
        cpu: {
            usage_percent: cpu.overall.usage_percent,
            cores: cpu.overall.cores,
        },
        memory: {
            total_gb: memory.total_gb,
            used_gb: memory.used_gb,
            usage_percent: memory.usage_percent,
        },
        disk: disks.map((d) => ({
            mount: d.mount,
            usage_percent: d.usage_percent,
            available_gb: d.available_gb,
        })),
        processes: {
            total: processes.all,
            running: processes.running,
            blocked: processes.blocked,
            sleeping: processes.sleeping,
        },
    };
}
/**
 * Get process information
 */
async function getProcesses(limit) {
    const processes = await si.processes();
    const topProcesses = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, limit || 10)
        .map((p) => ({
        pid: p.pid,
        name: p.name,
        cpu_percent: Math.round(p.cpu * 100) / 100,
        memory_percent: Math.round(p.mem * 100) / 100,
        memory_mb: Math.round((p.memRss / 1024 / 1024) * 100) / 100,
        state: p.state,
        command: p.command,
    }));
    return {
        summary: {
            total: processes.all,
            running: processes.running,
            blocked: processes.blocked,
            sleeping: processes.sleeping,
        },
        top_by_cpu: topProcesses,
    };
}
/**
 * Get system uptime
 */
async function getUptime() {
    const [time, osInfo] = await Promise.all([si.time(), si.osInfo()]);
    const uptimeSeconds = time.uptime;
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return {
        uptime_seconds: uptimeSeconds,
        uptime_formatted: `${days}d ${hours}h ${minutes}m`,
        boot_time: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
        current_time: new Date().toISOString(),
    };
}
/**
 * Get network interface statistics
 */
async function getNetworkStats() {
    const [networkStats, networkInterfaces] = await Promise.all([
        si.networkStats(),
        si.networkInterfaces(),
    ]);
    return {
        interfaces: networkInterfaces.map((iface) => ({
            name: iface.iface,
            ip4: iface.ip4,
            ip6: iface.ip6,
            mac: iface.mac,
            internal: iface.internal,
            virtual: iface.virtual,
            speed: iface.speed,
            type: iface.type,
        })),
        statistics: networkStats.map((stat) => ({
            interface: stat.iface,
            rx_bytes: stat.rx_bytes,
            tx_bytes: stat.tx_bytes,
            rx_sec: Math.round(stat.rx_sec),
            tx_sec: Math.round(stat.tx_sec),
        })),
    };
}
// Create MCP Server
const server = new Server({
    name: 'miyabi-resource-monitor',
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
            name: 'resource_cpu',
            description: 'Get current CPU usage (overall and per-core)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'resource_memory',
            description: 'Get current memory usage (RAM and swap)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'resource_disk',
            description: 'Get disk usage for all mounted filesystems or a specific path',
            inputSchema: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Specific mount point or path to check (optional)',
                    },
                },
            },
        },
        {
            name: 'resource_load',
            description: 'Get system load average and OS information',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'resource_overview',
            description: 'Get comprehensive overview of all system resources (CPU, memory, disk, processes)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'resource_processes',
            description: 'Get process information (top processes by CPU usage)',
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
        {
            name: 'resource_uptime',
            description: 'Get system uptime and boot time',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'resource_network_stats',
            description: 'Get network interface information and statistics',
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
        switch (name) {
            case 'resource_cpu': {
                const data = await getCpuUsage();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_memory': {
                const data = await getMemoryUsage();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_disk': {
                const validated = DiskPathSchema.parse(args || {});
                const data = await getDiskUsage(validated.path);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_load': {
                const data = await getSystemLoad();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_overview': {
                const data = await getResourceOverview();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_processes': {
                const validated = ProcessLimitSchema.parse(args || {});
                const data = await getProcesses(validated.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_uptime': {
                const data = await getUptime();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'resource_network_stats': {
                const data = await getNetworkStats();
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
    console.error('Miyabi Resource Monitor MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map