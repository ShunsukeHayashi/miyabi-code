import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    // テスト環境設定
    environment: 'node',
    // テストファイルのパターン
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    // 除外パターン
    exclude: ['node_modules/**', 'target/**', 'dist/**'],
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
      include: ['src/**/*.ts', 'crates/**/*.rs'],
      exclude: ['node_modules/**', 'target/**', 'dist/**', 'tests/**'],
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
    },
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['miyabi-dashboard/.storybook/vitest.setup.ts']
      }
    }]
  }
});