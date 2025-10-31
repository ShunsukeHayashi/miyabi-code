#!/usr/bin/env node
/**
 * Agentic Orchestration MCP Server
 * Claude Code用MCP Tool実装
 *
 * Note: MCP Server requires CommonJS, so require() is necessary here
 * eslint-disable @typescript-eslint/no-require-imports
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
/* eslint-enable @typescript-eslint/no-require-imports */

import type { Tool } from '@modelcontextprotocol/sdk/types';

// Agent execution via child_process
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * MCP Tools定義
 */
const TOOLS: Tool[] = [
  {
    name: 'agentic_codegen_execute',
    description: 'CodeGenAgent実行 - AI駆動コード生成・テスト自動生成',
    inputSchema: {
      type: 'object',
      properties: {
        issue_number: {
          type: 'number',
          description: 'GitHub Issue番号'
        },
        title: {
          type: 'string',
          description: 'タスクタイトル'
        },
        description: {
          type: 'string',
          description: 'タスク詳細'
        },
        priority: {
          type: 'string',
          enum: ['P0-緊急', 'P1-高', 'P2-中', 'P3-低'],
          description: '優先度'
        }
      },
      required: ['issue_number', 'title', 'description']
    }
  },
  {
    name: 'agentic_review_execute',
    description: 'ReviewAgent実行 - 静的解析・セキュリティスキャン・品質判定',
    inputSchema: {
      type: 'object',
      properties: {
        issue_number: {
          type: 'number',
          description: 'GitHub Issue番号'
        },
        target_files: {
          type: 'array',
          items: { type: 'string' },
          description: 'レビュー対象ファイルパス'
        }
      },
      required: ['issue_number']
    }
  },
  {
    name: 'agentic_issue_analyze',
    description: 'IssueAgent実行 - Issue内容AI分析・Label自動付与',
    inputSchema: {
      type: 'object',
      properties: {
        issue_number: {
          type: 'number',
          description: 'GitHub Issue番号'
        },
        title: {
          type: 'string',
          description: 'Issue タイトル'
        },
        body: {
          type: 'string',
          description: 'Issue 本文'
        }
      },
      required: ['issue_number', 'title', 'body']
    }
  },
  {
    name: 'agentic_pr_create',
    description: 'PRAgent実行 - PR自動作成・説明文AI生成',
    inputSchema: {
      type: 'object',
      properties: {
        issue_number: {
          type: 'number',
          description: 'GitHub Issue番号'
        },
        branch_name: {
          type: 'string',
          description: 'ブランチ名（オプション）'
        }
      },
      required: ['issue_number']
    }
  },
  {
    name: 'agentic_coordinator_decompose',
    description: 'CoordinatorAgent実行 - タスク分解（DAG構築）・Agent選定',
    inputSchema: {
      type: 'object',
      properties: {
        issue_number: {
          type: 'number',
          description: 'GitHub Issue番号'
        },
        title: {
          type: 'string',
          description: 'タスクタイトル'
        },
        description: {
          type: 'string',
          description: 'タスク詳細'
        }
      },
      required: ['issue_number', 'title', 'description']
    }
  },
  {
    name: 'agentic_kpi_collect',
    description: 'KPI収集・ダッシュボード生成',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['6h', '24h', '7d', '30d'],
          description: '集計期間'
        }
      }
    }
  },
  {
    name: 'agentic_metrics_view',
    description: '識学理論KPIダッシュボード表示',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * MCP Server
 */
class AgenticMCPServer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: any; // Server instance from MCP SDK

  constructor() {
    this.server = new Server(
      {
        name: 'agentic-orchestration-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
    this.initializeAgents();
  }

  /**
   * Agent初期化（スタブ実装 - GitHub Actions経由で実行）
   */
  private initializeAgents(): void {
    const githubToken = process.env.GITHUB_TOKEN || '';
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!githubToken || !anthropicApiKey) {
      console.error('[WARNING] GITHUB_TOKEN and ANTHROPIC_API_KEY required');
    }

    // Agents are executed via npm scripts and GitHub Actions
    // Not directly instantiated in MCP Server
    console.error('[MCP Server] Initialized - Agents run via GitHub Actions');
  }

  /**
   * MCP Handlers設定
   */
  private setupHandlers(): void {
    // List Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS
    }));

    // Call Tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'agentic_codegen_execute':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await this.handleCodeGenExecute(args as any);

          case 'agentic_review_execute':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await this.handleReviewExecute(args as any);

          case 'agentic_issue_analyze':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await this.handleIssueAnalyze(args as any);

          case 'agentic_pr_create':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await this.handlePRCreate(args as any);

          case 'agentic_coordinator_decompose':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await this.handleCoordinatorDecompose(args as any);

          case 'agentic_kpi_collect':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await this.handleKPICollect(args as any);

          case 'agentic_metrics_view':
            return await this.handleMetricsView();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${err.message}\n\n${err.stack}`
            }
          ]
        };
      }
    });
  }

  /**
   * CodeGenAgent実行（GitHub Actions経由）
   */
  private async handleCodeGenExecute(args: {
    issue_number: number;
    title: string;
    description: string;
    priority?: string;
  }) {
    try {
      // Trigger GitHub Actions workflow
      await execAsync(
        `gh workflow run agentic-system.yml -f agent=codegen -f issue_number=${args.issue_number}`,
        { cwd: process.env.GITHUB_REPOSITORY_PATH || process.cwd() }
      );

      return {
        content: [
          {
            type: 'text',
            text: `## 🤖 CodeGenAgent起動

**Issue**: #${args.issue_number}
**Title**: ${args.title}
**Priority**: ${args.priority || 'P2-中'}

✅ GitHub Actionsワークフローを起動しました

進捗は Issue #${args.issue_number} で確認できます
Workflow: https://github.com/${process.env.GITHUB_REPOSITORY}/actions`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}\n\nGitHub CLIとワークフローファイルを確認してください`
          }
        ]
      };
    }
  }

  /**
   * ReviewAgent実行（GitHub Actions経由）
   */
  private async handleReviewExecute(args: {
    issue_number: number;
    target_files?: string[];
  }) {
    try {
      const filesParam = args.target_files ? ` -f files="${args.target_files.join(',')}"` : '';
      await execAsync(
        `gh workflow run agentic-system.yml -f agent=review -f issue_number=${args.issue_number}${filesParam}`,
        { cwd: process.env.GITHUB_REPOSITORY_PATH || process.cwd() }
      );

      return {
        content: [
          {
            type: 'text',
            text: `## 👥 ReviewAgent起動

**Issue**: #${args.issue_number}
${args.target_files ? `**対象ファイル**: ${args.target_files.join(', ')}` : '**対象**: すべてのファイル'}

✅ GitHub Actionsワークフローを起動しました

レビュー結果は Issue #${args.issue_number} で確認できます`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  /**
   * IssueAgent実行（GitHub Actions経由）
   */
  private async handleIssueAnalyze(args: {
    issue_number: number;
    title: string;
    body: string;
  }) {
    try {
      await execAsync(
        `gh workflow run agentic-system.yml -f agent=issue -f issue_number=${args.issue_number}`,
        { cwd: process.env.GITHUB_REPOSITORY_PATH || process.cwd() }
      );

      return {
        content: [
          {
            type: 'text',
            text: `## 📝 IssueAgent起動

**Issue**: #${args.issue_number}
**Title**: ${args.title}

✅ Issue分析ワークフローを起動しました

分析結果（Label自動付与）は Issue #${args.issue_number} で確認できます`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  /**
   * PRAgent実行（GitHub Actions経由）
   */
  private async handlePRCreate(args: {
    issue_number: number;
    branch_name?: string;
  }) {
    try {
      const branchParam = args.branch_name ? ` -f branch="${args.branch_name}"` : '';
      await execAsync(
        `gh workflow run agentic-system.yml -f agent=pr -f issue_number=${args.issue_number}${branchParam}`,
        { cwd: process.env.GITHUB_REPOSITORY_PATH || process.cwd() }
      );

      return {
        content: [
          {
            type: 'text',
            text: `## 🔀 PRAgent起動

**Issue**: #${args.issue_number}
${args.branch_name ? `**Branch**: ${args.branch_name}` : '**Branch**: feature/issue-${args.issue_number}'}

✅ PR作成ワークフローを起動しました

作成されたPRは Issue #${args.issue_number} にリンクされます`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  /**
   * CoordinatorAgent実行（GitHub Actions経由）
   */
  private async handleCoordinatorDecompose(args: {
    issue_number: number;
    title: string;
    description: string;
  }) {
    try {
      await execAsync(
        `gh workflow run agentic-system.yml -f agent=coordinator -f issue_number=${args.issue_number}`,
        { cwd: process.env.GITHUB_REPOSITORY_PATH || process.cwd() }
      );

      return {
        content: [
          {
            type: 'text',
            text: `## 🎯 CoordinatorAgent起動

**Issue**: #${args.issue_number}
**Title**: ${args.title}

✅ タスク分解ワークフローを起動しました

分解されたサブタスクは Issue #${args.issue_number} のコメントで確認できます`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  /**
   * KPI収集実行
   */
  private async handleKPICollect(args: { period?: string }) {
    const period = args.period || '24h';

    // プロジェクトルートディレクトリを取得（agentic-mcpの2階層上）
    const projectRoot = process.env.GITHUB_REPOSITORY_PATH || '../../';

    const { stdout } = await execAsync(
      `node ${projectRoot}/scripts/collect-metrics.cjs --period=${period}`,
      { cwd: projectRoot }
    );

    return {
      content: [
        {
          type: 'text',
          text: `## 📊 KPI収集完了

**期間**: ${period}

${stdout}`
        }
      ]
    };
  }

  /**
   * ダッシュボード表示
   */
  private async handleMetricsView() {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const dashboardPath = path.join(process.cwd(), '.ai', 'dashboard.md');
      const dashboard = await fs.readFile(dashboardPath, 'utf-8');

      return {
        content: [
          {
            type: 'text',
            text: dashboard
          }
        ]
      };
    } catch {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ ダッシュボードファイルが見つかりません。\n\n実行: `npm run dashboard:update`'
          }
        ]
      };
    }
  }

  /**
   * Server起動
   */
  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('[INFO] Agentic Orchestration MCP Server started');
    console.error('Available tools:', TOOLS.length);
  }
}

// Server起動
const server = new AgenticMCPServer();
server.start().catch(console.error);
