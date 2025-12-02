# 🎯 Miyabi UX Enhancement - 詳細実装計画書

**Version**: 1.0.0  
**Date**: 2025-12-01  
**Authors**: Steve Jobs Vision × Jony Ive Design × Engineering Team

---

## 📋 Executive Summary

本計画書は、Jobs/Iveの UX分析に基づき、Miyabi MCPサーバーに不足している機能を実装するための詳細な技術計画を定義する。

### 目標
1. **Zero Configuration Experience** - 設定なしで動作開始
2. **Intent-Based Interface** - 意図理解型インターフェース
3. **One-Click Workflows** - ワンクリック開発フロー
4. **Emotional Feedback** - 感情的フィードバックシステム

### 技術スタック
- **Runtime**: Node.js 20+ / Rust 1.75+
- **MCP SDK**: @modelcontextprotocol/sdk (Node.js) / rmcp 0.8.0 (Rust)
- **Workflow Engine**: miyabi-workflow (既存)
- **State Management**: sled (Rust) / SQLite (Node.js)
- **AI Integration**: Claude API / Gemini API

---

## 🏗️ アーキテクチャ設計

### 現状アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Desktop/Web                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                        │
├─────────────────────────────────────────────────────────────┤
│  miyabi-mcp (Node.js)      │  miyabi-mcp-server (Rust)      │
│  - 75 tools                │  - Agent execution              │
│  - System monitoring       │  - A2A Bridge                   │
│  - GitHub integration      │  - Session management           │
├─────────────────────────────────────────────────────────────┤
│  Specialized MCP Servers                                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ obsidian │  tmux    │  rules   │  github  │  gemini  │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Miyabi Core (Rust)                         │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ miyabi-agents│miyabi-workflow│miyabi-github │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### 提案アーキテクチャ（追加レイヤー）
```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Desktop/Web                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              🆕 UX Enhancement Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │         miyabi-ux-orchestrator (NEW)                │    │
│  │  ┌──────────┬──────────┬──────────┬──────────┐     │    │
│  │  │ Intent   │ Workflow │ Setup    │ Feedback │     │    │
│  │  │ Parser   │ Composer │ Wizard   │ Engine   │     │    │
│  │  └──────────┴──────────┴──────────┴──────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                        │
│                      (既存 - 変更なし)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Foundation（Week 1-2）

### 1.1 miyabi-health-check MCP Server

**目的**: 全依存関係の自動診断とステータス表示

**ファイル構成**:
```
mcp-servers/miyabi-health-check/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── checkers/
│   │   ├── git.ts         # Git環境チェック
│   │   ├── rust.ts        # Rust/Cargo環境チェック
│   │   ├── node.ts        # Node.js環境チェック
│   │   ├── github.ts      # GitHub認証チェック
│   │   ├── obsidian.ts    # Obsidian Vaultチェック
│   │   ├── tmux.ts        # Tmuxサーバーチェック
│   │   └── network.ts     # ネットワーク接続チェック
│   ├── reporters/
│   │   ├── console.ts     # コンソール出力
│   │   ├── json.ts        # JSON出力
│   │   └── markdown.ts    # Markdown出力
│   └── types.ts           # 型定義
└── dist/                  # ビルド出力
```

**実装コード（src/index.ts）**:
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Checker imports
import { checkGit } from './checkers/git.js';
import { checkRust } from './checkers/rust.js';
import { checkNode } from './checkers/node.js';
import { checkGitHub } from './checkers/github.js';
import { checkObsidian } from './checkers/obsidian.js';
import { checkTmux } from './checkers/tmux.js';
import { checkNetwork } from './checkers/network.js';

interface HealthStatus {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'not_configured';
  message: string;
  details?: Record<string, unknown>;
  fix_command?: string;
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

const server = new Server({
  name: 'miyabi-health-check',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

// Tool: health_check_full
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'health_check_full') {
    const checks: HealthStatus[] = await Promise.all([
      checkGit(),
      checkRust(),
      checkNode(),
      checkGitHub(),
      checkObsidian(),
      checkTmux(),
      checkNetwork(),
    ]);

    const summary = {
      total: checks.length,
      ok: checks.filter(c => c.status === 'ok').length,
      warning: checks.filter(c => c.status === 'warning').length,
      error: checks.filter(c => c.status === 'error').length,
      not_configured: checks.filter(c => c.status === 'not_configured').length,
    };

    const overall_status = 
      summary.error > 0 ? 'critical' :
      summary.warning > 0 ? 'degraded' : 'healthy';

    const recommendations = checks
      .filter(c => c.fix_command)
      .map(c => `${c.name}: ${c.fix_command}`);

    const report: HealthReport = {
      timestamp: new Date().toISOString(),
      overall_status,
      checks,
      summary,
      recommendations,
    };

    return {
      content: [{
        type: 'text',
        text: formatHealthReport(report),
      }],
    };
  }
  
  // Tool: health_check_quick
  if (request.params.name === 'health_check_quick') {
    const criticalChecks = await Promise.all([
      checkGit(),
      checkGitHub(),
      checkRust(),
    ]);
    
    const hasError = criticalChecks.some(c => c.status === 'error');
    const emoji = hasError ? '🔴' : '🟢';
    
    return {
      content: [{
        type: 'text',
        text: `${emoji} Quick Health: ${hasError ? 'Issues detected' : 'All critical systems OK'}`,
      }],
    };
  }

  // Tool: health_fix_suggest
  if (request.params.name === 'health_fix_suggest') {
    const { issue } = request.params.arguments as { issue: string };
    const fixes = await suggestFix(issue);
    return {
      content: [{
        type: 'text',
        text: fixes,
      }],
    };
  }
});

function formatHealthReport(report: HealthReport): string {
  const statusEmoji = {
    healthy: '🟢',
    degraded: '🟡', 
    critical: '🔴',
  };
  
  let output = `# Miyabi Health Report\n\n`;
  output += `**Status**: ${statusEmoji[report.overall_status]} ${report.overall_status.toUpperCase()}\n`;
  output += `**Time**: ${report.timestamp}\n\n`;
  
  output += `## Summary\n`;
  output += `- ✅ OK: ${report.summary.ok}\n`;
  output += `- ⚠️ Warning: ${report.summary.warning}\n`;
  output += `- ❌ Error: ${report.summary.error}\n`;
  output += `- ⚙️ Not Configured: ${report.summary.not_configured}\n\n`;
  
  output += `## Details\n\n`;
  for (const check of report.checks) {
    const emoji = {
      ok: '✅',
      warning: '⚠️',
      error: '❌',
      not_configured: '⚙️',
    }[check.status];
    output += `### ${emoji} ${check.name}\n`;
    output += `${check.message}\n`;
    if (check.fix_command) {
      output += `\n**Fix**: \`${check.fix_command}\`\n`;
    }
    output += '\n';
  }
  
  if (report.recommendations.length > 0) {
    output += `## Recommended Actions\n\n`;
    report.recommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`;
    });
  }
  
  return output;
}

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

**Checker実装例（src/checkers/rust.ts）**:
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import type { HealthStatus } from '../types.js';

const execAsync = promisify(exec);

export async function checkRust(): Promise<HealthStatus> {
  try {
    // Check cargo
    const { stdout: cargoVersion } = await execAsync('cargo --version');
    
    // Check rustc
    const { stdout: rustcVersion } = await execAsync('rustc --version');
    
    // Check if target binary exists
    const binaryPath = '/home/ubuntu/miyabi-private/target/release/miyabi-mcp-server';
    const { stdout: binaryExists } = await execAsync(`test -f ${binaryPath} && echo "exists"`).catch(() => ({ stdout: '' }));
    
    if (!binaryExists.includes('exists')) {
      return {
        name: 'Rust Environment',
        status: 'warning',
        message: `Rust installed (${cargoVersion.trim()}), but miyabi-mcp-server not built`,
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
      message: `Rust ready: ${cargoVersion.trim()}`,
      details: {
        cargo: cargoVersion.trim(),
        rustc: rustcVersion.trim(),
        binary_built: true,
      },
    };
  } catch (error) {
    return {
      name: 'Rust Environment',
      status: 'error',
      message: 'Rust/Cargo not installed',
      fix_command: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
    };
  }
}
```

**ツール定義**:
```typescript
// Tools list handler
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'health_check_full',
      description: 'Run comprehensive health check on all Miyabi dependencies and services',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'health_check_quick',
      description: 'Quick health check for critical systems only (Git, GitHub, Rust)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'health_fix_suggest',
      description: 'Get fix suggestions for a specific health issue',
      inputSchema: {
        type: 'object',
        properties: {
          issue: {
            type: 'string',
            description: 'The health issue to get fix suggestions for',
          },
        },
        required: ['issue'],
      },
    },
  ],
}));
```

---

### 1.2 miyabi-setup-wizard MCP Server

**目的**: 初回セットアップの対話的ウィザード

**ファイル構成**:
```
mcp-servers/miyabi-setup-wizard/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── steps/
│   │   ├── welcome.ts
│   │   ├── github-auth.ts
│   │   ├── rust-setup.ts
│   │   ├── project-config.ts
│   │   ├── obsidian-link.ts
│   │   └── complete.ts
│   ├── state.ts           # ウィザード状態管理
│   └── validators.ts      # 入力バリデーション
└── dist/
```

**主要ツール**:
```typescript
const tools = [
  {
    name: 'setup_start',
    description: 'Start the Miyabi setup wizard. Returns the first step.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'setup_next',
    description: 'Proceed to the next setup step with user input',
    inputSchema: {
      type: 'object',
      properties: {
        step_id: { type: 'string' },
        user_input: { type: 'object' },
      },
      required: ['step_id'],
    },
  },
  {
    name: 'setup_skip',
    description: 'Skip the current setup step',
    inputSchema: {
      type: 'object',
      properties: {
        step_id: { type: 'string' },
      },
      required: ['step_id'],
    },
  },
  {
    name: 'setup_status',
    description: 'Get current setup progress and status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'setup_auto',
    description: 'Attempt automatic setup with sensible defaults',
    inputSchema: { type: 'object', properties: {} },
  },
];
```

**ウィザードフロー実装**:
```typescript
interface SetupStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  check: () => Promise<boolean>;
  execute: (input: unknown) => Promise<StepResult>;
  skip?: () => Promise<void>;
}

interface StepResult {
  success: boolean;
  message: string;
  next_step?: string;
  user_action_required?: {
    prompt: string;
    input_type: 'text' | 'confirm' | 'select';
    options?: string[];
  };
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Miyabi',
    description: 'Let\'s get your development environment ready.',
    required: true,
    check: async () => true,
    execute: async () => ({
      success: true,
      message: 'Welcome! I\'ll guide you through setting up Miyabi.',
      next_step: 'github_auth',
    }),
  },
  {
    id: 'github_auth',
    title: '🔑 GitHub Authentication',
    description: 'Connect your GitHub account for issue and PR management.',
    required: true,
    check: async () => !!process.env.GITHUB_TOKEN,
    execute: async (input: { token?: string }) => {
      if (input.token) {
        // Validate token
        const isValid = await validateGitHubToken(input.token);
        if (isValid) {
          await saveEnvVar('GITHUB_TOKEN', input.token);
          return {
            success: true,
            message: '✅ GitHub connected successfully!',
            next_step: 'rust_setup',
          };
        }
        return {
          success: false,
          message: '❌ Invalid token. Please check and try again.',
          user_action_required: {
            prompt: 'Enter your GitHub Personal Access Token:',
            input_type: 'text',
          },
        };
      }
      return {
        success: false,
        message: 'GitHub token required for full functionality.',
        user_action_required: {
          prompt: 'Enter your GitHub Personal Access Token (or type "skip"):',
          input_type: 'text',
        },
      };
    },
  },
  {
    id: 'rust_setup',
    title: '🦀 Rust Environment',
    description: 'Install Rust and build Miyabi agents.',
    required: false,
    check: async () => {
      try {
        await execAsync('cargo --version');
        return true;
      } catch {
        return false;
      }
    },
    execute: async (input: { action?: 'install' | 'skip' }) => {
      if (input.action === 'install') {
        return {
          success: true,
          message: 'Installing Rust... (this may take a few minutes)',
          // Trigger background installation
        };
      }
      return {
        success: false,
        message: 'Rust is needed for advanced agent features.',
        user_action_required: {
          prompt: 'Install Rust now?',
          input_type: 'confirm',
        },
      };
    },
  },
  // ... more steps
];

async function executeSetupStep(stepId: string, input: unknown): Promise<StepResult> {
  const step = SETUP_STEPS.find(s => s.id === stepId);
  if (!step) {
    throw new Error(`Unknown step: ${stepId}`);
  }
  
  // Check if already completed
  const isComplete = await step.check();
  if (isComplete) {
    const nextStep = SETUP_STEPS[SETUP_STEPS.indexOf(step) + 1];
    return {
      success: true,
      message: `✅ ${step.title} - Already configured!`,
      next_step: nextStep?.id,
    };
  }
  
  return step.execute(input);
}
```

---

### 1.3 miyabi-auto-configure Tool

**目的**: 環境変数とトークンの自動設定支援

**実装（既存のmiyabi-mcpに追加）**:
```typescript
// mcp-servers/miyabi-mcp/src/tools/auto-configure.ts

interface ConfigItem {
  key: string;
  description: string;
  required: boolean;
  default?: string;
  validate?: (value: string) => Promise<boolean>;
  hint?: string;
}

const CONFIG_ITEMS: ConfigItem[] = [
  {
    key: 'GITHUB_TOKEN',
    description: 'GitHub Personal Access Token for API access',
    required: true,
    validate: validateGitHubToken,
    hint: 'Create at: https://github.com/settings/tokens',
  },
  {
    key: 'GEMINI_API_KEY',
    description: 'Google Gemini API key for AI features',
    required: false,
    hint: 'Get from: https://makersuite.google.com/app/apikey',
  },
  {
    key: 'OBSIDIAN_VAULT_PATH',
    description: 'Path to Obsidian vault for knowledge management',
    required: false,
    default: '~/Documents/Obsidian',
    validate: async (path) => {
      try {
        await stat(path.replace('~', homedir()));
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    key: 'MIYABI_REPO_PATH',
    description: 'Path to Miyabi repository',
    required: true,
    default: process.cwd(),
  },
];

export async function autoConfigureEnv(): Promise<{
  configured: string[];
  missing: string[];
  errors: string[];
}> {
  const results = {
    configured: [] as string[],
    missing: [] as string[],
    errors: [] as string[],
  };

  for (const item of CONFIG_ITEMS) {
    const currentValue = process.env[item.key];
    
    if (currentValue) {
      // Validate existing value
      if (item.validate) {
        const isValid = await item.validate(currentValue);
        if (!isValid) {
          results.errors.push(`${item.key}: Invalid value`);
          continue;
        }
      }
      results.configured.push(item.key);
    } else if (item.default) {
      // Use default
      process.env[item.key] = item.default;
      results.configured.push(`${item.key} (default)`);
    } else if (item.required) {
      results.missing.push(item.key);
    }
  }

  return results;
}

// Tool registration
{
  name: 'auto_configure',
  description: 'Automatically configure environment variables with sensible defaults',
  inputSchema: {
    type: 'object',
    properties: {
      interactive: {
        type: 'boolean',
        description: 'Whether to prompt for missing values',
        default: false,
      },
    },
  },
}
```

---

## 📦 Phase 2: Intelligence（Week 3-4）

### 2.1 miyabi-intent-parser MCP Server

**目的**: 自然言語からツール呼び出しへの変換

**アーキテクチャ**:
```
┌─────────────────────────────────────────────────────┐
│                  User Input                          │
│         "ログイン機能を作りたい"                      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Intent Parser                           │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Tokenization & Analysis                 │    │
│  │  2. Intent Classification                   │    │
│  │  3. Entity Extraction                       │    │
│  │  4. Workflow Mapping                        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Parsed Intent                           │
│  {                                                   │
│    "intent": "create_feature",                      │
│    "entities": {                                    │
│      "feature_name": "ログイン機能",                │
│      "feature_type": "authentication"               │
│    },                                               │
│    "suggested_workflow": "feature_development",     │
│    "tools": ["create_issue", "git_create_branch",  │
│              "execute_agent:codegen"]               │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

**実装**:
```typescript
// mcp-servers/miyabi-intent-parser/src/index.ts

import Anthropic from '@anthropic-ai/sdk';

interface ParsedIntent {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  suggested_workflow: string | null;
  tools: string[];
  clarification_needed?: string;
}

const INTENT_PATTERNS = [
  {
    pattern: /(?:作りたい|作成|追加|実装)/,
    intent: 'create_feature',
    workflow: 'feature_development',
  },
  {
    pattern: /(?:バグ|修正|直|fix)/i,
    intent: 'fix_bug',
    workflow: 'bugfix',
  },
  {
    pattern: /(?:リファクタ|改善|最適化)/,
    intent: 'refactor',
    workflow: 'refactoring',
  },
  {
    pattern: /(?:テスト|検証|確認)/,
    intent: 'test',
    workflow: 'testing',
  },
  {
    pattern: /(?:デプロイ|リリース|公開)/,
    intent: 'deploy',
    workflow: 'deployment',
  },
  {
    pattern: /(?:調べ|検索|探|確認)/,
    intent: 'search',
    workflow: null,
  },
];

const WORKFLOW_TOOL_MAPPING: Record<string, string[]> = {
  feature_development: [
    'create_issue',
    'git_create_branch',
    'execute_agent:codegen',
    'execute_agent:review',
    'create_pr',
    'execute_agent:deploy',
  ],
  bugfix: [
    'get_issue',
    'git_create_branch',
    'search_code',
    'execute_agent:codegen',
    'cargo_test',
    'create_pr',
  ],
  refactoring: [
    'search_code',
    'git_create_branch',
    'execute_agent:codegen',
    'cargo_clippy',
    'cargo_test',
    'create_pr',
  ],
  testing: [
    'cargo_test',
    'execute_agent:review',
    'list_files',
  ],
  deployment: [
    'cargo_build',
    'execute_agent:deploy',
    'health_check_full',
  ],
};

async function parseIntent(userInput: string): Promise<ParsedIntent> {
  // Step 1: Pattern matching for quick classification
  let matchedPattern = INTENT_PATTERNS.find(p => p.pattern.test(userInput));
  
  // Step 2: If no pattern match, use LLM for classification
  if (!matchedPattern) {
    const llmResult = await classifyWithLLM(userInput);
    return llmResult;
  }
  
  // Step 3: Extract entities
  const entities = await extractEntities(userInput, matchedPattern.intent);
  
  // Step 4: Map to tools
  const tools = matchedPattern.workflow 
    ? WORKFLOW_TOOL_MAPPING[matchedPattern.workflow] || []
    : [];
  
  return {
    intent: matchedPattern.intent,
    confidence: 0.85,
    entities,
    suggested_workflow: matchedPattern.workflow,
    tools,
  };
}

async function classifyWithLLM(input: string): Promise<ParsedIntent> {
  const anthropic = new Anthropic();
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You are an intent classifier for a development automation tool.
Classify the user's intent and extract relevant entities.

Available intents:
- create_feature: User wants to create a new feature
- fix_bug: User wants to fix a bug
- refactor: User wants to refactor code
- test: User wants to run tests
- deploy: User wants to deploy
- search: User wants to search for something
- other: None of the above

Respond in JSON format:
{
  "intent": "string",
  "confidence": number (0-1),
  "entities": { "feature_name"?: string, "issue_number"?: number, ... },
  "clarification_needed"?: "string if more info needed"
}`,
    messages: [{ role: 'user', content: input }],
  });
  
  const content = response.content[0];
  if (content.type === 'text') {
    const parsed = JSON.parse(content.text);
    return {
      ...parsed,
      suggested_workflow: INTENT_PATTERNS.find(p => p.intent === parsed.intent)?.workflow || null,
      tools: WORKFLOW_TOOL_MAPPING[parsed.suggested_workflow] || [],
    };
  }
  
  throw new Error('Failed to parse LLM response');
}

// Tool definition
const tools = [
  {
    name: 'parse_intent',
    description: 'Parse natural language input to understand user intent and suggest appropriate tools/workflows',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Natural language description of what the user wants to do',
        },
      },
      required: ['input'],
    },
  },
  {
    name: 'suggest_workflow',
    description: 'Get a suggested workflow based on parsed intent',
    inputSchema: {
      type: 'object',
      properties: {
        intent: { type: 'string' },
        entities: { type: 'object' },
      },
      required: ['intent'],
    },
  },
];
```

---

### 2.2 miyabi-workflow-composer

**目的**: 意図に基づいてワークフローを自動構成

**Rust実装（crates/miyabi-workflow-composer）**:
```rust
// crates/miyabi-workflow-composer/src/lib.rs

use miyabi_workflow::{WorkflowBuilder, Step, StepType};
use miyabi_types::agent::AgentType;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTemplate {
    pub name: String,
    pub description: String,
    pub steps: Vec<TemplateStep>,
    pub required_context: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateStep {
    pub id: String,
    pub agent: AgentType,
    pub parallel_with: Option<Vec<String>>,
    pub condition: Option<String>,
}

pub struct WorkflowComposer {
    templates: HashMap<String, WorkflowTemplate>,
}

impl WorkflowComposer {
    pub fn new() -> Self {
        let mut templates = HashMap::new();
        
        // Feature Development Template
        templates.insert("feature_development".to_string(), WorkflowTemplate {
            name: "Feature Development".to_string(),
            description: "End-to-end feature development workflow".to_string(),
            steps: vec![
                TemplateStep {
                    id: "analyze".to_string(),
                    agent: AgentType::IssueAgent,
                    parallel_with: None,
                    condition: None,
                },
                TemplateStep {
                    id: "implement".to_string(),
                    agent: AgentType::CodeGenAgent,
                    parallel_with: None,
                    condition: None,
                },
                TemplateStep {
                    id: "test".to_string(),
                    agent: AgentType::ReviewAgent,
                    parallel_with: Some(vec!["lint".to_string()]),
                    condition: None,
                },
                TemplateStep {
                    id: "lint".to_string(),
                    agent: AgentType::CodeGenAgent,
                    parallel_with: None,
                    condition: None,
                },
                TemplateStep {
                    id: "pr".to_string(),
                    agent: AgentType::PRAgent,
                    parallel_with: None,
                    condition: Some("test.passed && lint.passed".to_string()),
                },
                TemplateStep {
                    id: "deploy".to_string(),
                    agent: AgentType::DeploymentAgent,
                    parallel_with: None,
                    condition: Some("pr.merged".to_string()),
                },
            ],
            required_context: vec!["issue_number".to_string()],
        });
        
        // Bugfix Template
        templates.insert("bugfix".to_string(), WorkflowTemplate {
            name: "Bug Fix".to_string(),
            description: "Quick bug fix workflow".to_string(),
            steps: vec![
                TemplateStep {
                    id: "diagnose".to_string(),
                    agent: AgentType::IssueAgent,
                    parallel_with: None,
                    condition: None,
                },
                TemplateStep {
                    id: "fix".to_string(),
                    agent: AgentType::CodeGenAgent,
                    parallel_with: None,
                    condition: None,
                },
                TemplateStep {
                    id: "verify".to_string(),
                    agent: AgentType::ReviewAgent,
                    parallel_with: None,
                    condition: None,
                },
                TemplateStep {
                    id: "pr".to_string(),
                    agent: AgentType::PRAgent,
                    parallel_with: None,
                    condition: Some("verify.passed".to_string()),
                },
            ],
            required_context: vec!["issue_number".to_string()],
        });
        
        Self { templates }
    }
    
    pub fn compose(&self, template_name: &str, context: HashMap<String, Value>) -> Result<WorkflowBuilder> {
        let template = self.templates.get(template_name)
            .ok_or_else(|| anyhow!("Unknown template: {}", template_name))?;
        
        // Validate required context
        for required in &template.required_context {
            if !context.contains_key(required) {
                return Err(anyhow!("Missing required context: {}", required));
            }
        }
        
        // Build workflow
        let mut builder = WorkflowBuilder::new(&template.name);
        
        for step in &template.steps {
            if let Some(parallel_ids) = &step.parallel_with {
                // Handle parallel steps
                let parallel_steps: Vec<_> = parallel_ids.iter()
                    .filter_map(|id| template.steps.iter().find(|s| &s.id == id))
                    .map(|s| (s.id.clone(), s.agent.clone()))
                    .collect();
                
                builder = builder
                    .step(&step.id, step.agent.clone())
                    .parallel(parallel_steps);
            } else {
                builder = builder.step(&step.id, step.agent.clone());
                
                if let Some(condition) = &step.condition {
                    builder = builder.with_condition(condition);
                }
            }
        }
        
        Ok(builder)
    }
    
    pub fn list_templates(&self) -> Vec<&WorkflowTemplate> {
        self.templates.values().collect()
    }
}
```

---

### 2.3 Error Explainer

**目的**: エラーを人間にわかりやすく説明

```typescript
// mcp-servers/miyabi-mcp/src/tools/error-explainer.ts

interface ErrorExplanation {
  original_error: string;
  friendly_message: string;
  cause: string;
  solution: string[];
  related_docs?: string[];
  auto_fix_available: boolean;
  auto_fix_command?: string;
}

const ERROR_PATTERNS: {
  pattern: RegExp;
  explain: (match: RegExpMatchArray) => Partial<ErrorExplanation>;
}[] = [
  {
    pattern: /GITHUB_TOKEN not set/,
    explain: () => ({
      friendly_message: '🔑 GitHubへの接続設定が必要です',
      cause: 'GitHub Personal Access Token が設定されていません',
      solution: [
        '1. https://github.com/settings/tokens にアクセス',
        '2. "Generate new token (classic)" をクリック',
        '3. repo スコープを選択してトークンを生成',
        '4. 環境変数 GITHUB_TOKEN に設定',
      ],
      auto_fix_available: true,
      auto_fix_command: 'setup_wizard --step github_auth',
    }),
  },
  {
    pattern: /No such file or directory: 'cargo'/,
    explain: () => ({
      friendly_message: '🦀 Rust開発環境がセットアップされていません',
      cause: 'Rust/Cargo がインストールされていません',
      solution: [
        '以下のコマンドでRustをインストールできます:',
        'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      ],
      auto_fix_available: true,
      auto_fix_command: 'setup_wizard --step rust_setup',
    }),
  },
  {
    pattern: /A2A Bridge unavailable/,
    explain: () => ({
      friendly_message: '🌉 エージェント間通信ブリッジが利用できません',
      cause: 'miyabi-mcp-server バイナリがビルドされていません',
      solution: [
        'Rustプロジェクトをビルドしてください:',
        'cargo build --release -p miyabi-mcp-server',
      ],
      auto_fix_available: false,
    }),
  },
  {
    pattern: /connection refused.*(\d+)/,
    explain: (match) => ({
      friendly_message: `🔌 ポート ${match[1]} への接続ができません`,
      cause: `サービスが起動していないか、ファイアウォールでブロックされています`,
      solution: [
        `サービスの起動状態を確認してください`,
        `ポート ${match[1]} がファイアウォールで許可されているか確認`,
      ],
      auto_fix_available: false,
    }),
  },
];

export async function explainError(error: string): Promise<ErrorExplanation> {
  // Try pattern matching first
  for (const { pattern, explain } of ERROR_PATTERNS) {
    const match = error.match(pattern);
    if (match) {
      return {
        original_error: error,
        ...explain(match),
      } as ErrorExplanation;
    }
  }
  
  // Fallback to LLM explanation
  return await explainWithLLM(error);
}

async function explainWithLLM(error: string): Promise<ErrorExplanation> {
  // Use Claude to explain unknown errors
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You are a helpful error explainer. Given a technical error message,
provide a user-friendly explanation in Japanese. Include:
1. A friendly one-line summary
2. The likely cause
3. Step-by-step solutions

Respond in JSON format.`,
    messages: [{ role: 'user', content: error }],
  });
  
  // Parse and return
  const parsed = JSON.parse(response.content[0].text);
  return {
    original_error: error,
    friendly_message: parsed.summary,
    cause: parsed.cause,
    solution: parsed.solutions,
    auto_fix_available: false,
  };
}

// Tool definition
{
  name: 'explain_error',
  description: 'Get a human-friendly explanation of an error message with solutions',
  inputSchema: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'The error message to explain',
      },
    },
    required: ['error'],
  },
}
```

---

## 📦 Phase 3: Magic（Month 2-3）

### 3.1 One-Click Feature Development

**ツール: `quick_feature`**

```typescript
// mcp-servers/miyabi-magic/src/tools/quick-feature.ts

interface QuickFeatureParams {
  description: string;           // 機能の説明
  issue_title?: string;         // Issue タイトル（省略時は自動生成）
  branch_name?: string;         // ブランチ名（省略時は自動生成）
  auto_pr?: boolean;            // 自動PR作成（デフォルト: true）
  auto_deploy?: boolean;        // 自動デプロイ（デフォルト: false）
}

interface QuickFeatureResult {
  status: 'success' | 'in_progress' | 'failed';
  issue_number?: number;
  branch_name?: string;
  pr_number?: number;
  progress: {
    step: string;
    completed: boolean;
    message: string;
  }[];
  next_action?: string;
}

async function quickFeature(params: QuickFeatureParams): Promise<QuickFeatureResult> {
  const progress: QuickFeatureResult['progress'] = [];
  
  try {
    // Step 1: Create Issue
    progress.push({ step: 'create_issue', completed: false, message: 'Creating issue...' });
    const issueTitle = params.issue_title || await generateIssueTitle(params.description);
    const issue = await createGitHubIssue({
      title: issueTitle,
      body: params.description,
      labels: ['enhancement', 'auto-generated'],
    });
    progress[0] = { step: 'create_issue', completed: true, message: `Issue #${issue.number} created` };
    
    // Step 2: Create Branch
    progress.push({ step: 'create_branch', completed: false, message: 'Creating branch...' });
    const branchName = params.branch_name || `feature/issue-${issue.number}`;
    await gitCreateBranch(branchName);
    progress[1] = { step: 'create_branch', completed: true, message: `Branch ${branchName} created` };
    
    // Step 3: Execute CodeGen Agent
    progress.push({ step: 'codegen', completed: false, message: 'Generating code...' });
    const codegenResult = await executeAgent('codegen', {
      issue_number: issue.number,
      description: params.description,
    });
    progress[2] = { step: 'codegen', completed: true, message: 'Code generated' };
    
    // Step 4: Run Tests
    progress.push({ step: 'test', completed: false, message: 'Running tests...' });
    const testResult = await cargoTest();
    progress[3] = { 
      step: 'test', 
      completed: testResult.passed,
      message: testResult.passed ? 'Tests passed' : 'Tests failed',
    };
    
    if (!testResult.passed) {
      return {
        status: 'failed',
        issue_number: issue.number,
        branch_name: branchName,
        progress,
        next_action: 'Review test failures and fix issues',
      };
    }
    
    // Step 5: Create PR (if auto_pr)
    if (params.auto_pr !== false) {
      progress.push({ step: 'create_pr', completed: false, message: 'Creating PR...' });
      const pr = await createPullRequest({
        title: issueTitle,
        body: `Closes #${issue.number}\n\n${params.description}`,
        head: branchName,
        base: 'main',
      });
      progress[4] = { step: 'create_pr', completed: true, message: `PR #${pr.number} created` };
      
      return {
        status: 'success',
        issue_number: issue.number,
        branch_name: branchName,
        pr_number: pr.number,
        progress,
      };
    }
    
    return {
      status: 'success',
      issue_number: issue.number,
      branch_name: branchName,
      progress,
      next_action: 'Review changes and create PR when ready',
    };
    
  } catch (error) {
    return {
      status: 'failed',
      progress,
      next_action: `Error: ${error.message}`,
    };
  }
}

// Tool definition
{
  name: 'quick_feature',
  description: 'One-click feature development: creates issue, branch, generates code, runs tests, and creates PR',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description of the feature to implement',
      },
      issue_title: {
        type: 'string',
        description: 'Optional custom title for the GitHub issue',
      },
      branch_name: {
        type: 'string', 
        description: 'Optional custom branch name',
      },
      auto_pr: {
        type: 'boolean',
        description: 'Automatically create PR after code generation (default: true)',
        default: true,
      },
    },
    required: ['description'],
  },
}
```

### 3.2 Pipeline Status Visualization

```typescript
// mcp-servers/miyabi-magic/src/tools/pipeline-status.ts

interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  output?: string;
  error?: string;
}

interface PipelineStatus {
  id: string;
  name: string;
  overall_status: 'pending' | 'running' | 'success' | 'failed';
  stages: PipelineStage[];
  started_at: string;
  progress_percentage: number;
  eta_seconds?: number;
}

function formatPipelineStatus(pipeline: PipelineStatus): string {
  const statusEmoji = {
    pending: '⏳',
    running: '🔄',
    success: '✅',
    failed: '❌',
    skipped: '⏭️',
  };
  
  let output = `\n┌─────────────────────────────────────────────┐\n`;
  output += `│ 📊 Pipeline: ${pipeline.name.padEnd(30)}│\n`;
  output += `│ Status: ${statusEmoji[pipeline.overall_status]} ${pipeline.overall_status.padEnd(25)}│\n`;
  output += `│ Progress: ${'█'.repeat(Math.floor(pipeline.progress_percentage / 5))}${'░'.repeat(20 - Math.floor(pipeline.progress_percentage / 5))} ${pipeline.progress_percentage}% │\n`;
  output += `├─────────────────────────────────────────────┤\n`;
  
  for (const stage of pipeline.stages) {
    const emoji = statusEmoji[stage.status];
    const duration = stage.duration_ms ? `(${(stage.duration_ms / 1000).toFixed(1)}s)` : '';
    output += `│ ${emoji} ${stage.name.padEnd(25)} ${duration.padEnd(12)}│\n`;
  }
  
  output += `└─────────────────────────────────────────────┘\n`;
  
  if (pipeline.eta_seconds) {
    output += `\n⏱️ ETA: ${Math.floor(pipeline.eta_seconds / 60)}m ${pipeline.eta_seconds % 60}s\n`;
  }
  
  return output;
}
```

### 3.3 Success Celebration

```typescript
// mcp-servers/miyabi-magic/src/tools/celebration.ts

const CELEBRATION_MESSAGES = {
  feature_complete: [
    '🎉 素晴らしい！新機能が完成しました！',
    '✨ やりました！機能の実装が完了です！',
    '🚀 機能リリース準備完了！お見事です！',
  ],
  bug_fixed: [
    '🐛→✨ バグを退治しました！',
    '🔧 修正完了！システムは正常です！',
    '💪 問題解決！よくやりました！',
  ],
  tests_passed: [
    '✅ 全テストパス！品質は完璧です！',
    '🧪 テスト成功！コードは健全です！',
  ],
  pr_merged: [
    '🎊 PRがマージされました！チームに貢献！',
    '🏆 マージ完了！コードベースに追加されました！',
  ],
  deploy_success: [
    '🚀 デプロイ成功！世界に公開されました！',
    '🌍 本番環境にリリース完了！',
  ],
};

interface CelebrationResult {
  message: string;
  stats?: {
    lines_changed: number;
    files_modified: number;
    time_saved_minutes: number;
  };
  achievement?: {
    name: string;
    description: string;
    icon: string;
  };
}

async function celebrate(event: keyof typeof CELEBRATION_MESSAGES, context?: Record<string, any>): Promise<CelebrationResult> {
  const messages = CELEBRATION_MESSAGES[event];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  const result: CelebrationResult = { message };
  
  // Add stats if available
  if (context?.pr_number) {
    const prStats = await getPRStats(context.pr_number);
    result.stats = {
      lines_changed: prStats.additions + prStats.deletions,
      files_modified: prStats.changed_files,
      time_saved_minutes: estimateTimeSaved(prStats),
    };
  }
  
  // Check for achievements
  const achievement = await checkAchievements(event, context);
  if (achievement) {
    result.achievement = achievement;
  }
  
  return result;
}

// Tool definition
{
  name: 'celebrate',
  description: 'Celebrate a successful completion with encouraging messages and stats',
  inputSchema: {
    type: 'object',
    properties: {
      event: {
        type: 'string',
        enum: ['feature_complete', 'bug_fixed', 'tests_passed', 'pr_merged', 'deploy_success'],
      },
      context: {
        type: 'object',
        description: 'Additional context (pr_number, issue_number, etc.)',
      },
    },
    required: ['event'],
  },
}
```

---

## 📅 実装スケジュール

```
Week 1 (Day 1-7):
├── Day 1-2: miyabi-health-check 設計・実装
├── Day 3-4: miyabi-setup-wizard 設計・実装
├── Day 5-6: auto_configure ツール追加
└── Day 7: Phase 1 テスト・統合

Week 2 (Day 8-14):
├── Day 8-9: health-check checkers 完成
├── Day 10-11: setup-wizard steps 完成
├── Day 12-13: .mcp.json 統合
└── Day 14: Phase 1 リリース

Week 3 (Day 15-21):
├── Day 15-16: miyabi-intent-parser 設計
├── Day 17-18: intent-parser 実装
├── Day 19-20: error-explainer 実装
└── Day 21: Phase 2 中間テスト

Week 4 (Day 22-28):
├── Day 22-23: workflow-composer 設計
├── Day 24-25: workflow-composer Rust実装
├── Day 26-27: Node.js ブリッジ実装
└── Day 28: Phase 2 リリース

Month 2 (Week 5-8):
├── Week 5: quick_feature 設計・実装
├── Week 6: quick_bugfix 設計・実装
├── Week 7: pipeline-status 可視化
└── Week 8: celebration システム

Month 3 (Week 9-12):
├── Week 9: 統合テスト
├── Week 10: ドキュメント整備
├── Week 11: パフォーマンス最適化
└── Week 12: 最終リリース
```

---

## 📊 成功指標 (KPIs)

| 指標 | 現状 | 目標 | 測定方法 |
|-----|------|------|---------|
| Setup Time | 30分+ | < 5分 | 新規ユーザーテスト |
| Tool Discovery | 63個表示 | 5個以下提案 | ユーザー入力ごと |
| Error Resolution | 手動調査 | 自動提案 | エラー発生時 |
| Feature Dev Time | 数時間 | < 30分 | quick_feature使用時 |
| User Satisfaction | N/A | > 4.5/5 | ユーザーサーベイ |

---

## 🔧 技術的考慮事項

### パフォーマンス
- Intent parsing: < 500ms
- Health check: < 3s (full), < 500ms (quick)
- Workflow composition: < 100ms

### セキュリティ
- Token は環境変数経由のみ
- 自動設定時は .env.local に保存
- Sensitive data はログ出力しない

### 互換性
- Node.js 18+ / 20+
- Rust 1.75+
- MCP SDK 最新版

---

## 📁 ファイル出力先

このドキュメントを保存しました。
