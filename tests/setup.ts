/**
 * Test Setup File
 * Phase 3: MCPサーバーテスト - テストセットアップ
 */

// Jest globals are available automatically

// テスト用の環境変数設定
beforeAll(() => {
  // テスト環境の設定
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  
  // MCPテスト用の環境変数
  process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'test-token';
  process.env.REPOSITORY = process.env.REPOSITORY || 'test-repo';

  // AI テスト用の環境変数
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-api-key';
  
  // テスト用のタイムアウト設定
  process.env.TEST_TIMEOUT = '30000'; // 30秒
  
  console.log('🧪 Test environment initialized');
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log(`🔧 Node version: ${process.version}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

afterAll(() => {
  console.log('🧹 Test environment cleanup completed');
});

// グローバルなテストヘルパー関数
declare global {
  var createTestIssue: () => Promise<{ number: number; title: string; body: string; labels: string[] }>;
  var createTestProject: () => Promise<{ path: string; name: string }>;
  var cleanupTestData: () => Promise<void>;
}

// テスト用のヘルパー関数
global.createTestIssue = async () => {
  return {
    number: Math.floor(Math.random() * 1000) + 100,
    title: `Test Issue ${Date.now()}`,
    body: 'This is a test issue created by the test suite',
    labels: ['type:feature', 'priority:P2-Medium', 'state:pending']
  };
};

global.createTestProject = async () => {
  const projectName = `test-project-${Date.now()}`;
  return {
    path: `/tmp/${projectName}`,
    name: projectName
  };
};

global.cleanupTestData = async () => {
  // テストデータのクリーンアップ処理
  console.log('🧹 Cleaning up test data...');
  // 実際の実装では、テストで作成したIssueやプロジェクトを削除
};

// テスト用のユーティリティ関数
export const testUtils = {
  // ランダムな文字列生成
  randomString: (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // テスト用の遅延
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // テスト用のIssueデータ生成
  generateTestIssue: (overrides: Partial<any> = {}) => {
    return {
      number: Math.floor(Math.random() * 1000) + 100,
      title: `Test Issue ${Date.now()}`,
      body: 'This is a test issue',
      labels: ['type:feature', 'priority:P2-Medium'],
      state: 'open',
      ...overrides
    };
  },
  
  // テスト用のプロジェクトデータ生成
  generateTestProject: (overrides: Partial<any> = {}) => {
    const projectName = `test-project-${Date.now()}`;
    return {
      name: projectName,
      path: `/tmp/${projectName}`,
      template: 'claude-code',
      ...overrides
    };
  },
  
  // パフォーマンス測定
  measurePerformance: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();
    return {
      result,
      duration: endTime - startTime
    };
  },
  
  // 並列実行のテスト
  testParallelExecution: async <T>(
    tasks: Array<() => Promise<T>>,
    expectedDuration?: number
  ): Promise<{ results: T[]; duration: number }> => {
    const startTime = Date.now();
    const results = await Promise.all(tasks.map(task => task()));
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (expectedDuration && duration > expectedDuration) {
      throw new Error(`Parallel execution took ${duration}ms, expected ${expectedDuration}ms`);
    }
    
    return { results, duration };
  }
};

// テスト用のモック関数
export const mockFunctions = {
  // MCPクライアントのモック
  createMockMCPClient: () => ({
    miyabi: {
      init: jest.fn().mockResolvedValue({ success: true, message: 'Mock success' }),
      agent_run: jest.fn().mockResolvedValue({ success: true, message: 'Mock success' }),
      status: jest.fn().mockResolvedValue({ success: true, message: 'Mock success' })
    },
    github: {
      create_issue: jest.fn().mockResolvedValue({ number: 123, title: 'Mock Issue' }),
      close_issue: jest.fn().mockResolvedValue({ success: true })
    },
    ide: {
      get_diagnostics: jest.fn().mockResolvedValue({ success: true, diagnostics: [] }),
      execute_code: jest.fn().mockResolvedValue({ success: true, output: 'Mock output' })
    },
    project: {
      get_dependencies: jest.fn().mockResolvedValue({ success: true, dependencies: [] }),
      get_project_structure: jest.fn().mockResolvedValue({ success: true, structure: {} })
    }
  }),
  
  // エラーのモック
  createMockError: (message: string) => new Error(message),
  
  // 成功レスポンスのモック
  createMockSuccess: (data: any = {}) => ({ success: true, ...data }),
  
  // 失敗レスポンスのモック
  createMockFailure: (error: string) => ({ success: false, error })
};

// テスト用の定数
export const testConstants = {
  // タイムアウト設定
  TIMEOUTS: {
    SHORT: 1000,      // 1秒
    MEDIUM: 5000,     // 5秒
    LONG: 30000,      // 30秒
    VERY_LONG: 300000 // 5分
  },
  
  // テスト用のデータ
  TEST_DATA: {
    ISSUE_NUMBERS: [270, 271, 272, 273, 274],
    AGENT_TYPES: ['coordinator', 'codegen', 'review', 'deployment', 'pr'],
    PROJECT_TEMPLATES: ['claude-code', 'rust-cli', 'typescript-api'],
    LABELS: ['type:feature', 'type:bug', 'type:docs', 'priority:P0-Critical', 'priority:P1-High']
  },
  
  // パフォーマンス基準
  PERFORMANCE: {
    MAX_PARALLEL_DURATION: 5000,    // 5秒
    MAX_SEQUENTIAL_DURATION: 15000, // 15秒
    MAX_COST: 0.50,                 // $0.50
    MIN_SUCCESS_RATE: 0.95          // 95%
  }
};

console.log('✅ Test setup completed');
