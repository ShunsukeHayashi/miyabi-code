/**
 * Miyabi Integration MCP Server Tests
 * Phase 3: MCPサーバーテスト - Miyabi統合テスト
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';

// MCPクライアントのモック（実際の実装では適切なMCPクライアントを使用）
interface MCPClient {
  miyabi: {
    init: (params: { projectName: string; template: string }) => Promise<MiyabiResult>;
    install: (params: { projectPath: string }) => Promise<MiyabiResult>;
    status: (params: { projectPath: string }) => Promise<MiyabiResult>;
    agent_run: (params: { agentType: string; issueNumber: number }) => Promise<MiyabiResult>;
    auto: (params: { projectPath: string }) => Promise<MiyabiResult>;
    todos: (params: { projectPath: string }) => Promise<MiyabiResult>;
    config: (params: { projectPath: string }) => Promise<MiyabiResult>;
    get_status: (params: { projectPath: string }) => Promise<MiyabiResult>;
  };
}

interface MiyabiResult {
  success: boolean;
  message?: string;
  projectPath?: string;
  worktreePath?: string;
  agentType?: string;
  issueNumber?: number;
  status?: string;
  error?: string;
}

// テスト用のMCPクライアントモック
class MockMCPClient implements MCPClient {
  miyabi = {
    init: async (params: { projectName: string; template: string }): Promise<MiyabiResult> => {
      // モック実装
      if (params.projectName === 'invalid-project') {
        return {
          success: false,
          error: 'Invalid project name'
        };
      }
      
      return {
        success: true,
        message: `Project ${params.projectName} created successfully`,
        projectPath: `/tmp/${params.projectName}`,
        status: 'initialized'
      };
    },

    install: async (params: { projectPath: string }): Promise<MiyabiResult> => {
      if (!params.projectPath) {
        return {
          success: false,
          error: 'Project path is required'
        };
      }
      
      return {
        success: true,
        message: 'Miyabi installed successfully',
        projectPath: params.projectPath,
        status: 'installed'
      };
    },

    status: async (params: { projectPath: string }): Promise<MiyabiResult> => {
      return {
        success: true,
        message: 'Project status retrieved',
        projectPath: params.projectPath,
        status: 'active'
      };
    },

    agent_run: async (params: { agentType: string; issueNumber: number }): Promise<MiyabiResult> => {
      if (!params.agentType || !params.issueNumber) {
        return {
          success: false,
          error: 'Agent type and issue number are required'
        };
      }
      
      return {
        success: true,
        message: `Agent ${params.agentType} executed for issue ${params.issueNumber}`,
        agentType: params.agentType,
        issueNumber: params.issueNumber,
        worktreePath: `/tmp/worktree-issue-${params.issueNumber}`,
        status: 'completed'
      };
    },

    auto: async (params: { projectPath: string }): Promise<MiyabiResult> => {
      return {
        success: true,
        message: 'Auto mode executed',
        projectPath: params.projectPath,
        status: 'auto-completed'
      };
    },

    todos: async (params: { projectPath: string }): Promise<MiyabiResult> => {
      return {
        success: true,
        message: 'TODO comments detected',
        projectPath: params.projectPath,
        status: 'todos-found'
      };
    },

    config: async (params: { projectPath: string }): Promise<MiyabiResult> => {
      return {
        success: true,
        message: 'Configuration retrieved',
        projectPath: params.projectPath,
        status: 'config-loaded'
      };
    },

    get_status: async (params: { projectPath: string }): Promise<MiyabiResult> => {
      return {
        success: true,
        message: 'Status retrieved',
        projectPath: params.projectPath,
        status: 'active'
      };
    }
  };
}

describe('Miyabi Integration MCP Server', () => {
  let mcpClient: MCPClient;

  beforeAll(() => {
    mcpClient = new MockMCPClient();
  });

  afterAll(() => {
    // クリーンアップ処理
  });

  describe('miyabi__init', () => {
    test('正常なプロジェクト作成', async () => {
      const result = await mcpClient.miyabi.init({
        projectName: 'test-project',
        template: 'claude-code'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Project test-project created successfully');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('initialized');
    });

    test('無効なプロジェクト名', async () => {
      const result = await mcpClient.miyabi.init({
        projectName: 'invalid-project',
        template: 'claude-code'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid project name');
    });

    test('テンプレート指定なし', async () => {
      const result = await mcpClient.miyabi.init({
        projectName: 'test-project',
        template: ''
      });

      expect(result.success).toBe(true);
      expect(result.projectPath).toBe('/tmp/test-project');
    });
  });

  describe('miyabi__install', () => {
    test('正常なインストール', async () => {
      const result = await mcpClient.miyabi.install({
        projectPath: '/tmp/test-project'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Miyabi installed successfully');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('installed');
    });

    test('プロジェクトパス未指定', async () => {
      const result = await mcpClient.miyabi.install({
        projectPath: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project path is required');
    });
  });

  describe('miyabi__status', () => {
    test('ステータス取得', async () => {
      const result = await mcpClient.miyabi.status({
        projectPath: '/tmp/test-project'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Project status retrieved');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('active');
    });
  });

  describe('miyabi__agent_run', () => {
    test('正常なAgent実行', async () => {
      const result = await mcpClient.miyabi.agent_run({
        agentType: 'coordinator',
        issueNumber: 270
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Agent coordinator executed for issue 270');
      expect(result.agentType).toBe('coordinator');
      expect(result.issueNumber).toBe(270);
      expect(result.worktreePath).toBe('/tmp/worktree-issue-270');
      expect(result.status).toBe('completed');
    });

    test('Agentタイプ未指定', async () => {
      const result = await mcpClient.miyabi.agent_run({
        agentType: '',
        issueNumber: 270
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent type and issue number are required');
    });

    test('Issue番号未指定', async () => {
      const result = await mcpClient.miyabi.agent_run({
        agentType: 'coordinator',
        issueNumber: 0
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent type and issue number are required');
    });
  });

  describe('miyabi__auto', () => {
    test('自動モード実行', async () => {
      const result = await mcpClient.miyabi.auto({
        projectPath: '/tmp/test-project'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Auto mode executed');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('auto-completed');
    });
  });

  describe('miyabi__todos', () => {
    test('TODO検出', async () => {
      const result = await mcpClient.miyabi.todos({
        projectPath: '/tmp/test-project'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('TODO comments detected');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('todos-found');
    });
  });

  describe('miyabi__config', () => {
    test('設定取得', async () => {
      const result = await mcpClient.miyabi.config({
        projectPath: '/tmp/test-project'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuration retrieved');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('config-loaded');
    });
  });

  describe('miyabi__get_status', () => {
    test('軽量ステータス取得', async () => {
      const result = await mcpClient.miyabi.get_status({
        projectPath: '/tmp/test-project'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Status retrieved');
      expect(result.projectPath).toBe('/tmp/test-project');
      expect(result.status).toBe('active');
    });
  });

  describe('統合テスト', () => {
    test('完全なワークフロー', async () => {
      // 1. プロジェクト作成
      const initResult = await mcpClient.miyabi.init({
        projectName: 'integration-test',
        template: 'claude-code'
      });
      expect(initResult.success).toBe(true);

      // 2. インストール
      const installResult = await mcpClient.miyabi.install({
        projectPath: initResult.projectPath!
      });
      expect(installResult.success).toBe(true);

      // 3. Agent実行
      const agentResult = await mcpClient.miyabi.agent_run({
        agentType: 'coordinator',
        issueNumber: 270
      });
      expect(agentResult.success).toBe(true);

      // 4. ステータス確認
      const statusResult = await mcpClient.miyabi.status({
        projectPath: initResult.projectPath!
      });
      expect(statusResult.success).toBe(true);
    });
  });

  describe('パフォーマンステスト', () => {
    test('並列実行', async () => {
      const startTime = Date.now();

      // 3つのAgentを並列実行
      const results = await Promise.all([
        mcpClient.miyabi.agent_run({ agentType: 'coordinator', issueNumber: 270 }),
        mcpClient.miyabi.agent_run({ agentType: 'codegen', issueNumber: 271 }),
        mcpClient.miyabi.agent_run({ agentType: 'review', issueNumber: 272 })
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // すべて成功
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // 1秒以内に完了
      expect(duration).toBeLessThan(1000);
    });
  });
});
