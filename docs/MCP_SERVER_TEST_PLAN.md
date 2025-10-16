# MCPサーバーテスト計画 - Phase 3

## 📋 概要

Mac mini到着を待つ間に、MCPサーバーのテスト環境とテストケースを準備します。

## 🎯 テスト対象

### 現在動作中のMCPサーバー（5個）

| MCPサーバー | 状態 | ツール数 | テスト優先度 |
|------------|------|---------|------------|
| **miyabi-integration** | ✅ 動作確認済み | 11 | 🔴 P0 |
| **project-context** | ✅ 動作確認済み | 5 | 🟡 P2 |
| **github-enhanced** | ✅ 動作確認済み | 5 | 🔴 P0 |
| **ide-integration** | ✅ 動作確認済み | 3 | 🟡 P2 |
| **filesystem** | ✅ 外部パッケージ | 多数 | 🟢 P3 |

### 未確認のMCPサーバー（2個）

| MCPサーバー | 状態 | テスト優先度 |
|------------|------|------------|
| **image-generation** | ⚠️ 未確認 | 🟡 P2 |
| **context-engineering** | ⚠️ 未確認 | 🟢 P3 |

## 🧪 テスト環境構築

### Phase 3-1: ローカルテスト環境

#### Docker環境の準備

```dockerfile
# Dockerfile.mcp-test
FROM node:20-alpine

# Rust環境の追加
RUN apk add --no-cache rust cargo

# 作業ディレクトリ
WORKDIR /app

# 依存関係のコピー
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Rustプロジェクトのコピー
COPY Cargo.toml Cargo.lock ./
COPY crates/ ./crates/
RUN cargo build --release

# MCPサーバーのコピー
COPY .claude/mcp-servers/ ./.claude/mcp-servers/
COPY mcp-servers/ ./mcp-servers/

# テスト実行
CMD ["npm", "run", "test:mcp"]
```

#### docker-compose.yml

```yaml
version: '3.8'
services:
  mcp-test:
    build:
      context: .
      dockerfile: Dockerfile.mcp-test
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - REPOSITORY=${REPOSITORY}
      - NODE_ENV=test
    volumes:
      - ./test-results:/app/test-results
    command: ["npm", "run", "test:mcp:ci"]
```

### Phase 3-2: テストケース設計

#### 1. 単体テスト（Unit Tests）

```typescript
// tests/mcp/miyabi-integration.test.ts
describe('Miyabi Integration MCP', () => {
  test('miyabi__init - 新規プロジェクト作成', async () => {
    const result = await mcp.miyabi.init({
      projectName: 'test-project',
      template: 'claude-code'
    });
    
    expect(result.success).toBe(true);
    expect(result.projectPath).toContain('test-project');
  });

  test('miyabi__agent_run - Agent実行', async () => {
    const result = await mcp.miyabi.agent_run({
      agentType: 'coordinator',
      issueNumber: 270
    });
    
    expect(result.success).toBe(true);
    expect(result.worktreePath).toBeDefined();
  });
});
```

#### 2. 統合テスト（Integration Tests）

```typescript
// tests/mcp/integration.test.ts
describe('MCP Integration Tests', () => {
  test('Issue処理フロー - 完全自動化', async () => {
    // 1. Issue作成
    const issue = await mcp.github.create_issue({
      title: 'Test Issue for MCP',
      body: 'This is a test issue for MCP integration',
      labels: ['type:feature', 'priority:P2-Medium']
    });

    // 2. Miyabi Agent実行
    const agentResult = await mcp.miyabi.agent_run({
      agentType: 'coordinator',
      issueNumber: issue.number
    });

    // 3. 結果確認
    expect(agentResult.success).toBe(true);
    expect(agentResult.worktreePath).toBeDefined();

    // 4. クリーンアップ
    await mcp.github.close_issue(issue.number);
  });
});
```

#### 3. パフォーマンステスト

```typescript
// tests/mcp/performance.test.ts
describe('MCP Performance Tests', () => {
  test('並列実行パフォーマンス', async () => {
    const startTime = Date.now();
    
    // 3つのIssueを並列処理
    const results = await Promise.all([
      mcp.miyabi.agent_run({ agentType: 'coordinator', issueNumber: 270 }),
      mcp.miyabi.agent_run({ agentType: 'coordinator', issueNumber: 271 }),
      mcp.miyabi.agent_run({ agentType: 'coordinator', issueNumber: 272 })
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 30分以内に完了
    expect(duration).toBeLessThan(30 * 60 * 1000);
    
    // すべて成功
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

### Phase 3-3: CI/CDパイプライン統合

#### GitHub Actions Workflow

```yaml
# .github/workflows/mcp-test.yml
name: MCP Server Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  mcp-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: rustfmt, clippy
      
      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install
          cargo build --release
      
      - name: Run MCP Unit Tests
        run: npm run test:mcp:unit
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPOSITORY: ${{ github.repository }}
      
      - name: Run MCP Integration Tests
        run: npm run test:mcp:integration
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPOSITORY: ${{ github.repository }}
      
      - name: Run MCP Performance Tests
        run: npm run test:mcp:performance
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPOSITORY: ${{ github.repository }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: mcp-test-results
          path: test-results/
```

## 📊 テストメトリクス

### 成功基準

| テスト種別 | 成功基準 | 測定方法 |
|-----------|---------|---------|
| **単体テスト** | 100% パス | Jest/Vitest |
| **統合テスト** | 95% パス | 実際のIssue処理 |
| **パフォーマンス** | 30分以内完了 | 時間測定 |
| **コスト** | $0.50以内 | API使用量監視 |

### 監視ダッシュボード

```typescript
// tests/mcp/monitoring.ts
export class MCPTestMonitor {
  private metrics: {
    testCount: number;
    successCount: number;
    failureCount: number;
    totalCost: number;
    averageTime: number;
  } = {
    testCount: 0,
    successCount: 0,
    failureCount: 0,
    totalCost: 0,
    averageTime: 0
  };

  async recordTest(testName: string, result: TestResult) {
    this.metrics.testCount++;
    
    if (result.success) {
      this.metrics.successCount++;
    } else {
      this.metrics.failureCount++;
    }
    
    this.metrics.totalCost += result.cost;
    this.metrics.averageTime = 
      (this.metrics.averageTime + result.duration) / 2;
    
    // ダッシュボードに送信
    await this.sendToDashboard();
  }

  private async sendToDashboard() {
    // メトリクスを外部ダッシュボードに送信
    console.log('MCP Test Metrics:', this.metrics);
  }
}
```

## 🚀 実行計画

### Week 1: 環境構築
- [ ] Docker環境の構築
- [ ] テストスクリプトの作成
- [ ] CI/CDパイプラインの設定

### Week 2: テストケース実装
- [ ] 単体テストの実装
- [ ] 統合テストの実装
- [ ] パフォーマンステストの実装

### Week 3: 自動化と最適化
- [ ] CI/CDパイプラインの統合
- [ ] 監視ダッシュボードの実装
- [ ] テスト結果の分析と最適化

## 📝 テストシナリオ

### シナリオ1: 基本的なMCP機能テスト

```bash
# 1. Miyabi Integration MCP
npm run test:mcp -- --server=miyabi-integration

# 2. GitHub Enhanced MCP
npm run test:mcp -- --server=github-enhanced

# 3. IDE Integration MCP
npm run test:mcp -- --server=ide-integration
```

### シナリオ2: 並列実行テスト

```bash
# 3つのIssueを並列処理
npm run test:mcp -- --scenario=parallel --issues=270,271,272 --concurrency=3
```

### シナリオ3: コスト最適化テスト

```bash
# コスト監視付きテスト
npm run test:mcp -- --scenario=cost-optimization --max-cost=0.50
```

## 🔍 トラブルシューティング

### よくある問題

1. **MCPサーバー接続エラー**
   ```bash
   # 解決方法
   npm run mcp:diagnose
   npm run mcp:restart
   ```

2. **環境変数不足**
   ```bash
   # 解決方法
   export GITHUB_TOKEN=your_token
   export REPOSITORY=your_repo
   ```

3. **パフォーマンス問題**
   ```bash
   # 解決方法
   npm run test:mcp -- --profile
   ```

## 📈 期待される結果

### 成功時の状態

- ✅ 全MCPサーバーが正常動作
- ✅ 並列実行で3倍の高速化
- ✅ コストを$0.50以内に抑制
- ✅ 30分以内の処理完了

### 失敗時の対応

- ❌ MCPサーバー接続失敗 → 診断ツールで原因特定
- ❌ パフォーマンス問題 → プロファイリングで最適化
- ❌ コスト超過 → 使用量監視で削減

## 🔗 関連ドキュメント

- [MCP_INTEGRATION_REPORT.md](./MCP_INTEGRATION_REPORT.md)
- [SUMMARY_MCP_OPTIMIZATION.md](./SUMMARY_MCP_OPTIMIZATION.md)
- [CLAUDE_HEADLESS_MODE.md](./CLAUDE_HEADLESS_MODE.md)

---

**次のステップ**: Mac mini到着後、実際のテスト環境で検証を開始します。
