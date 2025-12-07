#!/usr/bin/env node
/**
 * A2A CLI - Agent-to-Agent Communication Tool
 * ============================================
 * Main entry point for the a2a command
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

const commands = {
  bootstrap: {
    script: 'a2a_bootstrap.sh',
    description: 'Start the A2A multi-agent system',
  },
  health: {
    script: 'a2a_health.sh',
    description: 'Check health of all agents',
  },
  scale: {
    script: 'a2a_scale.sh',
    description: 'Scale workers up/down',
  },
  dashboard: {
    module: 'src/dashboard.ts',
    description: 'Launch real-time dashboard',
  },
  state: {
    module: 'src/state.ts',
    description: 'Manage system state',
  },
  router: {
    module: 'src/router.ts',
    description: 'Task routing utilities',
  },
  send: {
    description: 'Send message to agent pane',
    handler: sendMessage,
  },
};

function showHelp() {
  console.log(`
A2A - Agent-to-Agent Communication Protocol
============================================

Usage: a2a <command> [options]

Commands:
  bootstrap [--attach]     Start the A2A multi-agent system
  health [--watch]         Check health of all agents
  scale <up|down|set|auto> Scale workers dynamically
  dashboard                Launch real-time monitoring dashboard
  state <status|metrics>   Manage system state
  router <classify|route>  Task routing utilities
  send <pane> <message>    Send message to agent pane

Examples:
  a2a bootstrap --attach   # Start and attach to session
  a2a health --watch       # Continuous health monitoring
  a2a scale up 2           # Add 2 workers
  a2a send %101 "[テスト] Hello"  # Send message to conductor

Environment Variables:
  A2A_SESSION_NAME         tmux session name (default: a2a)
  MIYABI_CONDUCTOR_PANE    Conductor pane ID
  MIYABI_CODEGEN_PANE      CodeGen pane ID
  MIYABI_REVIEW_PANE       Review pane ID
  MIYABI_PR_PANE           PR pane ID
  MIYABI_DEPLOY_PANE       Deploy pane ID

Documentation: https://github.com/miyabi-dev/a2a
`);
}

function sendMessage(args) {
  const [pane, ...messageParts] = args;
  const message = messageParts.join(' ');

  if (!pane || !message) {
    console.error('Usage: a2a send <pane> <message>');
    process.exit(1);
  }

  const cmd = `tmux send-keys -t ${pane} '${message}' && sleep 0.5 && tmux send-keys -t ${pane} Enter`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Message sent to ${pane}`);
  } catch (error) {
    console.error(`❌ Failed to send message: ${error.message}`);
    process.exit(1);
  }
}

function runScript(scriptName, args) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  const child = spawn('bash', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function runModule(modulePath, args) {
  const fullPath = path.join(ROOT_DIR, modulePath);
  const child = spawn('npx', ['tsx', fullPath, ...args], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  const cmd = commands[command];

  if (!cmd) {
    console.error(`Unknown command: ${command}`);
    console.error('Run "a2a help" for usage information');
    process.exit(1);
  }

  if (cmd.script) {
    runScript(cmd.script, commandArgs);
  } else if (cmd.module) {
    runModule(cmd.module, commandArgs);
  } else if (cmd.handler) {
    cmd.handler(commandArgs);
  }
}

main();
