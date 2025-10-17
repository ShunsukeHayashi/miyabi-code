import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テスト環境設定
    environment: 'node',
    
    // テストファイルのパターン
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    
    // 除外パターン
    exclude: [
      'node_modules/**',
      'target/**',
      'dist/**'
    ],
    
    // タイムアウト設定（30分）
    testTimeout: 30 * 60 * 1000,
    
    // 並列実行設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4
      }
    },
    
    // レポーター設定
    reporter: ['verbose', 'json'],
    outputFile: {
      json: 'test-results/results.json'
    },
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'test-results/coverage',
      include: [
        'src/**/*.ts',
        'crates/**/*.rs'
      ],
      exclude: [
        'node_modules/**',
        'target/**',
        'dist/**',
        'tests/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // グローバル設定
    globals: true,
    
    // セットアップファイル
    setupFiles: ['tests/setup.ts'],
    
    // 環境変数
    env: {
      NODE_ENV: 'test',
      TEST_MODE: 'true'
    }
  }
});