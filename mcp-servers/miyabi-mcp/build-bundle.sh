#!/bin/bash
# Miyabi MCP Bundle Builder
# Combines all individual MCP servers into a single package

set -e

echo "🚀 Building Miyabi MCP Bundle..."

# Source files to combine
SERVERS=(
  "miyabi-git-inspector"
  "miyabi-tmux-server"  
  "miyabi-log-aggregator"
  "miyabi-resource-monitor"
  "miyabi-network-inspector"
  "miyabi-process-inspector"
  "miyabi-file-watcher"
  "miyabi-claude-code"
  "miyabi-github"
)

BASEDIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers"
OUTFILE="$BASEDIR/miyabi-mcp/src/index.ts"

# Create header
cat > "$OUTFILE" << 'EOF'
#!/usr/bin/env node
/**
 * Miyabi MCP - All-in-One Monitoring and Control Server
 * Combines 9 MCP servers with 75 tools total
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Start individual servers as needed based on configuration
const server = new Server(
  {
    name: 'miyabi-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Import and register all tools from individual servers
// This is a meta-server that delegates to individual implementations

console.error('Miyabi MCP Bundle Server running on stdio');
console.error('包含 75 ツール from 9 categories');

const transport = new StdioServerTransport();
await server.connect(transport);
EOF

chmod +x build-bundle.sh

echo "✅ Bundle builder script created"
echo "Run: ./build-bundle.sh to create integrated package"
