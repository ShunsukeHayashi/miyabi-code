---
name: Testing Framework Workflow
description: Comprehensive testing workflow supporting Vitest, Jest, Playwright, and Cargo test. Use when running tests, debugging test failures, or implementing new test coverage across multiple tech stacks.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🧪 Testing Framework Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: 包括的テスト戦略と実行最適化

---

## 📋 概要

Miyabiエコシステムの多技術スタック対応テストワークフロー。
品質保証、自動テスト、継続的インテグレーションを統合管理します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| テスト実行 | "run tests", "test this feature" |
| 特定フレームワーク | "vitest", "jest", "playwright", "cargo test" |
| テスト種別 | "unit tests", "e2e tests", "integration" |
| デバッグ | "test failing", "debug test", "test error" |
| カバレッジ | "test coverage", "coverage report" |
| CI/CD | "before commit", "pipeline tests" |

---

## 🔧 P1: テストフレームワーク構成

### プロジェクト別テスト構成

| Project | Framework | Test Types | Coverage Tool | Config |
|---------|-----------|------------|---------------|--------|
| **MCP Bundle** | Vitest | Unit, Integration | c8 | `vitest.config.ts` |
| **AI Course SaaS** | Jest | Unit, API | Jest | `jest.config.js` |
| **Gen-Studio** | Vitest | Unit, E2E | c8 | `vitest.config.ts` |
| **CCG** | Vitest | Unit, E2E | c8 | `vitest.config.ts` |
| **Miyabi Private** | Playwright | E2E, Visual | Playwright | `playwright.config.ts` |
| **Rust Crates** | Cargo | Unit, Doc, Integration | cargo-tarpaulin | `Cargo.toml` |

### 共通コマンド体系

```bash
# プロジェクト統一コマンド
npm test              # メインテスト実行
npm run test:watch    # Watch mode
npm run test:coverage # カバレッジ付き
npm run test:ui       # UI mode (Vitest)
npm run test:e2e      # E2Eテスト

# Rust
cargo test            # 全テスト
cargo test --doc      # ドキュメントテスト
cargo tarpaulin       # カバレッジ
```

---

## 🚀 P2: フレームワーク別最適化

### Pattern 1: Vitest (MCP Bundle, Gen-Studio, CCG)

```bash
# Vitest高速実行フロー（30s-2min）
npm run test -- --run --coverage
```

**設定例**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        'src/types/**'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
})
```

**テストパターン**:

```typescript
// src/__tests__/mcp-tools.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MCPServer } from '../mcp-server'

describe('MCP Tools', () => {
  let server: MCPServer

  beforeEach(() => {
    server = new MCPServer()
  })

  it('should list available tools', async () => {
    const tools = await server.listTools()
    expect(tools).toHaveLength(172)
    expect(tools[0]).toHaveProperty('name')
  })

  it('should execute git commands', async () => {
    const result = await server.executeTool('git_status')
    expect(result.success).toBe(true)
  })
})
```

### Pattern 2: Jest (AI Course SaaS)

```bash
# Jest実行フロー（1-3min）
npm test -- --coverage --watchAll=false
```

**設定例**:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

**APIテスト例**:

```typescript
// src/__tests__/api/auth.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/auth/signin'

describe('/api/auth/signin', () => {
  it('should authenticate valid user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toHaveProperty('token')
  })
})
```

### Pattern 3: Playwright E2E (Miyabi Private)

```bash
# Playwright E2Eフロー（3-10min）
npx playwright test --headed --project=chromium
```

**設定例**:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
})
```

**E2Eテスト例**:

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display agent status', async ({ page }) => {
    await expect(page.locator('[data-testid="agent-status"]')).toBeVisible()

    const agentCount = await page.locator('.agent-card').count()
    expect(agentCount).toBeGreaterThan(0)
  })

  test('should create new agent', async ({ page }) => {
    await page.click('[data-testid="create-agent-btn"]')
    await page.fill('#agent-name', 'Test Agent')
    await page.selectOption('#agent-type', 'CodeGen')
    await page.click('[data-testid="save-agent"]')

    await expect(page.locator('text=Agent created successfully')).toBeVisible()
  })
})
```

### Pattern 4: Cargo Test (Rust Crates)

```bash
# Rustテストフロー（2-5min）
cargo test --workspace --all-features && \
cargo test --doc && \
cargo tarpaulin --out Html
```

**テスト例**:

```rust
// crates/miyabi-core/src/agent.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;

    #[tokio::test]
    async fn test_agent_creation() {
        let agent = Agent::new("TestAgent", AgentType::CodeGen);
        assert_eq!(agent.name(), "TestAgent");
        assert_eq!(agent.status(), AgentStatus::Ready);
    }

    #[tokio::test]
    async fn test_agent_execution() {
        let mut agent = Agent::new("TestAgent", AgentType::CodeGen);
        let result = agent.execute("test task").await;

        assert!(result.is_ok());
        assert_eq!(agent.status(), AgentStatus::Completed);
    }
}

// ドキュメントテスト
/// # Examples
///
/// ```
/// use miyabi_core::Agent;
///
/// let agent = Agent::new("MyAgent", AgentType::CodeGen);
/// assert_eq!(agent.name(), "MyAgent");
/// ```
pub struct Agent {
    // ...
}
```

---

## ⚡ P3: 高度なテスト戦略

### テストピラミッド

```
        E2E Tests (10%)
     ┌─────────────────┐
    │   Playwright     │
   └───────────────────┘
      Integration Tests (20%)
   ┌─────────────────────┐
  │  API, Component     │
 └───────────────────────┘
    Unit Tests (70%)
 ┌─────────────────────────┐
│  Functions, Classes     │
└─────────────────────────┘
```

### 並列テスト実行

```bash
# プロジェクト別並列テスト（5-8min）
(cd 01-miyabi/_mcp/miyabi-mcp-bundle && npm test) &
(cd 02-ai-course/saas-platform && npm test) &
(cd 03-products/Gen-Studio && npm test) &
(cd crates && cargo test --workspace) &

wait  # 全テスト完了まで待機
```

### 継続的テスト監視

```bash
# Watch modeでの開発フロー
function test_watch_all() {
    tmux new-session -d -s test-watchers

    # MCP Bundle
    tmux new-window -t test-watchers:1 -n mcp-tests
    tmux send-keys -t test-watchers:1 'cd miyabi-mcp-bundle && npm run test:watch' Enter

    # SaaS Platform
    tmux new-window -t test-watchers:2 -n saas-tests
    tmux send-keys -t test-watchers:2 'cd saas-platform && npm run test:watch' Enter

    # Gen-Studio
    tmux new-window -t test-watchers:3 -n studio-tests
    tmux send-keys -t test-watchers:3 'cd Gen-Studio && npm run test:watch' Enter

    echo "Test watchers started in tmux session 'test-watchers'"
}
```

### カバレッジ統合

```bash
# 全プロジェクトカバレッジ統合
function generate_coverage_report() {
    echo "📊 Generating Coverage Report..."

    # TypeScript projects
    find ~/dev -name "coverage" -type d | while read coverage_dir; do
        project=$(dirname "$coverage_dir" | xargs basename)
        echo "=== $project ==="

        if [ -f "$coverage_dir/lcov.info" ]; then
            lcov --summary "$coverage_dir/lcov.info"
        fi
    done

    # Rust projects
    cd ~/dev/01-miyabi/_core/miyabi-private/crates
    cargo tarpaulin --out Stdout | grep "Coverage Results"

    echo "✅ Coverage report complete"
}
```

---

## 📊 品質ゲートとメトリクス

### 品質基準

| メトリック | 目標値 | 必須レベル |
|-----------|--------|----------|
| **Unit Test Coverage** | > 80% | > 70% |
| **Integration Coverage** | > 60% | > 50% |
| **E2E Critical Path** | 100% | 100% |
| **Test Suite実行時間** | < 5min | < 10min |
| **Flaky Test Rate** | < 2% | < 5% |

### 品質ゲート

```bash
# コミット前品質チェック
function pre_commit_quality_gate() {
    echo "🚨 Quality Gate Check"

    # 1. 全ユニットテスト
    echo "Running unit tests..."
    npm test -- --run --coverage || exit 1

    # 2. カバレッジ閾値チェック
    echo "Checking coverage..."
    if ! npm run test:coverage | grep -q "All files.*80"; then
        echo "❌ Coverage below 80%"
        exit 1
    fi

    # 3. E2Eクリティカルパス
    echo "Running critical E2E tests..."
    npx playwright test --grep "@critical" || exit 1

    # 4. Rustテスト
    if [ -d "crates" ]; then
        echo "Running Rust tests..."
        cargo test --workspace || exit 1
    fi

    echo "✅ Quality gate passed"
}
```

### CI/CD統合

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [mcp-bundle, saas-platform, gen-studio]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Run tests
        run: |
          cd ${{ matrix.project }}
          npm ci
          npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Run E2E
        run: |
          npx playwright install
          npx playwright test

  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
      - name: Run Rust tests
        run: cargo test --workspace
```

---

## 🛡️ トラブルシューティング

### 共通問題パターン

| 問題 | フレームワーク | 原因 | 対処 |
|------|-------------|------|------|
| Timeout | Vitest/Jest | 非同期処理長時間化 | `testTimeout`増加 |
| Memory Leak | Jest | 大量テストファイル | `--maxWorkers=50%` |
| Flaky Test | Playwright | 非同期タイミング | `await expect().toBeVisible()` |
| Import Error | Vitest | モジュール解決失敗 | `vitest.config.ts` paths設定 |
| Coverage Gap | 全般 | テスト未カバー | `collectCoverageFrom`調整 |

### デバッグワークフロー

```bash
# テスト詳細デバッグ
function debug_test_failure() {
    local test_pattern=$1

    echo "🔍 Debugging test: $test_pattern"

    # 1. 詳細ログ付き実行
    DEBUG=* npm test -- --reporter=verbose "$test_pattern"

    # 2. 単一テストファイル実行
    npm test -- --run --reporter=verbose "$test_pattern"

    # 3. UIモードでデバッグ
    npm run test:ui -- "$test_pattern"

    # 4. カバレッジ詳細
    npm run test:coverage -- "$test_pattern"
}
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| **全テスト通過** | 100% pass rate |
| **カバレッジ** | Unit >80%, Integration >60% |
| **実行時間** | Full suite < 5min |
| **Flaky率** | < 2% |
| **並列実行** | 効率的リソース使用 |

### 出力フォーマット

```
🧪 Testing Framework Results

✅ Unit Tests: XXX/XXX passed (XX.X% coverage)
✅ Integration: XX/XX passed (XX.X% coverage)
✅ E2E Tests: XX/XX passed (critical paths ✓)
✅ Rust Tests: XXX/XXX passed (doc tests ✓)
✅ Quality Gate: All checks passed
✅ Execution Time: X.Xmin (target: <5min)

All tests passing ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `tests/README.md` | テスト戦略ドキュメント |
| `coverage/index.html` | カバレッジレポート |
| `playwright-report/` | E2Eテストレポート |

---

## 📝 関連Skills

- **TDD Workflow**: Test-Driven Development統合
- **Frontend Framework**: UI/コンポーネントテスト
- **Database Management**: DBテスト統合
- **CI/CD Pipeline**: 自動テスト実行
- **Debugging Troubleshooting**: テスト失敗デバッグ