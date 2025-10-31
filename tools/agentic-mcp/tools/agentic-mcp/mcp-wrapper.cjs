#!/usr/bin/env node
/**
 * Agentic Orchestration MCP Wrapper
 * Claude Code用簡易MCP実装
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// 環境変数
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PROJECT_ROOT = path.join(__dirname, '../..');

async function main() {
  const command = process.argv[2];

  console.error(`[Agentic MCP] Command: ${command || 'interactive'}`);

  // MCP Protocol対応
  if (!command || command === 'mcp') {
    await runMCPServer();
    return;
  }

  // テストモード
  if (command === 'test') {
    console.log('✅ MCP Wrapper動作確認OK');
    console.log('利用可能なAgent:');
    console.log('- CodeGenAgent');
    console.log('- ReviewAgent');
    console.log('- IssueAgent');
    console.log('- PRAgent');
    console.log('- CoordinatorAgent');
    return;
  }

  // KPI収集
  if (command === 'kpi') {
    const period = process.argv[3] || '24h';
    await execAsync(`node ${PROJECT_ROOT}/scripts/collect-metrics.cjs --period=${period}`);
    console.log('✅ KPI収集完了');
    return;
  }

  // ダッシュボード表示
  if (command === 'dashboard') {
    const dashboardPath = path.join(PROJECT_ROOT, '.ai', 'dashboard.md');
    const dashboard = await fs.readFile(dashboardPath, 'utf-8');
    console.log(dashboard);
    return;
  }
}

async function runMCPServer() {
  // 簡易MCP Server実装（stdin/stdout）
  process.stdin.on('data', async (data) => {
    try {
      const request = JSON.parse(data.toString());

      if (request.method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'agentic_kpi_collect',
                description: 'KPI収集・ダッシュボード生成',
                inputSchema: {
                  type: 'object',
                  properties: {
                    period: { type: 'string', enum: ['6h', '24h', '7d'] }
                  }
                }
              },
              {
                name: 'agentic_metrics_view',
                description: '識学理論KPIダッシュボード表示',
                inputSchema: { type: 'object', properties: {} }
              }
            ]
          }
        };

        process.stdout.write(JSON.stringify(response) + '\n');
      }

      if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;

        let result = '';

        if (name === 'agentic_kpi_collect') {
          const { stdout } = await execAsync(`node ${PROJECT_ROOT}/scripts/collect-metrics.cjs`);
          result = stdout;
        }

        if (name === 'agentic_metrics_view') {
          const dashboard = await fs.readFile(path.join(PROJECT_ROOT, '.ai', 'dashboard.md'), 'utf-8');
          result = dashboard;
        }

        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{ type: 'text', text: result }]
          }
        };

        process.stdout.write(JSON.stringify(response) + '\n');
      }

    } catch (error) {
      console.error('[MCP Error]', error);
    }
  });

  console.error('[Agentic MCP] Server started (stdio mode)');
}

main().catch(console.error);
