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
const EmptySchema = z.object({});
const PortFilterSchema = z.object({
    protocol: z.enum(['tcp', 'udp', 'all']).optional(),
});
const PingSchema = z.object({
    host: z.string(),
});
/**
 * Get network interfaces information
 */
async function getNetworkInterfaces() {
    const interfaces = await si.networkInterfaces();
    return interfaces.map((iface) => ({
        name: iface.iface,
        type: iface.type,
        ip4: iface.ip4,
        ip6: iface.ip6,
        mac: iface.mac,
        internal: iface.internal,
        virtual: iface.virtual,
        operstate: iface.operstate,
        speed: iface.speed,
        mtu: iface.mtu,
        dhcp: iface.dhcp,
    }));
}
/**
 * Get active network connections
 */
async function getNetworkConnections() {
    const connections = await si.networkConnections();
    return connections.map((conn) => ({
        protocol: conn.protocol,
        local_address: conn.localAddress,
        local_port: conn.localPort,
        peer_address: conn.peerAddress,
        peer_port: conn.peerPort,
        state: conn.state,
        pid: conn.pid,
        process: conn.process,
    }));
}
/**
 * Get listening ports using lsof (macOS/Linux)
 */
async function getListeningPorts(protocol) {
    try {
        // Use lsof to get listening ports
        const protocolFlag = protocol === 'tcp' ? '-iTCP' : protocol === 'udp' ? '-iUDP' : '-i';
        const { stdout } = await execAsync(`lsof -nP ${protocolFlag} -sTCP:LISTEN 2>/dev/null || true`);
        const lines = stdout.trim().split('\n').slice(1); // Skip header
        const ports = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            const parts = line.split(/\s+/);
            if (parts.length < 9)
                continue;
            const [command, pid, user, fd, type, device, sizeOff, node, name] = parts;
            // Parse address:port
            const match = name.match(/^(.*):(\d+)$/);
            if (match) {
                ports.push({
                    command,
                    pid: parseInt(pid),
                    user,
                    protocol: type.toLowerCase(),
                    address: match[1] === '*' ? '0.0.0.0' : match[1],
                    port: parseInt(match[2]),
                    state: 'LISTEN',
                });
            }
        }
        return ports;
    }
    catch (error) {
        // Fallback to systeminformation
        const connections = await si.networkConnections();
        return connections
            .filter((conn) => conn.state === 'LISTEN')
            .map((conn) => ({
            command: conn.process || 'unknown',
            pid: conn.pid,
            protocol: conn.protocol,
            address: conn.localAddress,
            port: conn.localPort,
            state: conn.state,
        }));
    }
}
/**
 * Get network statistics
 */
async function getNetworkStats() {
    const stats = await si.networkStats();
    return stats.map((stat) => ({
        interface: stat.iface,
        operstate: stat.operstate,
        rx_bytes: stat.rx_bytes,
        tx_bytes: stat.tx_bytes,
        rx_dropped: stat.rx_dropped,
        tx_dropped: stat.tx_dropped,
        rx_errors: stat.rx_errors,
        tx_errors: stat.tx_errors,
        rx_sec: Math.round(stat.rx_sec),
        tx_sec: Math.round(stat.tx_sec),
        ms: stat.ms,
    }));
}
/**
 * Get default gateway information
 */
async function getGateway() {
    const gateway = await si.networkGatewayDefault();
    return {
        gateway: gateway,
    };
}
/**
 * Ping a host
 */
async function pingHost(host) {
    try {
        // Use system ping command (cross-platform)
        const count = 4;
        const { stdout } = await execAsync(`ping -c ${count} ${host}`, { timeout: 10000 });
        // Parse ping output
        const lines = stdout.split('\n');
        const stats = {
            host,
            packets_sent: count,
            packets_received: 0,
            packet_loss_percent: 100,
            min_ms: 0,
            avg_ms: 0,
            max_ms: 0,
        };
        // Extract statistics
        for (const line of lines) {
            // Match packet statistics: "4 packets transmitted, 4 received, 0% packet loss"
            const packetMatch = line.match(/(\d+) packets transmitted, (\d+) received, ([\d.]+)% packet loss/);
            if (packetMatch) {
                stats.packets_received = parseInt(packetMatch[2]);
                stats.packet_loss_percent = parseFloat(packetMatch[3]);
            }
            // Match RTT statistics: "round-trip min/avg/max/stddev = 10.5/15.2/20.1/3.4 ms"
            const rttMatch = line.match(/round-trip min\/avg\/max\/stddev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/);
            if (rttMatch) {
                stats.min_ms = parseFloat(rttMatch[1]);
                stats.avg_ms = parseFloat(rttMatch[2]);
                stats.max_ms = parseFloat(rttMatch[3]);
                stats.stddev_ms = parseFloat(rttMatch[4]);
            }
        }
        stats.reachable = stats.packets_received > 0;
        return stats;
    }
    catch (error) {
        return {
            host,
            reachable: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Get current bandwidth usage
 */
async function getBandwidthUsage() {
    const stats = await si.networkStats();
    const total = {
        rx_sec_total: 0,
        tx_sec_total: 0,
        interfaces: [],
    };
    for (const stat of stats) {
        total.rx_sec_total += stat.rx_sec;
        total.tx_sec_total += stat.tx_sec;
        if (stat.rx_sec > 0 || stat.tx_sec > 0) {
            total.interfaces.push({
                interface: stat.iface,
                rx_sec: Math.round(stat.rx_sec),
                tx_sec: Math.round(stat.tx_sec),
                rx_bytes: stat.rx_bytes,
                tx_bytes: stat.tx_bytes,
            });
        }
    }
    total.rx_sec_total = Math.round(total.rx_sec_total);
    total.tx_sec_total = Math.round(total.tx_sec_total);
    return total;
}
/**
 * Get comprehensive network overview
 */
async function getNetworkOverview() {
    const [interfaces, connections, listeningPorts, stats, gateway] = await Promise.all([
        getNetworkInterfaces(),
        getNetworkConnections(),
        getListeningPorts('all'),
        getNetworkStats(),
        getGateway(),
    ]);
    const activeInterfaces = interfaces.filter((iface) => iface.operstate === 'up' && !iface.internal);
    return {
        timestamp: new Date().toISOString(),
        interfaces: {
            total: interfaces.length,
            active: activeInterfaces.length,
            list: activeInterfaces.map((iface) => ({
                name: iface.name,
                type: iface.type,
                ip4: iface.ip4,
                speed: iface.speed,
            })),
        },
        connections: {
            total: connections.length,
            established: connections.filter((c) => c.state === 'ESTABLISHED').length,
        },
        listening_ports: {
            total: listeningPorts.length,
            tcp: listeningPorts.filter((p) => p.protocol === 'tcp').length,
            udp: listeningPorts.filter((p) => p.protocol === 'udp').length,
        },
        gateway: gateway.gateway,
    };
}
// Create MCP Server
const server = new Server({
    name: 'miyabi-network-inspector',
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
            name: 'network_interfaces',
            description: 'List all network interfaces with IP addresses and status',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'network_connections',
            description: 'List all active network connections',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'network_listening_ports',
            description: 'List all listening ports (TCP/UDP)',
            inputSchema: {
                type: 'object',
                properties: {
                    protocol: {
                        type: 'string',
                        enum: ['tcp', 'udp', 'all'],
                        description: 'Filter by protocol (default: all)',
                    },
                },
            },
        },
        {
            name: 'network_stats',
            description: 'Get network statistics (RX/TX bytes, packets, errors)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'network_gateway',
            description: 'Get default gateway information',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'network_ping',
            description: 'Ping a host to check reachability and latency',
            inputSchema: {
                type: 'object',
                properties: {
                    host: {
                        type: 'string',
                        description: 'Hostname or IP address to ping',
                    },
                },
                required: ['host'],
            },
        },
        {
            name: 'network_bandwidth',
            description: 'Get current bandwidth usage (bytes/sec)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'network_overview',
            description: 'Get comprehensive network overview (interfaces, connections, ports)',
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
            case 'network_interfaces': {
                const data = await getNetworkInterfaces();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'network_connections': {
                const data = await getNetworkConnections();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'network_listening_ports': {
                const validated = PortFilterSchema.parse(args || {});
                const data = await getListeningPorts(validated.protocol || 'all');
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'network_stats': {
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
            case 'network_gateway': {
                const data = await getGateway();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'network_ping': {
                const validated = PingSchema.parse(args);
                const data = await pingHost(validated.host);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'network_bandwidth': {
                const data = await getBandwidthUsage();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'network_overview': {
                const data = await getNetworkOverview();
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
    console.error('Miyabi Network Inspector MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map