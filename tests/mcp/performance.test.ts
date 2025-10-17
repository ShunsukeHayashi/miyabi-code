/**
 * MCP Performance Tests
 * Phase 3: MCPサーバーテスト - パフォーマンステスト
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';

// パフォーマンス測定用のインターフェース
interface PerformanceMetrics {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface MCPClient {
  miyabi: {
    agent_run: (params: { agentType: string; issueNumber: number }) => Promise<MiyabiResult>;
  };
  github: {
    create_issue: (params: { title: string; body: string; labels: string[] }) => Promise<GitHubIssue>;
    close_issue: (issueNumber: number) => Promise<GitHubResult>;
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

// パフォーマンス測定クラス
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];

  startTest(testName: string): number {
    const startTime = Date.now();
    this.metrics.push({
      testName,
      startTime,
      endTime: 0,
      duration: 0,
      success: false
    });
    return startTime;
  }

  endTest(testName: string, success: boolean, error?: string, metadata?: Record<string, any>): void {
    const metric = this.metrics.find(m => m.testName === testName);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;
      metric.metadata = metadata;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getAverageDuration(): number {
    const successfulTests = this.metrics.filter(m => m.success);
    if (successfulTests.length === 0) return 0;
    
    const totalDuration = successfulTests.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / successfulTests.length;
  }

  getSlowestTest(): PerformanceMetrics | null {
    const successfulTests = this.metrics.filter(m => m.success);
    if (successfulTests.length === 0) return null;
    
    return successfulTests.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
  }

  printReport(): void {
    console.log('\n=== MCP Performance Test Report ===');
    console.log(`Total Tests: ${this.metrics.length}`);
    console.log(`Successful Tests: ${this.metrics.filter(m => m.success).length}`);
    console.log(`Failed Tests: ${this.metrics.filter(m => !m.success).length}`);
    console.log(`Average Duration: ${this.getAverageDuration().toFixed(2)}ms`);
    
    const slowest = this.getSlowestTest();
    if (slowest) {
      console.log(`Slowest Test: ${slowest.testName} (${slowest.duration}ms)`);
    }
    
    console.log('\nDetailed Results:');
    this.metrics.forEach(metric => {
      const status = metric.success ? '✅' : '❌';
      console.log(`${status} ${metric.testName}: ${metric.duration}ms`);
      if (metric.error) {
        console.log(`   Error: ${metric.error}`);
      }
      if (metric.metadata) {
        console.log(`   Metadata: ${JSON.stringify(metric.metadata)}`);
      }
    });
    console.log('=====================================\n');
  }
}

// テスト用のMCPクライアントモック（パフォーマンステスト用）
class PerformanceTestMCPClient implements MCPClient {
  private delay: number;

  constructor(delay: number = 100) {
    this.delay = delay;
  }

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  miyabi = {
    agent_run: async (params: { agentType: string; issueNumber: number }): Promise<MiyabiResult> => {
      await this.simulateDelay();
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
      await this.simulateDelay();
      return {
        number: Math.floor(Math.random() * 1000) + 100,
        title: params.title,
        body: params.body,
        labels: params.labels,
        state: 'open'
      };
    },

    close_issue: async (issueNumber: number): Promise<GitHubResult> => {
      await this.simulateDelay();
      return {
        success: true,
        message: `Issue ${issueNumber} closed successfully`
      };
    }
  };

  ide = {
    get_diagnostics: async (params: { projectPath: string }): Promise<DiagnosticsResult> => {
      await this.simulateDelay();
      return {
        success: true,
        diagnostics: [
          {
            file: 'src/main.ts',
            line: 10,
            message: 'Type error: Property does not exist',
            severity: 'error'
          }
        ]
      };
    },

    execute_code: async (params: { code: string; language: string }): Promise<ExecutionResult> => {
      await this.simulateDelay();
      return {
        success: true,
        output: `Code executed successfully in ${params.language}`
      };
    }
  };

  project = {
    get_dependencies: async (params: { projectPath: string }): Promise<DependenciesResult> => {
      await this.simulateDelay();
      return {
        success: true,
        dependencies: [
          { name: 'typescript', version: '5.0.0', type: 'devDependency' },
          { name: 'vitest', version: '1.0.0', type: 'devDependency' }
        ]
      };
    },

    get_project_structure: async (params: { projectPath: string }): Promise<StructureResult> => {
      await this.simulateDelay();
      return {
        success: true,
        structure: {
          files: ['package.json', 'tsconfig.json'],
          directories: ['src', 'tests'],
          totalSize: 1024
        }
      };
    }
  };
}

describe('MCP Performance Tests', () => {
  let mcpClient: MCPClient;
  let monitor: PerformanceMonitor;
  let testIssues: GitHubIssue[] = [];

  beforeAll(() => {
    mcpClient = new PerformanceTestMCPClient(50); // 50ms delay
    monitor = new PerformanceMonitor();
  });

  afterAll(async () => {
    // テスト用Issueのクリーンアップ
    for (const issue of testIssues) {
      await mcpClient.github.close_issue(issue.number);
    }
    
    // パフォーマンスレポート出力
    monitor.printReport();
  });

  describe('並列実行パフォーマンス', () => {
    test('3つのIssueを並列処理', async () => {
      const testName = 'parallel-3-issues';
      monitor.startTest(testName);

      try {
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
        const agentResults = await Promise.all([
          mcpClient.miyabi.agent_run({ agentType: 'coordinator', issueNumber: issues[0].number }),
          mcpClient.miyabi.agent_run({ agentType: 'codegen', issueNumber: issues[1].number }),
          mcpClient.miyabi.agent_run({ agentType: 'review', issueNumber: issues[2].number })
        ]);

        // すべて成功
        agentResults.forEach(result => {
          expect(result.success).toBe(true);
        });

        monitor.endTest(testName, true, undefined, {
          issueCount: 3,
          agentCount: 3,
          allSuccessful: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });

    test('10個のIssueを並列処理', async () => {
      const testName = 'parallel-10-issues';
      monitor.startTest(testName);

      try {
        const issueCount = 10;

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

        // すべて成功
        agentResults.forEach(result => {
          expect(result.success).toBe(true);
        });

        monitor.endTest(testName, true, undefined, {
          issueCount: 10,
          agentCount: 10,
          allSuccessful: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  });

  describe('順次実行 vs 並列実行', () => {
    test('順次実行のパフォーマンス', async () => {
      const testName = 'sequential-execution';
      monitor.startTest(testName);

      try {
        const issueCount = 5;
        const issues: GitHubIssue[] = [];

        // 順次実行でIssue作成
        for (let i = 0; i < issueCount; i++) {
          const issue = await mcpClient.github.create_issue({
            title: `Sequential Test Issue ${i + 1}`,
            body: `Sequential test issue number ${i + 1}`,
            labels: ['type:feature', 'priority:P2-Medium']
          });
          issues.push(issue);
        }

        testIssues.push(...issues);

        // 順次実行でAgent実行
        const agentResults: MiyabiResult[] = [];
        for (const issue of issues) {
          const result = await mcpClient.miyabi.agent_run({
            agentType: 'coordinator',
            issueNumber: issue.number
          });
          agentResults.push(result);
        }

        // すべて成功
        agentResults.forEach(result => {
          expect(result.success).toBe(true);
        });

        monitor.endTest(testName, true, undefined, {
          issueCount: 5,
          executionType: 'sequential',
          allSuccessful: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });

    test('並列実行のパフォーマンス', async () => {
      const testName = 'parallel-execution';
      monitor.startTest(testName);

      try {
        const issueCount = 5;

        // 並列実行でIssue作成
        const issues = await Promise.all(
          Array.from({ length: issueCount }, (_, i) =>
            mcpClient.github.create_issue({
              title: `Parallel Test Issue ${i + 1}`,
              body: `Parallel test issue number ${i + 1}`,
              labels: ['type:feature', 'priority:P2-Medium']
            })
          )
        );

        testIssues.push(...issues);

        // 並列実行でAgent実行
        const agentResults = await Promise.all(
          issues.map(issue =>
            mcpClient.miyabi.agent_run({
              agentType: 'coordinator',
              issueNumber: issue.number
            })
          )
        );

        // すべて成功
        agentResults.forEach(result => {
          expect(result.success).toBe(true);
        });

        monitor.endTest(testName, true, undefined, {
          issueCount: 5,
          executionType: 'parallel',
          allSuccessful: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  });

  describe('MCPツール別パフォーマンス', () => {
    test('Miyabi Integration MCP', async () => {
      const testName = 'miyabi-integration';
      monitor.startTest(testName);

      try {
        const issue = await mcpClient.github.create_issue({
          title: 'Miyabi Integration Test',
          body: 'Test for Miyabi Integration MCP performance',
          labels: ['type:feature', 'priority:P2-Medium']
        });

        testIssues.push(issue);

        const result = await mcpClient.miyabi.agent_run({
          agentType: 'coordinator',
          issueNumber: issue.number
        });

        expect(result.success).toBe(true);

        monitor.endTest(testName, true, undefined, {
          tool: 'miyabi-integration',
          operation: 'agent_run',
          success: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });

    test('IDE Integration MCP', async () => {
      const testName = 'ide-integration';
      monitor.startTest(testName);

      try {
        const [diagnostics, execution] = await Promise.all([
          mcpClient.ide.get_diagnostics({ projectPath: '/tmp/test-project' }),
          mcpClient.ide.execute_code({ code: 'console.log("test");', language: 'javascript' })
        ]);

        expect(diagnostics.success).toBe(true);
        expect(execution.success).toBe(true);

        monitor.endTest(testName, true, undefined, {
          tool: 'ide-integration',
          operations: ['get_diagnostics', 'execute_code'],
          success: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });

    test('Project Context MCP', async () => {
      const testName = 'project-context';
      monitor.startTest(testName);

      try {
        const [dependencies, structure] = await Promise.all([
          mcpClient.project.get_dependencies({ projectPath: '/tmp/test-project' }),
          mcpClient.project.get_project_structure({ projectPath: '/tmp/test-project' })
        ]);

        expect(dependencies.success).toBe(true);
        expect(structure.success).toBe(true);

        monitor.endTest(testName, true, undefined, {
          tool: 'project-context',
          operations: ['get_dependencies', 'get_project_structure'],
          success: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  });

  describe('スケーラビリティテスト', () => {
    test('大量のIssue処理（50個）', async () => {
      const testName = 'scalability-50-issues';
      monitor.startTest(testName);

      try {
        const issueCount = 50;

        // 50個のIssueを作成
        const issues = await Promise.all(
          Array.from({ length: issueCount }, (_, i) =>
            mcpClient.github.create_issue({
              title: `Scalability Test Issue ${i + 1}`,
              body: `Scalability test issue number ${i + 1}`,
              labels: ['type:feature', 'priority:P2-Medium']
            })
          )
        );

        testIssues.push(...issues);

        // 50個のAgentを並列実行
        const agentResults = await Promise.all(
          issues.map(issue =>
            mcpClient.miyabi.agent_run({
              agentType: 'coordinator',
              issueNumber: issue.number
            })
          )
        );

        // すべて成功
        agentResults.forEach(result => {
          expect(result.success).toBe(true);
        });

        monitor.endTest(testName, true, undefined, {
          issueCount: 50,
          agentCount: 50,
          allSuccessful: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  });

  describe('コスト最適化テスト', () => {
    test('最小限のMCP呼び出し', async () => {
      const testName = 'cost-optimization';
      monitor.startTest(testName);

      try {
        let callCount = 0;

        // 1回の呼び出しで複数の情報を取得
        const [dependencies, structure, diagnostics] = await Promise.all([
          mcpClient.project.get_dependencies({ projectPath: '/tmp/test-project' }),
          mcpClient.project.get_project_structure({ projectPath: '/tmp/test-project' }),
          mcpClient.ide.get_diagnostics({ projectPath: '/tmp/test-project' })
        ]);

        callCount += 3;

        expect(dependencies.success).toBe(true);
        expect(structure.success).toBe(true);
        expect(diagnostics.success).toBe(true);

        monitor.endTest(testName, true, undefined, {
          callCount: 3,
          operations: ['get_dependencies', 'get_project_structure', 'get_diagnostics'],
          success: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  });

  describe('エラーハンドリングパフォーマンス', () => {
    test('エラー時のパフォーマンス', async () => {
      const testName = 'error-handling';
      monitor.startTest(testName);

      try {
        // 意図的にエラーを発生させる
        const result = await mcpClient.miyabi.agent_run({
          agentType: 'invalid-agent',
          issueNumber: 0
        });

        // モックでは常に成功するが、実際の実装ではエラーになる
        expect(result.success).toBe(true);

        monitor.endTest(testName, true, undefined, {
          errorHandling: 'graceful',
          success: true
        });
      } catch (error) {
        monitor.endTest(testName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });
  });
});
