# GitHub Label Usage Guide - Miyabi Project

**Last Updated**: 2025-10-26
**Version**: 1.0.0

このドキュメントは、Miyabiプロジェクトで使用されるGitHub Labelの完全なマッピング表です。

---

## 📊 Label Categories - 10カテゴリ体系

### 1. 🏷️ Type Labels - Issue種別（必須）

**用途**: Issueの種類を分類

| Label | 説明 | 使用例 |
|-------|------|--------|
| `✨ type:feature` | 新機能・機能追加 | 新しいAgent実装、新機能追加 |
| `🐛 type:bug` | バグ修正 | エラー修正、動作不良の修正 |
| `📚 type:docs` | ドキュメント改善 | README更新、仕様書作成 |
| `🔧 type:refactor` | コードリファクタリング | コード整理、構造改善 |
| `🧪 type:test` | テスト追加・改善 | ユニットテスト、E2Eテスト |
| `🏗️ type:architecture` | アーキテクチャ設計 | システム設計、構造変更 |
| `🚀 type:deployment` | デプロイ・インフラ | CI/CD、デプロイ設定 |

**Issue作成時の選択ルール**:
- **必ず1つ選択**（複数選択不可）
- ドキュメント → `📚 type:docs`
- バグ → `🐛 type:bug`
- 新機能 → `✨ type:feature`

---

### 2. 🎯 Priority Labels - 優先度（必須）

**用途**: Issueの優先度を設定

| Label | 説明 | SLA | 使用例 |
|-------|------|-----|--------|
| `🔥 priority:P0-Critical` | 緊急（本番停止、データ損失） | 即時対応 | 本番サーバーダウン |
| `⚠️ priority:P1-High` | 高（主要機能、重大なバグ） | 24時間以内 | 主要機能のバグ |
| `📊 priority:P2-Medium` | 中（通常の機能・バグ） | 1週間以内 | 通常の機能追加 |
| `📝 priority:P3-Low` | 低（Nice-to-have） | 時間がある時 | 軽微な改善 |

**Issue作成時の選択ルール**:
- **必ず1つ選択**（複数選択不可）
- ドキュメント修正 → 通常 `📊 priority:P2-Medium`
- 本番障害 → `🔥 priority:P0-Critical`
- セキュリティ問題 → `⚠️ priority:P1-High`

---

### 3. 🤖 Agent Assignment Labels - Agent割り当て（任意）

**用途**: 特定のAgentに割り当て

| Label | Agent名 | 役割 |
|-------|---------|------|
| `🤖 agent:coordinator` | CoordinatorAgent | タスク統括・DAG分解 |
| `🤖 agent:codegen` | CodeGenAgent | コード生成 |
| `🤖 agent:review` | ReviewAgent | コード品質レビュー |
| `🤖 agent:issue` | IssueAgent | Issue分析・ラベリング |
| `🤖 agent:pr` | PRAgent | PR自動作成 |
| `🤖 agent:deployment` | DeploymentAgent | デプロイ自動化 |
| `🤖 agent:funnel-design` | FunnelDesignAgent | 顧客導線設計 |
| `🤖 agent:sns-strategy` | SNSStrategyAgent | SNS戦略立案 |

**使用ルール**:
- Agent自動実行時に自動付与
- 手動で特定Agentを指定する場合のみ使用

---

### 4. 📈 State Labels - 実行状態（自動更新）

**用途**: Issueの現在の状態（Agentが自動更新）

| Label | 説明 | 次のアクション |
|-------|------|---------------|
| `📥 state:pending` | 作成済み、トリアージ待ち | 人間がレビュー |
| `🔍 state:analyzing` | CoordinatorAgentが分析中 | 自動実行中 |
| `🏗️ state:implementing` | 実装中 | 自動実行中 |
| `👀 state:reviewing` | ReviewAgent確認中 | 自動実行中 |
| `✅ state:done` | 完了、mainにマージ済み | クローズ |
| `⏸️ state:paused` | 一時停止（依存待ち） | 依存解決待ち |
| `🔴 state:blocked` | ブロック中（人間介入必要） | Guardian対応 |
| `🛑 state:failed` | 実行失敗 | エラー調査 |

**使用ルール**:
- **手動で変更しない**（Agentが自動更新）
- 例外: Guardian（人間）がブロック解除する場合のみ

---

### 5. 🚨 Severity Labels - 深刻度（セキュリティ・品質）

**用途**: セキュリティ問題や品質問題の深刻度

| Label | 説明 | エスカレーション |
|-------|------|-----------------|
| `🚨 severity:Sev.1-Critical` | 緊急（即座にGuardian通知） | 即座に対応 |
| `⚠️ severity:Sev.2-High` | 高（TechLead/CISO推奨） | 24時間以内 |
| `📊 severity:Sev.3-Medium` | 中（通常監視） | 1週間以内 |
| `📝 severity:Sev.4-Low` | 低（通常対応） | 通常フロー |

**使用ルール**:
- セキュリティ問題のみ使用
- `🔐 security` ラベルと併用

---

### 6. 🎨 Phase Labels - 開発フェーズ（任意）

**用途**: 開発のどのフェーズにあるか

| Label | 説明 |
|-------|------|
| `🎯 phase:planning` | 計画フェーズ |
| `🎯 phase:foundation` | 基盤構築フェーズ |
| `🏗️ phase:implementation` | 実装フェーズ |
| `🧪 phase:testing` | テストフェーズ |
| `🚀 phase:deployment` | デプロイフェーズ |
| `📊 phase:monitoring` | 監視フェーズ |

**使用ルール**:
- 大規模プロジェクトで使用
- 小規模Issueでは省略可

---

### 7. ⭐ Quality Labels - 品質スコア（ReviewAgent自動付与）

**用途**: コード品質スコア（ReviewAgentが自動判定）

| Label | スコア範囲 | 説明 |
|-------|-----------|------|
| `⭐ quality:excellent` | 90-100 | 優秀 |
| `✅ quality:good` | 80-89 | 良好 |
| `⚠️ quality:needs-improvement` | 60-79 | 改善必要 |
| `🔴 quality:poor` | <60 | 不十分、再作業必要 |

**使用ルール**:
- **手動で付与しない**（ReviewAgentが自動付与）

---

### 8. 🌳 Hierarchy Labels - Issue階層（大規模プロジェクト）

**用途**: Issue間の親子関係を表現

| Label | 説明 | 使用例 |
|-------|------|--------|
| `🌳 hierarchy:root` | ルートIssue（親なし） | Epicレベル |
| `📂 hierarchy:parent` | 親Issue（子あり） | Feature全体 |
| `📄 hierarchy:child` | 子Issue（親あり） | 個別タスク |
| `🍃 hierarchy:leaf` | リーフIssue（子なし） | 最小単位タスク |

**使用ルール**:
- 大規模プロジェクト（5+ Issues）で使用
- 小規模では省略可

---

### 9. 🔔 Trigger Labels - 自動実行トリガー

**用途**: 特定アクションを自動実行

| Label | トリガー内容 | 実行タイミング |
|-------|-------------|---------------|
| `🤖 trigger:agent-execute` | Agent自動実行 | Issue作成時 |
| `📊 trigger:generate-report` | 週次レポート生成 | 毎週月曜 |
| `🚀 trigger:deploy-staging` | Staging環境デプロイ | PR作成時 |
| `🚀 trigger:deploy-production` | 本番環境デプロイ（要承認） | PR承認後 |

**使用ルール**:
- `🤖 trigger:agent-execute`: Agent実行したいIssueに付与
- デプロイ系: GitHub Actionsと連携

---

### 10. 🏷️ Special Labels - 特殊ラベル

**用途**: 特殊な状況を示す

| Label | 説明 | 使用例 |
|-------|------|--------|
| `🔐 security` | セキュリティ関連（CISO通知） | CVE対応、脆弱性修正 |
| `💰 cost-watch` | 高コスト操作（予算監視） | 大量API呼び出し |
| `🔄 dependencies` | 依存関係あり（先に解決必要） | ブロッカーIssue待ち |
| `🎓 learning` | 学習タスク（時間かかる） | 新技術習得 |
| `🔬 experiment` | 実験的（失敗OK） | PoC、検証 |
| `🔁 duplicate` | 重複Issue | 既存Issueと同じ |
| `🚫 wontfix` | 対応しない（クローズ） | スコープ外 |
| `👋 good-first-issue` | 初心者向け | コントリビューター歓迎 |
| `🙏 help-wanted` | コミュニティ支援募集 | 協力者募集 |
| `❓ question` | 質問・ディスカッション | Q&A |
| `🎁 special:bonus` | オプション機能（Nice-to-have） | 余裕があれば実装 |

---

## 🎯 Issue作成時の推奨ラベル組み合わせ

### パターン1: ドキュメント修正

```yaml
必須:
  - type: 📚 type:docs
  - priority: 📊 priority:P2-Medium

任意:
  - phase: 🎯 phase:planning
```

**例**: Issue #546, #547, #549, #550, #551

### パターン2: バグ修正

```yaml
必須:
  - type: 🐛 type:bug
  - priority: ⚠️ priority:P1-High または 📊 priority:P2-Medium

推奨:
  - trigger: 🤖 trigger:agent-execute（Agent実行する場合）
```

### パターン3: 新機能追加

```yaml
必須:
  - type: ✨ type:feature
  - priority: ⚠️ priority:P1-High または 📊 priority:P2-Medium

推奨:
  - trigger: 🤖 trigger:agent-execute
  - phase: 🎯 phase:planning → 🏗️ phase:implementation
```

### パターン4: リファクタリング

```yaml
必須:
  - type: 🔧 type:refactor
  - priority: 📊 priority:P2-Medium

任意:
  - trigger: 🤖 trigger:agent-execute
```

**例**: Issue #548

### パターン5: セキュリティ対応

```yaml
必須:
  - type: 🔒 security
  - priority: 🔥 priority:P0-Critical または ⚠️ priority:P1-High
  - severity: 🚨 severity:Sev.1-Critical または ⚠️ severity:Sev.2-High

推奨:
  - trigger: 🤖 trigger:agent-execute
```

---

## 🚫 よくある間違い

### ❌ 間違った使用例

```yaml
# NG: 存在しないラベル
labels:
  - 📝documentation  # ❌ 存在しない
  - 🔴priority-high  # ❌ 存在しない（正: ⚠️ priority:P1-High）

# NG: typeラベル複数選択
labels:
  - ✨ type:feature
  - 📚 type:docs  # ❌ typeは1つのみ

# NG: priorityラベル複数選択
labels:
  - ⚠️ priority:P1-High
  - 📊 priority:P2-Medium  # ❌ priorityは1つのみ
```

### ✅ 正しい使用例

```yaml
# OK: ドキュメント修正（高優先度）
labels:
  - 📚 type:docs
  - ⚠️ priority:P1-High

# OK: バグ修正 + Agent実行
labels:
  - 🐛 type:bug
  - ⚠️ priority:P1-High
  - 🤖 trigger:agent-execute

# OK: 新機能 + 実装フェーズ
labels:
  - ✨ type:feature
  - 📊 priority:P2-Medium
  - 🏗️ phase:implementation
  - 🤖 trigger:agent-execute
```

---

## 📋 ラベル一覧（アルファベット順）

完全なラベルリスト:

```bash
# リアルタイムで確認
gh label list --limit 100

# カテゴリ別フィルタ
gh label list | grep "type:"
gh label list | grep "priority:"
gh label list | grep "state:"
gh label list | grep "agent:"
```

---

## 🔧 Claude Codeでの使用方法

### Issue作成時

```bash
gh issue create \
  --title "docs: サンプルドキュメント更新" \
  --body "..." \
  --label "📚 type:docs,📊 priority:P2-Medium"
```

### ラベル確認

```bash
# プロジェクトのラベル一覧
gh label list

# 特定カテゴリのみ
gh label list | grep "type:"
```

---

## 📚 関連ドキュメント

- `docs/LABEL_SYSTEM_GUIDE.md` - 53ラベル体系の完全ガイド（詳細版）
- `docs/DOCUMENTATION_CONSISTENCY_REPORT.md` - ドキュメント整合性レポート
- `.github/ISSUE_TEMPLATE/` - Issueテンプレート

---

**このガイドは、GitHub Issue作成時に必ず参照してください。**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
