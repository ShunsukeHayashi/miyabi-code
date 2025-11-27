# Sub-Agent 呼び出し実例集

**Version**: 1.0.0  
**Last Updated**: 2025-11-27  
**Purpose**: Claude Code Sub-agentの具体的な呼び出し例とパターン

---

## 🎯 クイックスタート

### 最も簡単な呼び出し例

```yaml
# Claude Code内でTask toolを使用
Tool: Task
Parameters:
  description: "認証バグの修正"
  prompt: "Issue #123の認証バグを修正するコードを生成してください"
  subagent_type: "CodeGenAgent"
```

---

## 📋 呼び出しパターン別実例

### パターン1: 単独エージェント呼び出し

#### 1-1. コード生成（つくるん）

```yaml
# TypeScriptでREST APIを実装
Tool: Task
Parameters:
  description: "REST API実装"
  prompt: |
    以下の要件でREST APIを実装してください：
    - エンドポイント: /api/users
    - メソッド: GET, POST, PUT, DELETE
    - TypeScript + Express
    - 認証: JWT
    - バリデーション: zod
    - テストコード付き
  subagent_type: "CodeGenAgent"
```

#### 1-2. コードレビュー（めだまん）

```yaml
# PR #456のセキュリティレビュー
Tool: Task
Parameters:
  description: "セキュリティ重視のコードレビュー"
  prompt: |
    PR #456のコードをセキュリティ観点でレビューしてください：
    - SQLインジェクション対策
    - XSS対策
    - 認証・認可の実装
    - 機密情報の扱い
    - 100点満点で採点
  subagent_type: "ReviewAgent"
```

#### 1-3. Issue分析（みつけるん）

```yaml
# 新規Issueの自動分類
Tool: Task
Parameters:
  description: "Issue自動分類とラベリング"
  prompt: |
    Issue #789を分析してください：
    - 適切なラベル提案（type, priority, component）
    - 優先度判定（P0-P3）
    - 関連Issue検索
    - 担当者推奨
    - 想定工数見積もり
  subagent_type: "IssueAgent"
```

---

### パターン2: 連携実行（Sequential）

#### 2-1. 機能実装フロー

```yaml
# Step 1: Issue分析
Tool: Task
Parameters:
  description: "Issue分析"
  prompt: "Issue #1000の要件を分析し、実装方針を提案してください"
  subagent_type: "IssueAgent"

# Step 2: タスク分解
Tool: Task
Parameters:
  description: "タスク分解と計画"
  prompt: "Issue #1000を実装可能なタスクに分解し、実行計画を作成してください"
  subagent_type: "CoordinatorAgent"

# Step 3: コード実装
Tool: Task
Parameters:
  description: "機能実装"
  prompt: "分解されたタスクに基づいて、Issue #1000の機能を実装してください"
  subagent_type: "CodeGenAgent"

# Step 4: 品質保証
Tool: Task
Parameters:
  description: "コード品質チェック"
  prompt: "実装されたコードの品質をチェックし、改善点を指摘してください"
  subagent_type: "ReviewAgent"

# Step 5: PR作成
Tool: Task
Parameters:
  description: "PR作成と説明"
  prompt: "レビュー済みのコードでPRを作成し、変更内容を説明してください"
  subagent_type: "PRAgent"
```

#### 2-2. コンテンツ制作フロー

```yaml
# Step 1: 市場調査
Tool: Task
Parameters:
  description: "コンテンツテーマの市場調査"
  prompt: "AI開発ツールに関する市場トレンドと競合コンテンツを調査してください"
  subagent_type: "MarketResearchAgent"

# Step 2: ペルソナ定義
Tool: Task
Parameters:
  description: "ターゲットペルソナ作成"
  prompt: "AI開発ツールに興味を持つ3つのペルソナを作成してください"
  subagent_type: "PersonaAgent"

# Step 3: コンテンツ作成
Tool: Task
Parameters:
  description: "ブログ記事作成"
  prompt: |
    調査結果とペルソナに基づいて、以下の記事を作成してください：
    - タイトル: 「2025年版 AI開発ツール完全ガイド」
    - 文字数: 3000文字
    - SEO最適化
    - 実例とコード例を含む
  subagent_type: "ContentCreationAgent"

# Step 4: 画像生成
Tool: Task
Parameters:
  description: "記事用画像生成"
  prompt: "作成された記事に適したアイキャッチ画像と図解を生成してください"
  subagent_type: "ImageGenAgent"
```

---

### パターン3: 並列実行（Parallel）

#### 3-1. マルチIssue同時処理

```yaml
# 3つのIssueを並列処理
parallel_tasks:
  - Tool: Task
    Parameters:
      description: "Issue #101のバグ修正"
      prompt: "Issue #101の認証バグを修正してください"
      subagent_type: "CodeGenAgent"
      
  - Tool: Task
    Parameters:
      description: "Issue #102の新機能実装"
      prompt: "Issue #102のダッシュボード機能を実装してください"
      subagent_type: "CodeGenAgent"
      
  - Tool: Task
    Parameters:
      description: "Issue #103のリファクタリング"
      prompt: "Issue #103のデータベース層をリファクタリングしてください"
      subagent_type: "CodeGenAgent"
```

#### 3-2. マーケティングキャンペーン一斉展開

```yaml
# 複数チャネル同時展開
parallel_tasks:
  - Tool: Task
    Parameters:
      description: "ブログ記事作成"
      prompt: |
        新製品ローンチのブログ記事を作成：
        - 製品名: Miyabi AI Platform
        - ターゲット: 開発者
        - 3000文字、技術的詳細を含む
      subagent_type: "ContentCreationAgent"
      
  - Tool: Task
    Parameters:
      description: "note記事作成"
      prompt: |
        感動的なローンチストーリーをnote記事として作成：
        - 開発秘話
        - チームの想い
        - ユーザーへのメッセージ
      subagent_type: "NoteAgent"
      
  - Tool: Task
    Parameters:
      description: "SNS投稿計画"
      prompt: |
        ローンチ週の SNS投稿計画：
        - Twitter: 1日3投稿
        - LinkedIn: 1日1投稿
        - ハッシュタグ戦略
      subagent_type: "SNSStrategyAgent"
      
  - Tool: Task
    Parameters:
      description: "YouTube動画企画"
      prompt: |
        製品デモ動画の企画：
        - 10分程度
        - 開発者向けチュートリアル
        - 実装例を含む
      subagent_type: "YouTubeAgent"
```

---

### パターン4: 高度な連携パターン

#### 4-1. ビジネスプラン包括作成

```yaml
# AIEntrepreneurAgentが全体を統括
Tool: Task
Parameters:
  description: "SaaSビジネスプラン作成"
  prompt: |
    AI開発支援SaaSのビジネスプランを作成してください：
    
    製品概要：
    - 名称: Miyabi Cloud IDE
    - ターゲット: エンタープライズ開発チーム
    - 価格帯: $99-999/月
    
    以下の8ステップで包括的に：
    1. 市場調査（規模、成長率、トレンド）
    2. 競合分析（20社以上）
    3. ペルソナ定義（3-5個）
    4. 製品設計（MVP定義）
    5. ビジネスモデル（収益構造）
    6. マーケティング戦略
    7. 組織計画（採用計画）
    8. 財務計画（3年分）
  subagent_type: "AIEntrepreneurAgent"
```

#### 4-2. 製品ローンチ完全自動化

```yaml
# CoordinatorAgentによる複雑なタスク調整
Tool: Task
Parameters:
  description: "v2.0ローンチの完全自動化"
  prompt: |
    Miyabi v2.0のローンチを自動化してください：
    
    必要なタスク：
    1. リリースノート作成
    2. ドキュメント更新
    3. マーケティング素材作成
    4. デモ動画作成
    5. プレスリリース作成
    6. SNSキャンペーン準備
    7. 顧客向けメール作成
    8. 技術ブログ執筆
    9. デプロイ準備
    10. モニタリング設定
    
    これらを適切に分解し、並列実行可能なものは同時に、
    依存関係があるものは順次実行してください。
  subagent_type: "CoordinatorAgent"
```

---

## 🎯 実践的なTips

### 1. プロンプトの書き方

**良い例**:
```yaml
prompt: |
  Issue #123の認証バグを修正してください：
  - 問題: ログイン後30分でセッションが切れる
  - 期待動作: 24時間セッション維持
  - 技術スタック: Next.js + NextAuth
  - テストケースも作成
```

**悪い例**:
```yaml
prompt: "バグを直して"  # 具体性がない
```

### 2. エージェントの組み合わせ

**効果的な組み合わせ**:
- `IssueAgent` → `CoordinatorAgent` → `CodeGenAgent`
- `MarketResearchAgent` + `PersonaAgent` → `ProductConceptAgent`
- `ContentCreationAgent` + `ImageGenAgent` + `NoteAgent`

### 3. エラーハンドリング

```yaml
# フォールバック戦略を含む
Tool: Task
Parameters:
  description: "コード生成（エラー対策込み）"
  prompt: |
    Issue #456を実装してください。
    もし実装が困難な場合は：
    1. 技術的課題を明確に説明
    2. 代替案を3つ提示
    3. 推奨する解決策を提案
  subagent_type: "CodeGenAgent"
```

---

## 📊 使用統計とパフォーマンス

### よく使われるエージェントTOP5

1. **CodeGenAgent** (つくるん) - 35%
2. **ReviewAgent** (めだまん) - 20%
3. **IssueAgent** (みつけるん) - 15%
4. **ContentCreationAgent** (かくちゃん) - 10%
5. **CoordinatorAgent** (しきるん) - 8%

### 平均実行時間

| エージェント | 平均時間 | 並列実行時の短縮率 |
|-------------|---------|------------------|
| CodeGenAgent | 2-5分 | - |
| ReviewAgent | 1-3分 | - |
| CoordinatorAgent | 5-10分 | 最大70% |
| AIEntrepreneurAgent | 15-30分 | 最大60% |

---

## 🚨 よくある質問

### Q1: どのエージェントを使えばいいかわからない

**A**: タスクの種類で判断:
- コード関連 → `CodeGenAgent`
- 分析・調査 → `IssueAgent`, `MarketResearchAgent`
- 複雑なタスク → `CoordinatorAgent`
- ビジネス企画 → `AIEntrepreneurAgent`

### Q2: 並列実行できるか判断する方法

**A**: 以下の条件を確認:
- 各タスクが独立している
- 前のタスクの結果を必要としない
- リソース（API等）の競合がない

### Q3: エージェントが失敗した場合

**A**: 以下の対処:
1. プロンプトをより具体的に
2. タスクを小さく分解
3. 別のエージェントで代替
4. `CoordinatorAgent`で再計画

---

**メンテナー**: Claude Code  
**最終更新**: 2025-11-27