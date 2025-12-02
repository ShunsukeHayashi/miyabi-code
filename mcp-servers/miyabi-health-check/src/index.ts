#!/usr/bin/env node
/**
 * Miyabi Health Check MCP Server
 * 
 * Comprehensive health diagnostics for the Miyabi ecosystem.
 * Checks: Git, Rust/Cargo, Node.js, GitHub, Obsidian, Tmux, Network
 * 
 * Tools:
 * - health_check_full: Run all health checks
 * - health_check_quick: Check critical systems only
 * - health_fix_suggest: Get fix suggestions for issues
 * - health_auto_fix: Attempt automatic fixes
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { stat, readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

type HealthStatusLevel = 'ok' | 'warning' | 'error' | 'not_configured';

interface HealthStatus {
  name: string;
  status: HealthStatusLevel;
  message: string;
  details?: Record<string, unknown>;
  fix_command?: string;
  fix_url?: string;
}

interface HealthReport {
  timestamp: string;
  overall_status: 'healthy' | 'degraded' | 'critical';
  checks: HealthStatus[];
  summary: {
    total: number;
    ok: number;
    warning: number;
    error: number;
    not_configured: number;
  };
  recommendations: string[];
}

// ============================================================================
// Health Checkers
// ============================================================================

async function checkGit(): Promise<HealthStatus> {
  try {
    const { stdout: version } = await execAsync('git --version');
    const { stdout: status } = await execAsync('git status --porcelain').catch(() => ({ stdout: 'not_a_repo' }));
    
    const isRepo = status !== 'not_a_repo';
    const hasChanges = status.trim().length > 0 && isRepo;
    
    return {
      name: 'Git',
      status: 'ok',
      message: `${version.trim()}${isRepo ? (hasChanges ? ' (uncommitted changes)' : ' (clean)') : ' (not in repo)'}`,
      details: {
        version: version.trim(),
        is_repository: isRepo,
        has_uncommitted_changes: hasChanges,
      },
    };
  } catch {
    return {
      name: 'Git',
      status: 'error',
      message: 'Git is not installed',
      fix_command: 'apt-get install git || brew install git',
      fix_url: 'https://git-scm.com/downloads',
    };
  }
}

async function checkRust(): Promise<HealthStatus> {
  try {
    const { stdout: cargoVersion } = await execAsync('cargo --version');
    const { stdout: rustcVersion } = await execAsync('rustc --version');
    
    // Check if miyabi-mcp-server binary exists
    const binaryPath = join(process.cwd(), 'target/release/miyabi-mcp-server');
    let binaryBuilt = false;
    try {
      await stat(binaryPath);
      binaryBuilt = true;
    } catch {
      // Binary not built
    }
    
    if (!binaryBuilt) {
      return {
        name: 'Rust Environment',
        status: 'warning',
        message: `Rust installed, but miyabi-mcp-server not built`,
        details: {
          cargo: cargoVersion.trim(),
          rustc: rustcVersion.trim(),
          binary_built: false,
        },
        fix_command: 'cargo build --release -p miyabi-mcp-server',
      };
    }
    
    return {
      name: 'Rust Environment',
      status: 'ok',
      message: `${cargoVersion.trim()} - Binary ready`,
      details: {
        cargo: cargoVersion.trim(),
        rustc: rustcVersion.trim(),
        binary_built: true,
        binary_path: binaryPath,
      },
    };
  } catch {
    return {
      name: 'Rust Environment',
      status: 'error',
      message: 'Rust/Cargo not installed',
      fix_command: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      fix_url: 'https://rustup.rs',
    };
  }
}

async function checkNode(): Promise<HealthStatus> {
  try {
    const { stdout: nodeVersion } = await execAsync('node --version');
    const { stdout: npmVersion } = await execAsync('npm --version');
    
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion < 18) {
      return {
        name: 'Node.js',
        status: 'warning',
        message: `Node.js ${nodeVersion.trim()} (v18+ recommended)`,
        details: {
          node: nodeVersion.trim(),
          npm: npmVersion.trim(),
        },
        fix_command: 'nvm install 20 && nvm use 20',
      };
    }
    
    return {
      name: 'Node.js',
      status: 'ok',
      message: `Node.js ${nodeVersion.trim()}, npm ${npmVersion.trim()}`,
      details: {
        node: nodeVersion.trim(),
        npm: npmVersion.trim(),
      },
    };
  } catch {
    return {
      name: 'Node.js',
      status: 'error',
      message: 'Node.js not installed',
      fix_command: 'curl -fsSL https://fnm.vercel.app/install | bash && fnm install 20',
      fix_url: 'https://nodejs.org',
    };
  }
}

async function checkGitHub(): Promise<HealthStatus> {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    return {
      name: 'GitHub Authentication',
      status: 'not_configured',
      message: 'GITHUB_TOKEN environment variable not set',
      fix_url: 'https://github.com/settings/tokens',
      fix_command: 'export GITHUB_TOKEN="your_token_here"',
    };
  }
  
  try {
    // Validate token by making API call
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'miyabi-health-check',
      },
    });
    
    if (!response.ok) {
      return {
        name: 'GitHub Authentication',
        status: 'error',
        message: 'Invalid or expired GitHub token',
        fix_url: 'https://github.com/settings/tokens',
      };
    }
    
    const user = await response.json();
    
    return {
      name: 'GitHub Authentication',
      status: 'ok',
      message: `Authenticated as @${user.login}`,
      details: {
        username: user.login,
        scopes: response.headers.get('x-oauth-scopes'),
      },
    };
  } catch (error) {
    return {
      name: 'GitHub Authentication',
      status: 'error',
      message: `GitHub API error: ${(error as Error).message}`,
    };
  }
}

async function checkObsidian(): Promise<HealthStatus> {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  
  if (!vaultPath) {
    // Try default locations
    const defaultPaths = [
      join(homedir(), 'Documents/Obsidian'),
      join(homedir(), 'Obsidian'),
      join(homedir(), '.obsidian'),
    ];
    
    for (const path of defaultPaths) {
      try {
        await stat(path);
        return {
          name: 'Obsidian Vault',
          status: 'warning',
          message: `Found vault at ${path}, but OBSIDIAN_VAULT_PATH not set`,
          details: { detected_path: path },
          fix_command: `export OBSIDIAN_VAULT_PATH="${path}"`,
        };
      } catch {
        // Continue checking
      }
    }
    
    return {
      name: 'Obsidian Vault',
      status: 'not_configured',
      message: 'No Obsidian vault configured or detected',
      fix_command: 'export OBSIDIAN_VAULT_PATH="/path/to/your/vault"',
    };
  }
  
  try {
    await stat(vaultPath);
    await stat(join(vaultPath, '.obsidian'));
    
    return {
      name: 'Obsidian Vault',
      status: 'ok',
      message: `Vault connected: ${vaultPath}`,
      details: { path: vaultPath },
    };
  } catch {
    return {
      name: 'Obsidian Vault',
      status: 'error',
      message: `Vault path invalid: ${vaultPath}`,
      fix_command: 'Verify OBSIDIAN_VAULT_PATH points to valid Obsidian vault',
    };
  }
}

async function checkTmux(): Promise<HealthStatus> {
  try {
    const { stdout: version } = await execAsync('tmux -V');
    
    // Check if tmux server is running
    try {
      await execAsync('tmux list-sessions');
      return {
        name: 'Tmux',
        status: 'ok',
        message: `${version.trim()} - Server running`,
        details: { version: version.trim(), server_running: true },
      };
    } catch {
      return {
        name: 'Tmux',
        status: 'warning',
        message: `${version.trim()} - No server running`,
        details: { version: version.trim(), server_running: false },
        fix_command: 'tmux new-session -d -s miyabi',
      };
    }
  } catch {
    return {
      name: 'Tmux',
      status: 'error',
      message: 'Tmux not installed',
      fix_command: 'apt-get install tmux || brew install tmux',
    };
  }
}

async function checkNetwork(): Promise<HealthStatus> {
  const endpoints = [
    { name: 'GitHub API', url: 'https://api.github.com' },
    { name: 'npm Registry', url: 'https://registry.npmjs.org' },
    { name: 'crates.io', url: 'https://crates.io' },
  ];
  
  const results = await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const start = Date.now();
        const response = await fetch(ep.url, { method: 'HEAD' });
        const latency = Date.now() - start;
        return { ...ep, ok: response.ok, latency };
      } catch {
        return { ...ep, ok: false, latency: -1 };
      }
    })
  );
  
  const allOk = results.every((r) => r.ok);
  const someOk = results.some((r) => r.ok);
  
  return {
    name: 'Network Connectivity',
    status: allOk ? 'ok' : someOk ? 'warning' : 'error',
    message: allOk
      ? 'All endpoints reachable'
      : `${results.filter((r) => !r.ok).map((r) => r.name).join(', ')} unreachable`,
    details: Object.fromEntries(results.map((r) => [r.name, { ok: r.ok, latency_ms: r.latency }])),
  };
}

async function checkMcpServers(): Promise<HealthStatus> {
  const mcpConfigPath = join(process.cwd(), '.mcp.json');
  
  try {
    const config = JSON.parse(await readFile(mcpConfigPath, 'utf-8'));
    const servers = Object.keys(config.mcpServers || {});
    
    // Check if server files exist
    const serverStatuses = await Promise.all(
      servers.map(async (name) => {
        const serverConfig = config.mcpServers[name];
        const args = serverConfig.args || [];
        const scriptPath = args[0];
        
        if (scriptPath) {
          try {
            await stat(scriptPath);
            return { name, exists: true };
          } catch {
            return { name, exists: false };
          }
        }
        return { name, exists: false };
      })
    );
    
    const missingServers = serverStatuses.filter((s) => !s.exists);
    
    if (missingServers.length > 0) {
      return {
        name: 'MCP Servers',
        status: 'warning',
        message: `${servers.length} configured, ${missingServers.length} missing builds`,
        details: {
          total: servers.length,
          configured: serverStatuses.filter((s) => s.exists).map((s) => s.name),
          missing: missingServers.map((s) => s.name),
        },
        fix_command: 'npm run build (in each MCP server directory)',
      };
    }
    
    return {
      name: 'MCP Servers',
      status: 'ok',
      message: `${servers.length} MCP servers configured and built`,
      details: { servers },
    };
  } catch {
    return {
      name: 'MCP Servers',
      status: 'not_configured',
      message: '.mcp.json not found or invalid',
      fix_command: 'Create .mcp.json with MCP server configurations',
    };
  }
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(checks: HealthStatus[]): HealthReport {
  const summary = {
    total: checks.length,
    ok: checks.filter((c) => c.status === 'ok').length,
    warning: checks.filter((c) => c.status === 'warning').length,
    error: checks.filter((c) => c.status === 'error').length,
    not_configured: checks.filter((c) => c.status === 'not_configured').length,
  };

  const overall_status: HealthReport['overall_status'] =
    summary.error > 0 ? 'critical' : summary.warning > 0 || summary.not_configured > 0 ? 'degraded' : 'healthy';

  const recommendations = checks
    .filter((c) => c.status !== 'ok' && c.fix_command)
    .map((c) => `**${c.name}**: \`${c.fix_command}\``);

  return {
    timestamp: new Date().toISOString(),
    overall_status,
    checks,
    summary,
    recommendations,
  };
}

function formatReport(report: HealthReport): string {
  const statusEmoji = {
    healthy: '🟢',
    degraded: '🟡',
    critical: '🔴',
  };

  const checkEmoji = {
    ok: '✅',
    warning: '⚠️',
    error: '❌',
    not_configured: '⚙️',
  };

  let output = `# 🏥 Miyabi Health Report\n\n`;
  output += `**Overall Status**: ${statusEmoji[report.overall_status]} **${report.overall_status.toUpperCase()}**\n`;
  output += `**Timestamp**: ${report.timestamp}\n\n`;

  output += `## 📊 Summary\n\n`;
  output += `| Status | Count |\n`;
  output += `|--------|-------|\n`;
  output += `| ✅ OK | ${report.summary.ok} |\n`;
  output += `| ⚠️ Warning | ${report.summary.warning} |\n`;
  output += `| ❌ Error | ${report.summary.error} |\n`;
  output += `| ⚙️ Not Configured | ${report.summary.not_configured} |\n\n`;

  output += `## 🔍 Details\n\n`;
  for (const check of report.checks) {
    output += `### ${checkEmoji[check.status]} ${check.name}\n\n`;
    output += `${check.message}\n\n`;
    if (check.fix_command) {
      output += `**Fix**: \`${check.fix_command}\`\n\n`;
    }
    if (check.fix_url) {
      output += `**More info**: ${check.fix_url}\n\n`;
    }
  }

  if (report.recommendations.length > 0) {
    output += `## 🛠️ Recommended Actions\n\n`;
    report.recommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`;
    });
  }

  return output;
}

// ============================================================================
// Server Setup
// ============================================================================

const server = new Server(
  {
    name: 'miyabi-health-check',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'health_check_full',
      description:
        'Run comprehensive health check on all Miyabi dependencies and services. Returns detailed status of Git, Rust, Node.js, GitHub, Obsidian, Tmux, Network, and MCP servers.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
    {
      name: 'health_check_quick',
      description: 'Quick health check for critical systems only (Git, GitHub, Rust). Faster than full check.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
    {
      name: 'health_check_single',
      description: 'Check a single component health status',
      inputSchema: {
        type: 'object' as const,
        properties: {
          component: {
            type: 'string',
            enum: ['git', 'rust', 'node', 'github', 'obsidian', 'tmux', 'network', 'mcp'],
            description: 'Component to check',
          },
        },
        required: ['component'],
      },
    },
    {
      name: 'health_fix_suggest',
      description: 'Get detailed fix suggestions for a specific health issue',
      inputSchema: {
        type: 'object' as const,
        properties: {
          issue: {
            type: 'string',
            description: 'The health issue to get fix suggestions for (e.g., "GITHUB_TOKEN", "cargo", "tmux")',
          },
        },
        required: ['issue'],
      },
    },
  ],
}));

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'health_check_full': {
      const checks = await Promise.all([
        checkGit(),
        checkRust(),
        checkNode(),
        checkGitHub(),
        checkObsidian(),
        checkTmux(),
        checkNetwork(),
        checkMcpServers(),
      ]);

      const report = generateReport(checks);
      return {
        content: [{ type: 'text', text: formatReport(report) }],
      };
    }

    case 'health_check_quick': {
      const checks = await Promise.all([checkGit(), checkGitHub(), checkRust()]);

      const hasError = checks.some((c) => c.status === 'error');
      const hasWarning = checks.some((c) => c.status === 'warning' || c.status === 'not_configured');

      const emoji = hasError ? '🔴' : hasWarning ? '🟡' : '🟢';
      const status = hasError ? 'Critical issues' : hasWarning ? 'Some issues' : 'All systems OK';

      let output = `${emoji} **Quick Health**: ${status}\n\n`;
      for (const check of checks) {
        const ce = { ok: '✅', warning: '⚠️', error: '❌', not_configured: '⚙️' }[check.status];
        output += `${ce} ${check.name}: ${check.message}\n`;
      }

      return {
        content: [{ type: 'text', text: output }],
      };
    }

    case 'health_check_single': {
      const component = (args as { component: string }).component;
      const checkers: Record<string, () => Promise<HealthStatus>> = {
        git: checkGit,
        rust: checkRust,
        node: checkNode,
        github: checkGitHub,
        obsidian: checkObsidian,
        tmux: checkTmux,
        network: checkNetwork,
        mcp: checkMcpServers,
      };

      const checker = checkers[component];
      if (!checker) {
        return {
          content: [{ type: 'text', text: `Unknown component: ${component}` }],
          isError: true,
        };
      }

      const result = await checker();
      const emoji = { ok: '✅', warning: '⚠️', error: '❌', not_configured: '⚙️' }[result.status];

      let output = `## ${emoji} ${result.name}\n\n`;
      output += `**Status**: ${result.status}\n`;
      output += `**Message**: ${result.message}\n\n`;

      if (result.details) {
        output += `**Details**:\n\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n\n`;
      }

      if (result.fix_command) {
        output += `**Fix Command**: \`${result.fix_command}\`\n`;
      }

      if (result.fix_url) {
        output += `**More Info**: ${result.fix_url}\n`;
      }

      return {
        content: [{ type: 'text', text: output }],
      };
    }

    case 'health_fix_suggest': {
      const issue = ((args as { issue: string }).issue || '').toLowerCase();

      const fixSuggestions: Record<string, string> = {
        github_token: `## 🔑 GitHub Token Setup

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: \`repo\`, \`read:org\`, \`workflow\`
4. Copy the token
5. Set environment variable:
   \`\`\`bash
   export GITHUB_TOKEN="your_token_here"
   \`\`\`
6. Add to shell profile (~/.bashrc or ~/.zshrc) for persistence`,

        cargo: `## 🦀 Rust/Cargo Installation

1. Install Rust using rustup:
   \`\`\`bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   \`\`\`
2. Follow the prompts (default installation recommended)
3. Restart your terminal or run:
   \`\`\`bash
   source $HOME/.cargo/env
   \`\`\`
4. Verify installation:
   \`\`\`bash
   cargo --version
   rustc --version
   \`\`\`
5. Build Miyabi:
   \`\`\`bash
   cargo build --release -p miyabi-mcp-server
   \`\`\``,

        tmux: `## 📺 Tmux Setup

### Install
- Ubuntu/Debian: \`sudo apt-get install tmux\`
- macOS: \`brew install tmux\`

### Start Server
\`\`\`bash
tmux new-session -d -s miyabi
\`\`\`

### Verify
\`\`\`bash
tmux list-sessions
\`\`\``,

        obsidian: `## 📝 Obsidian Vault Configuration

1. Install Obsidian: https://obsidian.md/download
2. Create or open a vault
3. Set environment variable:
   \`\`\`bash
   export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
   \`\`\``,
      };

      // Find matching suggestion
      const matchedKey = Object.keys(fixSuggestions).find((k) => issue.includes(k) || k.includes(issue));

      if (matchedKey) {
        return {
          content: [{ type: 'text', text: fixSuggestions[matchedKey] }],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `No specific fix found for "${issue}". Run \`health_check_full\` to see all issues and recommendations.`,
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Miyabi Health Check MCP Server running on stdio');
}

main().catch(console.error);
