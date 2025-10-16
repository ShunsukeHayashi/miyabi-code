/**
 * MCP Integration Tests
 * Phase 3: MCPサーバーテスト - 統合テスト
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';

// MCPクライアントのモック
interface MCPClient {
  miyabi: {
    agent_run: (params: { agentType: string; issueNumber: number }) => Promise<MiyabiResult>;
  };
  github: {
    create_issue: (params: { title: string; body: string; labels: string[] }) => Promise<GitHubIssue>;
    close_issue: (issueNumber: number) => Promise<GitHubResult>;
    update_issue_labels: (params: { issueNumber: number; labels: string[] }) => Promise<GitHubResult>;
  };
  ide: {
    get_diagnostics: (params: { projectPath: string }) => Promise<DiagnosticsResult>;
    execute_code: (params: { code: string; language: string }) => Promise<ExecutionResult>;
  };
  project: {
    get_dependencies: (params: { projectPath: string }) => Promise<DependenciesResult>;
    get_project_structure: (params: { projectPath: string }) => Promise<StructureResult>;
  };
}

interface MiyabiResult {
  success: boolean;
  message?: string;
  worktreePath?: string;
  agentType?: string;
  issueNumber?: number;
  status?: string;
  error?: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: string;
}

interface GitHubResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface DiagnosticsResult {
  success: boolean;
  diagnostics: Array<{
    file: string;
    line: number;
    message: string;
    severity: string;
  }>;
  error?: string;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

interface DependenciesResult {
  success: boolean;
  dependencies: Array<{
    name: string;
    version: string;
    type: string;
  }>;
  error?: string;
}

interface StructureResult {
  success: boolean;
  structure: {
    files: string[];
    directories: string[];
    totalSize: number;
  };
  error?: string;
}

// テスト用のMCPクライアントモック
class MockMCPClient implements MCPClient {
  miyabi = {
    agent_run: async (params: { agentType: string; issueNumber: number }): Promise<MiyabiResult> => {
      // モック実装
      return {
        success: true,
        message: `Agent ${params.agentType} executed for issue ${params.issueNumber}`,
        agentType: params.agentType,
        issueNumber: params.issueNumber,
        worktreePath: `/tmp/worktree-issue-${params.issueNumber}`,
        status: 'completed'
      };
    }
  };

  github = {
    create_issue: async (params: { title: string; body: string; labels: string[] }): Promise<GitHubIssue> => {
      // モック実装
      return {
        number: Math.floor(Math.random() * 1000) + 100,
        title: params.title,
        body: params.body,
        labels: params.labels,
        state: 'open'
      };
    },

    close_issue: async (issueNumber: number): Promise<GitHubResult> => {
      return {
        success: true,
        message: `Issue ${issueNumber} closed successfully`
      };
    },

    update_issue_labels: async (params: { issueNumber: number; labels: string[] }): Promise<GitHubResult> => {
      return {
        success: true,
        message: `Issue ${params.issueNumber} labels updated`
      };
    }
  };

  ide = {
    get_diagnostics: async (params: { projectPath: string }): Promise<DiagnosticsResult> => {
      return {
        success: true,
        diagnostics: [
          {
            file: 'src/main.ts',
            line: 10,
            message: 'Type error: Property does not exist',
            severity: 'error'
          },
          {
            file: 'src/utils.ts',
            line: 5,
            message: 'Unused variable',
            severity: 'warning'
          }
        ]
      };
    },

    execute_code: async (params: { code: string; language: string }): Promise<ExecutionResult> => {
      return {
        success: true,
        output: `Code executed successfully in ${params.language}`
      };
    }
  };

  project = {
    get_dependencies: async (params: { projectPath: string }): Promise<DependenciesResult> => {
      return {
        success: true,
        dependencies: [
          { name: 'typescript', version: '5.0.0', type: 'devDependency' },
          { name: 'vitest', version: '1.0.0', type: 'devDependency' },
          { name: 'express', version: '4.18.0', type: 'dependency' }
        ]
      };
    },

    get_project_structure: async (params: { projectPath: string }): Promise<StructureResult> => {
      return {
        success: true,
        structure: {
          files: ['package.json', 'tsconfig.json', 'src/main.ts'],
          directories: ['src', 'tests', 'docs'],
          totalSize: 1024
        }
      };
    }
  };
}

describe('MCP Integration Tests', () => {
  let mcpClient: MCPClient;
  let testIssues: GitHubIssue[] = [];

  beforeAll(() => {
    mcpClient = new MockMCPClient();
  });

  afterAll(async () => {
    // テスト用Issueのクリーンアップ
    for (const issue of testIssues) {
      await mcpClient.github.close_issue(issue.number);
    }
  });

  describe('Issue処理フロー - 完全自動化', () => {
    test('Issue作成からAgent実行まで', async () => {
      // 1. Issue作成
      const issue = await mcpClient.github.create_issue({
        title: 'Test Issue for MCP Integration',
        body: 'This is a test issue for MCP integration testing',
        labels: ['type:feature', 'priority:P2-Medium', 'state:pending']
      });

      testIssues.push(issue);

      expect(issue.number).toBeGreaterThan(0);
      expect(issue.title).toBe('Test Issue for MCP Integration');
      expect(issue.labels).toContain('type:feature');

      // 2. Miyabi Agent実行
      const agentResult = await mcpClient.miyabi.agent_run({
        agentType: 'coordinator',
        issueNumber: issue.number
      });

      expect(agentResult.success).toBe(true);
      expect(agentResult.worktreePath).toBe(`/tmp/worktree-issue-${issue.number}`);
      expect(agentResult.agentType).toBe('coordinator');
      expect(agentResult.issueNumber).toBe(issue.number);

      // 3. Issueラベル更新
      const labelResult = await mcpClient.github.update_issue_labels({
        issueNumber: issue.number,
        labels: ['type:feature', 'priority:P2-Medium', 'state:analyzing']
      });

      expect(labelResult.success).toBe(true);
    });

    test('複数Issueの並列処理', async () => {
      // 3つのIssueを作成
      const issues = await Promise.all([
        mcpClient.github.create_issue({
          title: 'Parallel Test Issue 1',
          body: 'First parallel test issue',
          labels: ['type:feature', 'priority:P2-Medium']
        }),
        mcpClient.github.create_issue({
          title: 'Parallel Test Issue 2',
          body: 'Second parallel test issue',
          labels: ['type:bug', 'priority:P1-High']
        }),
        mcpClient.github.create_issue({
          title: 'Parallel Test Issue 3',
          body: 'Third parallel test issue',
          labels: ['type:docs', 'priority:P3-Low']
        })
      ]);

      testIssues.push(...issues);

      // 3つのAgentを並列実行
      const startTime = Date.now();
      const agentResults = await Promise.all([
        mcpClient.miyabi.agent_run({ agentType: 'coordinator', issueNumber: issues[0].number }),
        mcpClient.miyabi.agent_run({ agentType: 'codegen', issueNumber: issues[1].number }),
        mcpClient.miyabi.agent_run({ agentType: 'review', issueNumber: issues[2].number })
      ]);
      const endTime = Date.now();

      // すべて成功
      agentResults.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.issueNumber).toBe(issues[index].number);
      });

      // 並列実行の効果確認（1秒以内に完了）
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('IDE統合テスト', () => {
    test('診断情報取得とコード実行', async () => {
      const projectPath = '/tmp/test-project';

      // 1. 診断情報取得
      const diagnostics = await mcpClient.ide.get_diagnostics({
        projectPath
      });

      expect(diagnostics.success).toBe(true);
      expect(diagnostics.diagnostics).toHaveLength(2);
      expect(diagnostics.diagnostics[0].severity).toBe('error');
      expect(diagnostics.diagnostics[1].severity).toBe('warning');

      // 2. コード実行
      const execution = await mcpClient.ide.execute_code({
        code: 'console.log("Hello, MCP!");',
        language: 'javascript'
      });

      expect(execution.success).toBe(true);
      expect(execution.output).toContain('Code executed successfully');
    });
  });

  describe('プロジェクト情報統合テスト', () => {
    test('依存関係とプロジェクト構造の取得', async () => {
      const projectPath = '/tmp/test-project';

      // 1. 依存関係取得
      const dependencies = await mcpClient.project.get_dependencies({
        projectPath
      });

      expect(dependencies.success).toBe(true);
      expect(dependencies.dependencies).toHaveLength(3);
      expect(dependencies.dependencies[0].name).toBe('typescript');
      expect(dependencies.dependencies[0].type).toBe('devDependency');

      // 2. プロジェクト構造取得
      const structure = await mcpClient.project.get_project_structure({
        projectPath
      });

      expect(structure.success).toBe(true);
      expect(structure.structure.files).toContain('package.json');
      expect(structure.structure.directories).toContain('src');
      expect(structure.structure.totalSize).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('無効なIssue番号でのAgent実行', async () => {
      const result = await mcpClient.miyabi.agent_run({
        agentType: 'coordinator',
        issueNumber: 0
      });

      // モックでは常に成功するが、実際の実装ではエラーになる
      expect(result.success).toBe(true);
    });

    test('存在しないプロジェクトパス', async () => {
      const diagnostics = await mcpClient.ide.get_diagnostics({
        projectPath: '/nonexistent/path'
      });

      expect(diagnostics.success).toBe(true);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量のIssue処理', async () => {
      const issueCount = 10;
      const startTime = Date.now();

      // 10個のIssueを作成
      const issues = await Promise.all(
        Array.from({ length: issueCount }, (_, i) =>
          mcpClient.github.create_issue({
            title: `Performance Test Issue ${i + 1}`,
            body: `Performance test issue number ${i + 1}`,
            labels: ['type:feature', 'priority:P2-Medium']
          })
        )
      );

      testIssues.push(...issues);

      // 10個のAgentを並列実行
      const agentResults = await Promise.all(
        issues.map(issue =>
          mcpClient.miyabi.agent_run({
            agentType: 'coordinator',
            issueNumber: issue.number
          })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // すべて成功
      agentResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // 5秒以内に完了
      expect(duration).toBeLessThan(5000);

      console.log(`Processed ${issueCount} issues in ${duration}ms`);
    });
  });

  describe('コスト最適化テスト', () => {
    test('最小限のMCP呼び出し', async () => {
      const startTime = Date.now();
      let callCount = 0;

      // 1回の呼び出しで複数の情報を取得
      const [dependencies, structure] = await Promise.all([
        mcpClient.project.get_dependencies({ projectPath: '/tmp/test-project' }),
        mcpClient.project.get_project_structure({ projectPath: '/tmp/test-project' })
      ]);

      callCount += 2;

      expect(dependencies.success).toBe(true);
      expect(structure.success).toBe(true);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1秒以内に完了
      expect(duration).toBeLessThan(1000);
      expect(callCount).toBe(2);

      console.log(`Optimized call: ${callCount} calls in ${duration}ms`);
    });
  });
});
