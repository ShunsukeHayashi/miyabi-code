#!/usr/bin/env node
/**
 * Miyabi MCP - All-in-One Monitoring and Control Server
 *
 * Includes 75 tools across 9 categories:
 * - Git Inspector (10 tools)
 * - Tmux Monitor (9 tools)
 * - Log Aggregator (6 tools)
 * - Resource Monitor (8 tools)
 * - Network Inspector (8 tools)
 * - Process Inspector (8 tools)
 * - File Watcher (6 tools)
 * - Claude Code Monitor (8 tools)
 * - GitHub Integration (12 tools)
 */
import { simpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// ========== Environment Configuration ==========
const MIYABI_REPO_PATH = process.env.MIYABI_REPO_PATH || '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private';
const MIYABI_LOG_DIR = process.env.MIYABI_LOG_DIR || MIYABI_REPO_PATH;
const MIYABI_WATCH_DIR = process.env.MIYABI_WATCH_DIR || MIYABI_REPO_PATH;
const CLAUDE_CONFIG_DIR = join(homedir(), 'Library/Application Support/Claude');
const CLAUDE_CONFIG_FILE = join(CLAUDE_CONFIG_DIR, 'claude_desktop_config.json');
const CLAUDE_LOGS_DIR = join(homedir(), 'Library/Logs/Claude');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_DEFAULT_OWNER = process.env.GITHUB_DEFAULT_OWNER || '';
const GITHUB_DEFAULT_REPO = process.env.GITHUB_DEFAULT_REPO || '';
// ========== Initialize Clients ==========
const git = simpleGit(MIYABI_REPO_PATH);
const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;
//# sourceMappingURL=index.js.map