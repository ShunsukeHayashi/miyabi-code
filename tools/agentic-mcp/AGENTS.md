# Agentic Orchestration System - Agent仕様書

このドキュメントは、Agentic MCP Serverで利用可能な各Agentの詳細仕様を定義します。

## 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [Agent一覧](#agent一覧)
- [BaseAgent](#baseagent)
- [IssueAgent](#issueagent)
- [CodeGenAgent](#codegenagent)
- [ReviewAgent](#reviewagent)
- [PRAgent](#pragent)
- [CoordinatorAgent](#coordinatoragent)
- [DeploymentAgent](#deploymentagent)

---

## アーキテクチャ概要

### 識学理論ベースの権限設計

全Agentは識学理論に基づき、以下の権限レベルで動作します:

| 権限レベル | 説明 | 該当Agent |
|----------|------|-----------|
| 🔴 決裁権限 | タスク分解・Agent選定・最終判断 | CoordinatorAgent |
| 🔵 実行権限 | コード生成・Issue管理・PR作成 | CodeGenAgent, IssueAgent, PRAgent, DeploymentAgent |
| 🟡 確認権限 | レビュー・品質チェック・承認 | ReviewAgent |

### ワークフロー

```
Issue作成
    ↓
IssueAgent (🔵実行権限)
    ↓ ラベル付与・優先度判定
CoordinatorAgent (🔴決裁権限)
    ↓ タスク分解・DAG構築
CodeGenAgent (🔵実行権限)
    ↓ コード生成・テスト生成
ReviewAgent (🟡確認権限)
    ↓ 品質チェック・承認
PRAgent (🔵実行権限)
    ↓ PR作成
DeploymentAgent (🔵実行権限)
    ↓ デプロイ実行
```

---

## Agent一覧

| Agent | 責務 | 入力 | 出力 | GitHub Actions |
|-------|------|------|------|----------------|
| IssueAgent | Issue分析・Label付与 | Issue番号 | Label推奨・優先度 | ✅ |
| CoordinatorAgent | タスク分解・Agent選定 | Issue番号 | DAG・Agent割当 | ✅ |
| CodeGenAgent | コード生成・テスト生成 | Issue番号 | 生成コード | ✅ |
| ReviewAgent | コードレビュー・品質判定 | Issue番号 | Quality Score | ✅ |
| PRAgent | PR作成・説明文生成 | Issue番号 | PR URL | ✅ |
| DeploymentAgent | デプロイ・検証 | PR番号 | デプロイ結果 | ✅ |

---

## BaseAgent

**説明**: 全Agentの基底クラス。共通機能を提供。

### 主要機能

1. **GitHub API統合**
   - Issue/PR操作
   - Label管理
   - Comment投稿

2. **Anthropic Claude API統合**
   - プロンプト生成
   - レスポンス解析
   - エラーハンドリング

3. **ロギング・メトリクス**
   - 実行ログ記録
   - パフォーマンス計測
   - エラートラッキング

### メソッド

```typescript
class BaseAgent {
  constructor(config: AgentConfig)

  // GitHub操作
  async getIssue(issueNumber: number): Promise<Issue>
  async addLabel(issueNumber: number, labels: string[]): Promise<void>
  async createComment(issueNumber: number, body: string): Promise<void>

  // Claude API
  async callClaude(prompt: string, options?: ClaudeOptions): Promise<string>

  // ログ・メトリクス
  log(level: string, message: string, metadata?: object): void
  recordMetric(name: string, value: number, tags?: object): void
}
```

---

## IssueAgent

**説明**: GitHub Issue分析・Label自動付与Agent

### 責任範囲

- Issue内容のAI駆動分析
- 識学理論Label体系の自動付与
- 優先度・影響度の客観的判定
- 完了条件の明確性チェック

### 入力

```typescript
interface IssueAnalyzeInput {
  issue_number: number;
  title: string;
  body: string;
}
```

### 出力

```typescript
interface IssueAnalyzeOutput {
  labels: string[];           // 推奨Label
  priority: string;           // P0-緊急/P1-高/P2-中/P3-低
  impact: string;             // Critical/High/Medium/Low
  status: string;             // 00.未着手など
  ai_executable: boolean;     // AI実行可能か
  assignee_suggestion: string; // 推奨担当者
}
```

### Label体系（識学理論）

#### ステータス
- `00.未着手` - 責任者未定・作業未開始
- `01.設計中` - 要件定義・設計フェーズ
- `02.実装中` - コーディング中
- `03.レビュー中` - コードレビュー待ち
- `04.テスト中` - QAテスト中
- `05.完了` - 実装完了・クローズ

#### 優先度
- `➡️P0-緊急` - 即座対応・サービス停止レベル
- `➡️P1-高` - 24時間以内対応・重大な機能制限
- `➡️P2-中` - 1週間以内対応・一部機能制限
- `➡️P3-低` - 計画的対応・改善要望

#### 影響度
- `🔴Critical` - 全ユーザー影響・サービス停止
- `🟡High` - 主要機能影響・パフォーマンス劣化
- `🟢Medium` - 一部機能影響・回避策あり
- `⚪️Low` - マイナー・UI改善レベル

### エスカレーション

- **P0緊急Issue検出** → PM即座通知
- **Critical影響度** → テックリード + PO通知
- **AI実行不可判定** → 人間による要件明確化要求

---

## CodeGenAgent

**説明**: AI駆動コード生成・テスト自動生成Agent

### 責任範囲

- Issue要件からコード生成
- ユニットテスト自動生成
- 型定義・ドキュメント生成
- コーディング規約準拠

### 入力

```typescript
interface CodeGenInput {
  issue_number: number;
  title: string;
  description: string;
  priority: string;
}
```

### 出力

```typescript
interface CodeGenOutput {
  generated_files: {
    path: string;
    content: string;
    type: 'source' | 'test' | 'types' | 'docs';
  }[];
  quality_score: number;      // 0-100
  test_coverage: number;      // 0-100
  execution_time: number;     // seconds
}
```

### 生成戦略

1. **要件分析**
   - Issue本文を解析
   - 実装スコープ特定
   - 依存関係確認

2. **コード生成**
   - TypeScript/React コンポーネント
   - ビジネスロジック
   - 型定義

3. **テスト生成**
   - ユニットテスト (Vitest)
   - E2Eテスト (Playwright)
   - テストデータ

4. **品質保証**
   - ESLint準拠
   - 型安全性確認
   - コーディング規約チェック

---

## ReviewAgent

**説明**: 静的解析・セキュリティスキャン・品質判定Agent

### 責任範囲

- 静的解析（ESLint, TypeScript）
- セキュリティスキャン
- パフォーマンス分析
- コードレビューコメント生成

### 入力

```typescript
interface ReviewInput {
  issue_number: number;
  target_files?: string[];
}
```

### 出力

```typescript
interface ReviewOutput {
  quality_score: number;        // 0-100
  passed: boolean;              // 基準達成
  issues: {
    severity: 'error' | 'warning' | 'info';
    file: string;
    line: number;
    message: string;
    rule: string;
  }[];
  security_vulnerabilities: number;
  performance_score: number;
  recommendations: string[];
}
```

### 品質基準

| 項目 | 合格基準 |
|------|---------|
| Quality Score | ≥ 80 |
| セキュリティ脆弱性 | 0件 |
| TypeScriptエラー | 0件 |
| テストカバレッジ | ≥ 70% |
| パフォーマンススコア | ≥ 75 |

### エスカレーション

- **Quality Score < 60** → CodeGenAgentに再生成要求
- **セキュリティ脆弱性検出** → セキュリティチームに通知
- **Critical Issues** → テックリードレビュー必須

---

## PRAgent

**説明**: PR自動作成・説明文AI生成Agent

### 責任範囲

- PR自動作成
- PR説明文AI生成
- レビュアー自動割当
- リリースノート生成

### 入力

```typescript
interface PRCreateInput {
  issue_number: number;
  branch_name?: string;
}
```

### 出力

```typescript
interface PRCreateOutput {
  pr_number: number;
  pr_url: string;
  title: string;
  body: string;
  reviewers: string[];
}
```

### PR説明文フォーマット

```markdown
## Summary
<1-3 bullet points>

## Changes
- Added: ...
- Updated: ...
- Fixed: ...

## Test plan
[Bulleted markdown checklist]

## Related Issues
Closes #123

## Screenshots
(if applicable)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## CoordinatorAgent

**説明**: タスク分解（DAG構築）・Agent選定Agent

### 責任範囲

- Issue内容から実装タスク分解
- DAG（有向非巡回グラフ）構築
- 各タスクへAgent割当
- 実行順序最適化

### 入力

```typescript
interface CoordinatorInput {
  issue_number: number;
  title: string;
  description: string;
}
```

### 出力

```typescript
interface CoordinatorOutput {
  dag: {
    nodes: {
      id: string;
      task: string;
      agent: string;
      dependencies: string[];
    }[];
  };
  agents_needed: string[];
  estimated_time: number; // hours
}
```

### DAG構築アルゴリズム

1. **タスク抽出**
   - Issue要件を分析
   - 実装単位に分解
   - 依存関係特定

2. **Agent選定**
   - タスク性質に応じたAgent割当
   - 並列実行可能性判定

3. **最適化**
   - クリティカルパス特定
   - 並列化最大化

---

## DeploymentAgent

**説明**: デプロイ・検証Agent

### 責任範囲

- ステージング環境デプロイ
- 本番環境デプロイ
- ヘルスチェック
- ロールバック判定

### 入力

```typescript
interface DeploymentInput {
  pr_number: number;
  environment: 'staging' | 'production';
}
```

### 出力

```typescript
interface DeploymentOutput {
  status: 'success' | 'failed';
  deployment_url: string;
  health_check_result: boolean;
  rollback_required: boolean;
}
```

---

## 共通設定

### 環境変数

```env
GITHUB_TOKEN=          # GitHub API Token
ANTHROPIC_API_KEY=     # Claude API Key
GITHUB_REPOSITORY=     # owner/repo形式
GITHUB_REPOSITORY_PATH= # ローカルパス
```

### エラーハンドリング

全Agentは以下のエラーハンドリングを実装:

1. **Retry機能**: API失敗時3回まで再試行
2. **Fallback**: Claude API失敗時は人間にエスカレーション
3. **Logging**: 全エラーをSentryに送信

---

## パフォーマンスKPI

| Agent | 平均実行時間 | 成功率目標 |
|-------|------------|-----------|
| IssueAgent | 5秒 | 99% |
| CoordinatorAgent | 10秒 | 95% |
| CodeGenAgent | 30秒 | 90% |
| ReviewAgent | 20秒 | 98% |
| PRAgent | 15秒 | 99% |
| DeploymentAgent | 2分 | 95% |

---

## 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要
- [SETUP.md](./SETUP.md) - セットアップガイド
- [CLAUDE.md](./CLAUDE.md) - Claude Code統合ガイド

---

**🤖 Agentic Orchestration System - Powered by識学理論**
