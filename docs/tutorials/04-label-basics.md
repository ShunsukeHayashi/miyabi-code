# チュートリアル: Label System初心者ガイド

**🎯 このチュートリアルのゴール**: Miyabiの53ラベル体系を理解し、効果的に活用する

**対象**: チュートリアル「並列実行の実践」を修了した人

**所要時間**: 約25分

---

## 📚 この章で学ぶこと

1. ✅ Label Systemとは何か？
2. ✅ 10のカテゴリと53のラベル
3. ✅ Agentとラベルの連携
4. ✅ 実践的なラベル付与
5. ✅ ベストプラクティス

---

## Label Systemとは？

### 基本概念

**Label System** は、Miyabiにおける**オペレーティングシステムの状態管理機構**です。

**Miyabiの哲学**:
> "Everything starts with an Issue. Labels define the state."

**例えるなら**:
- **従来**: ラベルは単なるタグ
- **Miyabi**: ラベルはOSのステータス（実行中、完了、エラーなど）

---

### なぜLabel Systemが重要なのか？

#### 1. Agent実行の制御

Agentは**ラベルを見て**次のアクションを決定します。

```
📥 state:pending → 🔴 しきるん が処理開始
🏗️ state:implementing → 🟢 つくるん が実装中
👀 state:reviewing → 🟢 めだまん がレビュー中
✅ state:done → 処理完了
```

#### 2. 自動化の鍵

ラベルがあることで、人間が介入せずに全自動化が可能に。

```bash
# ラベルがあれば自動実行
miyabi auto-process --label "state:pending"
```

#### 3. 可視化とトラッキング

ラベルでIssue/PRの状態をひと目で把握。

```
GitHub Projects View:
📥 Pending: 5 issues
🏗️ Implementing: 3 issues
👀 Reviewing: 2 issues
✅ Done: 42 issues
```

---

## 10のカテゴリと53のラベル

Miyabiには**10カテゴリ**、合計**53個**のラベルがあります。

---

### 1️⃣ STATE (8個) - ライフサイクル管理

Issueの現在の状態を表します（**最重要**）。

| ラベル | 説明 | Agent |
|--------|------|-------|
| 📥 state:pending | 処理待ち | しきるん が処理開始 |
| 🔍 state:analyzing | 分析中 | みつけるん が分析中 |
| 🏗️ state:implementing | 実装中 | つくるん が実装中 |
| 👀 state:reviewing | レビュー中 | めだまん がレビュー中 |
| ✅ state:done | 完了 | 処理完了 |
| ⏸️ state:blocked | ブロック | 依存関係待ち |
| ❌ state:rejected | 却下 | クローズ済み |
| 🔄 state:reopened | 再オープン | 再処理が必要 |

**使用例**:
```bash
# 新しいIssueを作成（pending状態）
gh issue create --label "📥 state:pending"

# 実装中に変更
gh issue edit 1 --add-label "🏗️ state:implementing" --remove-label "📥 state:pending"
```

---

### 2️⃣ AGENT (6個) - Agent割り当て

どのAgentが担当するかを明示します。

| ラベル | Agent | 役割 |
|--------|-------|------|
| 🤖 agent:coordinator | しきるん | タスク統括 |
| 🤖 agent:codegen | つくるん | コード生成 |
| 🤖 agent:review | めだまん | 品質レビュー |
| 🤖 agent:deployment | はこぶん | デプロイ |
| 🤖 agent:pr | かくちゃん | PR作成 |
| 🤖 agent:issue | みつけるん | Issue分析 |

**使用例**:
```bash
# しきるんに明示的に割り当て
gh issue edit 1 --add-label "🤖 agent:coordinator"
```

---

### 3️⃣ PRIORITY (4個) - 優先度管理

緊急度を4段階で管理します。

| ラベル | 優先度 | 対応時間 |
|--------|--------|----------|
| 🔥 priority:P0-Critical | 最優先 | 即座に |
| ⚠️ priority:P1-High | 高 | 24時間以内 |
| 📊 priority:P2-Medium | 中 | 1週間以内 |
| 📝 priority:P3-Low | 低 | 余裕があれば |

**使用例**:
```bash
# 本番環境の障害 → P0
gh issue create --label "🔥 priority:P0-Critical,🐛 type:bug"

# 機能追加 → P2
gh issue create --label "📊 priority:P2-Medium,✨ type:feature"
```

---

### 4️⃣ TYPE (7個) - Issue分類

Issueの種類を表します。

| ラベル | 説明 | 例 |
|--------|------|------|
| ✨ type:feature | 新機能 | 新しいAPI追加 |
| 🐛 type:bug | バグ修正 | ログインエラー修正 |
| 📚 type:docs | ドキュメント | READMEの更新 |
| ♻️ type:refactor | リファクタリング | コード整理 |
| 🧪 type:test | テスト | テストケース追加 |
| ⚡ type:performance | パフォーマンス | 速度改善 |
| 🎨 type:style | スタイル | フォーマット修正 |

**使用例**:
```bash
# 新機能
gh issue create --label "✨ type:feature"

# バグ修正
gh issue create --label "🐛 type:bug"
```

---

### 5️⃣ SEVERITY (4個) - 深刻度・エスカレーション

バグやエラーの深刻度を表します。

| ラベル | 深刻度 | 説明 |
|--------|--------|------|
| 🚨 severity:Sev.1-Critical | 最重大 | サービス停止 |
| ⚠️ severity:Sev.2-High | 高 | 主要機能が動かない |
| 📊 severity:Sev.3-Medium | 中 | 一部機能が動かない |
| 📝 severity:Sev.4-Low | 低 | 軽微な問題 |

**使用例**:
```bash
# 本番環境でサービス停止
gh issue create --label "🚨 severity:Sev.1-Critical,🐛 type:bug,🔥 priority:P0-Critical"
```

---

### 6️⃣ PHASE (5個) - プロジェクトフェーズ

プロジェクトのどの段階かを表します。

| ラベル | フェーズ |
|--------|----------|
| 🎯 phase:planning | 計画 |
| 🏗️ phase:implementation | 実装 |
| 🧪 phase:testing | テスト |
| 📚 phase:documentation | ドキュメント |
| 🚀 phase:deployment | デプロイ |

---

### 7️⃣ SPECIAL (7個) - 特殊操作

特別な取り扱いが必要なIssueを表します。

| ラベル | 説明 |
|--------|------|
| 🔐 security | セキュリティ関連 |
| 💰 cost-watch | コスト監視 |
| 🔄 dependencies | 依存関係更新 |
| 🚀 breaking-change | 破壊的変更 |
| 🔮 experimental | 実験的機能 |
| 📦 release | リリース関連 |
| 🎓 learning | 学習目的 |

---

### 8️⃣ TRIGGER (4個) - 自動化トリガー

特定の自動化をトリガーします。

| ラベル | 動作 |
|--------|------|
| 🤖 trigger:agent-execute | Agent即座に実行 |
| 🚀 trigger:deploy-staging | Staging環境にデプロイ |
| 🚀 trigger:deploy-production | Production環境にデプロイ |
| 🔄 trigger:sync | 同期処理実行 |

**使用例**:
```bash
# Issue作成と同時にAgent実行
gh issue create --label "🤖 trigger:agent-execute,📥 state:pending"
```

---

### 9️⃣ QUALITY (4個) - 品質スコア

レビュー後の品質を点数化します。

| ラベル | スコア範囲 | 説明 |
|--------|-----------|------|
| ⭐ quality:excellent | 90-100点 | 優秀 |
| ✅ quality:good | 80-89点 | 良好 |
| 📊 quality:acceptable | 70-79点 | 許容範囲 |
| ⚠️ quality:needs-improvement | 0-69点 | 要改善 |

**自動付与**: めだまん (ReviewAgent) が自動でスコアリング

---

### 🔟 COMMUNITY (4個) - コミュニティ

オープンソースコミュニティ向けのラベルです。

| ラベル | 説明 |
|--------|------|
| 👋 good-first-issue | 初心者向け |
| 🙏 help-wanted | 助けを募集 |
| ❓ question | 質問 |
| 💡 discussion | 議論 |

---

## Agentとラベルの連携

### 自動ラベル付与

Agentは処理中に自動的にラベルを更新します。

```
Issue #100 作成
├─ 初期: 📥 state:pending
│
🔴 しきるん 起動
├─ 変更: 🔍 state:analyzing
├─ 追加: 🤖 agent:coordinator
│
🟢 つくるん 起動
├─ 変更: 🏗️ state:implementing
├─ 追加: 🤖 agent:codegen
│
🟢 めだまん 起動
├─ 変更: 👀 state:reviewing
├─ 追加: 🤖 agent:review
├─ 追加: ⭐ quality:excellent (92点)
│
🟢 かくちゃん 起動
├─ 変更: ✅ state:done
├─ 追加: 🤖 agent:pr
```

---

### ラベルベースのAgent実行

```bash
# 全ての pending Issues を処理
miyabi auto-process --label "📥 state:pending"

# P0-Critical のみ処理
miyabi auto-process --label "🔥 priority:P0-Critical"

# バグ修正のみ処理
miyabi auto-process --label "🐛 type:bug"
```

---

## 実践的なラベル付与

### パターン1: 新機能のIssue

```bash
gh issue create \
  --title "Add user authentication API" \
  --body "..." \
  --label "✨ type:feature" \
  --label "📥 state:pending" \
  --label "📊 priority:P2-Medium" \
  --label "🏗️ phase:implementation"
```

---

### パターン2: 本番環境の重大バグ

```bash
gh issue create \
  --title "Fix: Production database connection timeout" \
  --body "..." \
  --label "🐛 type:bug" \
  --label "📥 state:pending" \
  --label "🔥 priority:P0-Critical" \
  --label "🚨 severity:Sev.1-Critical" \
  --label "🤖 trigger:agent-execute"
```

**結果**: 即座に しきるん が起動し、処理開始

---

### パターン3: ドキュメント更新

```bash
gh issue create \
  --title "Update API documentation" \
  --body "..." \
  --label "📚 type:docs" \
  --label "📥 state:pending" \
  --label "📝 priority:P3-Low" \
  --label "📚 phase:documentation"
```

---

### パターン4: 破壊的変更

```bash
gh issue create \
  --title "Migrate to new authentication system" \
  --body "..." \
  --label "♻️ type:refactor" \
  --label "📥 state:pending" \
  --label "⚠️ priority:P1-High" \
  --label "🚀 breaking-change"
```

---

## ラベルの一括管理

### すべてのラベルを初期化

```bash
# Miyabiのラベルシステムをセットアップ
miyabi labels sync
```

**実行内容**:
- 53個の構造化ラベルをGitHubリポジトリに追加
- 既存のラベルは保持
- 色・説明も自動設定

---

### ラベルの確認

```bash
# 全ラベル一覧
gh label list

# カテゴリごとに確認
gh label list | grep "state:"
gh label list | grep "agent:"
gh label list | grep "priority:"
```

---

## ベストプラクティス

### ✅ 推奨

#### 1. 最低限のラベルセット

すべてのIssueに以下を必ず付与：

```bash
--label "type:*"        # 種別（必須）
--label "state:pending" # 状態（必須）
--label "priority:*"    # 優先度（推奨）
```

#### 2. ラベルの組み合わせ

意味のある組み合わせを使用：

```bash
# ✅ OK: 緊急バグ
"🐛 type:bug" + "🔥 priority:P0-Critical" + "🚨 severity:Sev.1-Critical"

# ✅ OK: 低優先度の機能追加
"✨ type:feature" + "📝 priority:P3-Low"
```

#### 3. 自動実行したい場合

トリガーラベルを追加：

```bash
--label "🤖 trigger:agent-execute"
```

---

### ❌ 避けるべき

#### 1. ラベルなしのIssue

```bash
# ❌ NG: ラベルがない
gh issue create --title "..." --body "..."

# ✅ OK: 最低限のラベル
gh issue create --title "..." --body "..." --label "type:feature,state:pending"
```

#### 2. 矛盾するラベル

```bash
# ❌ NG: 完了なのにpending
--label "✅ state:done" --label "📥 state:pending"

# ✅ OK: 一貫性のあるラベル
--label "✅ state:done"
```

#### 3. 意味のない組み合わせ

```bash
# ❌ NG: ドキュメントにSeverity
--label "📚 type:docs" --label "🚨 severity:Sev.1-Critical"

# ✅ OK: ドキュメントは低優先度
--label "📚 type:docs" --label "📝 priority:P3-Low"
```

---

## トラブルシューティング

### Q1. Agentが実行されない

**原因**: 必須ラベルがない

**解決方法**:

```bash
# 必須ラベルを追加
gh issue edit 1 --add-label "📥 state:pending,✨ type:feature"

# 再実行
miyabi work-on 1
```

---

### Q2. ラベルが多すぎて混乱する

**原因**: 全53個を覚える必要はない

**解決方法**:

**覚えるべき最重要ラベル（5個）**:
1. `📥 state:pending` - 処理待ち
2. `✨ type:feature` - 新機能
3. `🐛 type:bug` - バグ
4. `⚠️ priority:P1-High` - 高優先度
5. `🤖 trigger:agent-execute` - 即実行

---

### Q3. ラベルの色が違う

**原因**: ラベルが正しく同期されていない

**解決方法**:

```bash
# ラベルを再同期
miyabi labels sync --force
```

---

## 実践演習

### 演習1: 基本的なラベル付与

```bash
# 1. 新機能のIssueを作成
gh issue create \
  --title "Add search API" \
  --body "全文検索APIを追加" \
  --label "✨ type:feature,📥 state:pending,📊 priority:P2-Medium"

# 2. 作成されたIssueを確認
gh issue view [Issue番号]

# 3. Miyabiで処理
miyabi work-on [Issue番号]
```

---

### 演習2: 緊急バグの処理

```bash
# 1. 本番バグのIssueを作成
gh issue create \
  --title "Fix: Database connection timeout" \
  --body "本番環境でDB接続タイムアウト" \
  --label "🐛 type:bug" \
  --label "🔥 priority:P0-Critical" \
  --label "🚨 severity:Sev.1-Critical" \
  --label "📥 state:pending" \
  --label "🤖 trigger:agent-execute"

# 2. 自動実行を確認
# → trigger:agent-execute により即座にAgentが起動
```

---

### 演習3: ラベルフィルタリング

```bash
# 全ての pending Issues
gh issue list --label "state:pending"

# P0-Critical のバグ
gh issue list --label "priority:P0-Critical,type:bug"

# 完了したIssue
gh issue list --label "state:done" --state closed
```

---

## 次のステップ

### このチュートリアルで学んだこと ✅

- ✅ Label Systemの重要性
- ✅ 10カテゴリ・53ラベルの概要
- ✅ Agentとラベルの連携
- ✅ 実践的なラベル付与
- ✅ ベストプラクティス

### 次に学ぶこと

- [ ] **カスタムAgent作成** - 独自のAgentを実装
- [ ] **GitHub OS Integration** - GitHub をOSとして活用
- [ ] **高度なワークフロー** - 複雑なタスクの自動化

---

## 📚 参考ドキュメント

- **[LABEL_SYSTEM_GUIDE.md](../LABEL_SYSTEM_GUIDE.md)** - 53ラベル完全ガイド
- **[ENTITY_RELATION_MODEL.md](../ENTITY_RELATION_MODEL.md)** - Entity-Relationモデル
- **[AGENT_SDK_LABEL_INTEGRATION.md](../AGENT_SDK_LABEL_INTEGRATION.md)** - Agent × Label連携

---

**⬅ 前のページ**: [並列実行の実践](03-parallel-execution.md)

**🏠 チュートリアルTOP**: [Miyabi入門](01-introduction.md)

---

🤖 Generated with Claude Code
