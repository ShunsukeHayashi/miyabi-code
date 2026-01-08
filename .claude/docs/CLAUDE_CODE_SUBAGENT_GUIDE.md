---
name: doc_CLAUDE_CODE_SUBAGENT_GUIDE
description: Documentation file: CLAUDE_CODE_SUBAGENT_GUIDE.md
---

# Claude Code Sub-Agent 呼び出しガイド

**Version**: 1.0.0  
**Last Updated**: 2025-11-27  
**Purpose**: Claude Code から Miyabi Sub-agents を呼び出すための実践ガイド

---

## 🎯 概要

Claude Code は、Miyabi システムの **24個の専門エージェント** をサブエージェントとして呼び出すことができます。各エージェントは特定のタスクに特化しており、並列実行や連携が可能です。

### アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│   Task Tool     │────▶│   Sub-Agent     │
│  (Orchestrator) │◀────│   (Gateway)     │◀────│   (Specialist)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📋 利用可能なサブエージェント一覧

### 🔴 リーダーエージェント（2個）

| キャラクター名 | 技術名 | 役割 | 並列実行 |
|--------------|--------|------|---------|
| **しきるん** | CoordinatorAgent | タスク分解・並列実行統括 | ❌ |
| **あきんどさん** | AIEntrepreneurAgent | ビジネスプラン作成（8ステップ） | ❌ |

### 🟢 実行エージェント（13個）

| キャラクター名 | 技術名 | 役割 | 並列実行 |
|--------------|--------|------|---------|
| **つくるん** | CodeGenAgent | コード生成・実装 | ✅ |
| **つくろん** | ProductConceptAgent | 商品コンセプト・MVP設計 | ✅ |
| **かくん** | ProductDesignAgent | UI/UXデザイン | ✅ |
| **みちびきん** | FunnelDesignAgent | カスタマージャーニー設計 | ✅ |
| **ひろめるん** | MarketingAgent | マーケティング戦略 | ✅ |
| **かくちゃん** | ContentCreationAgent | コンテンツ制作 | ✅ |
| **つぶやきん** | SNSStrategyAgent | SNS戦略・投稿計画 | ✅ |
| **どうがん** | YouTubeAgent | YouTube動画企画 | ✅ |
| **うるん** | SalesAgent | 営業戦略・リード管理 | ✅ |
| **おきゃくさま** | CRMAgent | 顧客管理・LTV最大化 | ✅ |
| **かきこちゃん** | NoteAgent | note.com記事執筆 | ✅ |
| **えがくん** | ImageGenAgent | 画像生成（記事・SNS用） | ✅ |
| **ほのかちゃん** | HonokaAgent | Udemyコース設計（13ステップ） | ✅ |

### 🔵 分析エージェント（6個）

| キャラクター名 | 技術名 | 役割 | 並列実行 |
|--------------|--------|------|---------|
| **めだまん** | ReviewAgent | コード品質レビュー（100点満点） | ✅ |
| **みつけるん** | IssueAgent | GitHub Issue分析・ラベリング | ✅ |
| **なりきりん** | PersonaAgent | ペルソナ分析・作成 | ✅ |
| **じぶんさん** | SelfAnalysisAgent | SWOT分析・自己分析 | ✅ |
| **しらべるん** | MarketResearchAgent | 市場調査・競合分析 | ✅ |
| **かぞえるん** | AnalyticsAgent | データ分析・レポート作成 | ✅ |

### 🟡 サポートエージェント（3個）

| キャラクター名 | 技術名 | 役割 | 並列実行 |
|--------------|--------|------|---------|
| **まとめるん** | PRAgent | Pull Request作成・管理 | ⚠️ 条件付き |
| **はこぶん** | DeploymentAgent | デプロイ・リリース管理 | ⚠️ 条件付き |
| **つなぐん** | HooksIntegration | イベント監視・自動化 | ⚠️ 条件付き |

---

## 🚀 サブエージェントの呼び出し方法

### 基本的な呼び出し構文

Task tool を使用して、以下のパラメータを指定します：

```yaml
description: "実行したいタスクの説明"
prompt: "エージェントへの具体的な指示"
subagent_type: "エージェントの技術名"
```

### 呼び出し例

#### 例1: コード生成（つくるん）

```yaml
description: "Issue #123 のバグ修正コードを生成"
prompt: "Issue #123 で報告されている認証バグを修正するコードを生成してください。TypeScriptで実装し、テストコードも含めてください。"
subagent_type: "CodeGenAgent"
```

#### 例2: コードレビュー（めだまん）

```yaml
description: "PR #456 のコード品質チェック"
prompt: "PR #456 のコードをレビューしてください。セキュリティ、パフォーマンス、コードスタイルの観点から100点満点で評価してください。"
subagent_type: "ReviewAgent"
```

#### 例3: ビジネスプラン作成（あきんどさん）

```yaml
description: "AI搭載タスク管理アプリのビジネスプラン作成"
prompt: "AI搭載タスク管理アプリのビジネスプランを8つのステップで作成してください。市場調査から資金調達まで包括的に検討してください。"
subagent_type: "AIEntrepreneurAgent"
```

---

## 🎨 使用パターンとベストプラクティス

### パターン1: 単一エージェント実行

最もシンプルなパターン。1つのエージェントに特定のタスクを依頼。

```yaml
# Issue分析を依頼
description: "新規Issueの分析とラベリング"
prompt: "Issue #789 を分析して、適切なラベルを提案してください。優先度も判定してください。"
subagent_type: "IssueAgent"
```

### パターン2: 連携実行（Sequential）

複数のエージェントを順番に実行。前のエージェントの出力を次のエージェントが利用。

```yaml
# Step 1: コード生成
description: "機能実装"
prompt: "ユーザー認証機能を実装してください"
subagent_type: "CodeGenAgent"

# Step 2: コードレビュー
description: "実装コードのレビュー"
prompt: "先ほど生成されたコードをレビューしてください"
subagent_type: "ReviewAgent"

# Step 3: PR作成
description: "レビュー済みコードのPR作成"
prompt: "レビューが完了したコードでPRを作成してください"
subagent_type: "PRAgent"
```

### パターン3: 並列実行（Parallel）

独立したタスクを同時に実行。効率的な処理が可能。

```yaml
# 以下を同時に実行
- description: "市場調査"
  prompt: "タスク管理アプリ市場を調査してください"
  subagent_type: "MarketResearchAgent"

- description: "ペルソナ作成"
  prompt: "タスク管理アプリのペルソナを3つ作成してください"
  subagent_type: "PersonaAgent"

- description: "SWOT分析"
  prompt: "自社のSWOT分析を実施してください"
  subagent_type: "SelfAnalysisAgent"
```

### パターン4: コーディネーター活用

複雑なタスクを自動的に分解・調整。

```yaml
description: "Issue #999 の実装（複雑なタスク）"
prompt: "Issue #999 を分析し、必要なタスクに分解して、適切なエージェントに割り当てて実行してください"
subagent_type: "CoordinatorAgent"
```

---

## 💡 実践的な使用例

### 使用例1: 新機能の完全実装フロー

```yaml
# 1. Issue分析
description: "Issue分析"
prompt: "Issue #1234 を分析してください"
subagent_type: "IssueAgent"

# 2. タスク分解と計画
description: "実装計画作成"
prompt: "Issue #1234 の実装計画を作成してください"
subagent_type: "CoordinatorAgent"

# 3. コード実装
description: "機能実装"
prompt: "Issue #1234 の機能を実装してください"
subagent_type: "CodeGenAgent"

# 4. 品質チェック
description: "コードレビュー"
prompt: "実装されたコードをレビューしてください"
subagent_type: "ReviewAgent"

# 5. PR作成
description: "PR作成"
prompt: "レビュー済みコードでPRを作成してください"
subagent_type: "PRAgent"
```

### 使用例2: コンテンツマーケティングキャンペーン

```yaml
# 並列実行で効率化
parallel:
  - description: "ブログ記事作成"
    prompt: "AIツール活用法についてのブログ記事を作成してください"
    subagent_type: "ContentCreationAgent"
    
  - description: "note記事作成"
    prompt: "エンジニア向けAI活用術をnote記事として作成してください"
    subagent_type: "NoteAgent"
    
  - description: "SNS投稿計画"
    prompt: "1週間分のSNS投稿計画を作成してください"
    subagent_type: "SNSStrategyAgent"
    
  - description: "YouTube動画企画"
    prompt: "AI開発入門の動画企画を作成してください"
    subagent_type: "YouTubeAgent"
```

### 使用例3: ビジネスプラン策定

```yaml
description: "SaaSビジネスプラン作成"
prompt: "B2B SaaSのビジネスプランを包括的に作成してください。市場調査から資金調達計画まで8つのステップで実行してください。"
subagent_type: "AIEntrepreneurAgent"

# AIEntrepreneurAgentが自動的に以下を調整：
# - MarketResearchAgent（市場調査）
# - PersonaAgent（ペルソナ分析）
# - ProductConceptAgent（商品設計）
# - ProductDesignAgent（UI/UX設計）
# - MarketingAgent（マーケティング戦略）
# - SalesAgent（営業戦略）
# - CRMAgent（顧客管理）
# - AnalyticsAgent（KPI設定）
```

---

## 🎯 エージェント選択のヒント

### タスク種別によるエージェント選択

| タスク種別 | 推奨エージェント | 理由 |
|-----------|----------------|------|
| コード実装 | つくるん（CodeGenAgent） | AI駆動のコード生成に特化 |
| バグ修正 | つくるん（CodeGenAgent） | 既存コードの修正も対応 |
| コードレビュー | めだまん（ReviewAgent） | 品質チェックと採点機能 |
| Issue管理 | みつけるん（IssueAgent） | 自動ラベリングと優先度判定 |
| PR作成 | まとめるん（PRAgent） | PR説明文の自動生成 |
| デプロイ | はこぶん（DeploymentAgent） | 安全なデプロイとロールバック |
| ビジネス企画 | あきんどさん（AIEntrepreneurAgent） | 8ステップの包括的プラン |
| 市場分析 | しらべるん（MarketResearchAgent） | 競合20社以上の分析 |
| コンテンツ作成 | かくちゃん（ContentCreationAgent） | SEO最適化された記事 |
| データ分析 | かぞえるん（AnalyticsAgent） | KPIトラッキングとレポート |

### 並列実行の判断基準

**並列実行可能（🟢🔵）**:
- 独立したタスク
- 相互依存がない
- リソース競合がない

**順次実行必要（🔴🟡）**:
- 前のタスクの結果が必要
- リーダーシップが必要
- 最終的なまとめ作業

---

## ⚠️ 注意事項とトラブルシューティング

### よくあるエラーと対処法

| エラー | 原因 | 対処法 |
|--------|------|--------|
| `AGENT_NOT_FOUND` | subagent_typeの誤記 | 正しい技術名を使用（例：CodeGenAgent） |
| `INVALID_PROMPT` | プロンプトが不明確 | 具体的な指示を記載 |
| `TIMEOUT` | タスクが複雑すぎる | CoordinatorAgentで分解 |
| `RATE_LIMITED` | API制限到達 | 少し待ってから再実行 |

### ベストプラクティス

1. **明確な指示**: プロンプトは具体的に
2. **適材適所**: エージェントの専門性を活かす
3. **並列化**: 可能な限り並列実行で効率化
4. **エラーハンドリング**: 失敗時の代替策を用意
5. **段階的実行**: 複雑なタスクは小さく分解

---

## 📚 関連ドキュメント

- [エージェントキャラクター図鑑](./AGENT_CHARACTERS.md) - 全エージェントの詳細説明
- [Rust Tool Use Guide](./RUST_TOOL_USE_GUIDE.md) - 技術的な実装詳細
- [簡単使い方ガイド](./USAGE_GUIDE_SIMPLE.md) - 初心者向けガイド
- [エージェント名マッピング](./agent-name-mapping.json) - 名前と技術名の対応表

---

**メンテナー**: Claude Code  
**最終更新**: 2025-11-27  
**次回レビュー**: 新エージェント追加時