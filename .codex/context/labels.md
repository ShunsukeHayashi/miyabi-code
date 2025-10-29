# Label System - 53ラベル体系

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐⭐

## 概要

**"Everything starts with an Issue. Labels define the state."**

Labelはオペレーティングシステムの状態管理機構として機能します。

## 状態遷移フロー
```
📥 pending → 🔍 analyzing → 🏗️ implementing → 👀 reviewing → ✅ done
```

## 10のカテゴリ（53ラベル）

### 1. STATE (8個) - ライフサイクル管理
- `📥 state:pending` - 処理待ち
- `🔍 state:analyzing` - 分析中
- `🏗️ state:implementing` - 実装中
- `👀 state:reviewing` - レビュー中
- `✅ state:done` - 完了
- `❌ state:blocked` - ブロック中
- `⏸️ state:paused` - 一時停止
- `🔄 state:in-progress` - 進行中（汎用）

### 2. AGENT (6個) - Agent割り当て
- `🤖 agent:coordinator` - CoordinatorAgent
- `🤖 agent:codegen` - CodeGenAgent
- `🤖 agent:review` - ReviewAgent
- `🤖 agent:deployment` - DeploymentAgent
- `🤖 agent:pr` - PRAgent
- `🤖 agent:issue` - IssueAgent

### 3. PRIORITY (4個) - 優先度管理
- `🔥 priority:P0-Critical` - 最高優先度
- `⚠️ priority:P1-High` - 高優先度
- `📌 priority:P2-Medium` - 中優先度
- `📝 priority:P3-Low` - 低優先度

### 4. TYPE (7個) - Issue分類
- `✨ type:feature` - 新機能
- `🐛 type:bug` - バグ修正
- `📚 type:docs` - ドキュメント
- `🔨 type:refactor` - リファクタリング
- `🧪 type:test` - テスト
- `🎨 type:style` - スタイル
- `⚡ type:performance` - パフォーマンス

### 5. SEVERITY (4個) - 深刻度・エスカレーション
- `🚨 severity:Sev.1-Critical` - CTOエスカレーション必須
- `⚠️ severity:Sev.2-High` - 開発リーダーエスカレーション
- `📌 severity:Sev.3-Medium` - Agent自律処理
- `📝 severity:Sev.4-Low` - 通常処理

### 6. PHASE (5個) - プロジェクトフェーズ
- `🎯 phase:planning` - 計画フェーズ
- `🏗️ phase:development` - 開発フェーズ
- `🧪 phase:testing` - テストフェーズ
- `👀 phase:review` - レビューフェーズ
- `🚀 phase:deployment` - デプロイフェーズ

### 7. SPECIAL (7個) - 特殊操作
- `🔐 security` - セキュリティ関連
- `💰 cost-watch` - コスト監視
- `🔄 dependencies` - 依存関係
- `📦 breaking-change` - Breaking Change
- `🚀 epic` - Epic（大規模機能）
- `🔬 experiment` - 実験的機能
- `📝 documentation` - ドキュメント関連

### 8. TRIGGER (4個) - 自動化トリガー
- `🤖 trigger:agent-execute` - Agent実行トリガー
- `🚀 trigger:deploy-staging` - ステージングデプロイ
- `🚀 trigger:deploy-production` - プロダクションデプロイ
- `🔄 trigger:auto-merge` - 自動マージ

### 9. QUALITY (4個) - 品質スコア
- `⭐ quality:excellent` - 90-100点
- `✅ quality:good` - 80-89点
- `📝 quality:fair` - 70-79点
- `⚠️ quality:needs-improvement` - <70点

### 10. COMMUNITY (4個) - コミュニティ
- `👋 good-first-issue` - 初心者向け
- `🙏 help-wanted` - ヘルプ募集
- `❓ question` - 質問
- `💡 enhancement` - 改善提案

## Agent × Label 連携

- **IssueAgent**: AI推論で `type`, `priority`, `severity` を自動推定
- **CoordinatorAgent**: `state:pending` → `state:analyzing` へ遷移
- **CodeGenAgent**: `agent:codegen` + `state:implementing` で実行
- **ReviewAgent**: 品質スコア80点以上で `quality:good` 付与
- **PRAgent**: Conventional Commits準拠のPRタイトル生成
- **DeploymentAgent**: `trigger:deploy-staging` で即座にデプロイ

## 🔗 Related Modules

- **Agents**: [agents.md](./agents.md) - Agent × Label連携
- **Entity-Relation**: [entity-relation.md](./entity-relation.md) - Entity E5定義

## 📖 Detailed Documentation

- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md` (完全仕様)
- **Agent SDK Integration**: `docs/AGENT_SDK_LABEL_INTEGRATION.md`
- **GitHub Labels Config**: `.github/labels.yml`
