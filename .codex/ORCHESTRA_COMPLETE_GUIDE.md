# 🎭 Miyabi Orchestra - 完全運用ガイド

**Version**: 1.1.0
**Last Updated**: 2025-11-06
**Status**: Production Ready ✅

**🔄 Latest Updates (v1.1.0)**:
- ✅ tmux send-keys sleep time updated to 0.5s (was 0.1s)
- ✅ MCP integration steps documented
- ✅ Manual mode instructions clarified
- ✅ Environment requirements updated
- ✅ Cross-links to Workflow DSL guidance added

---

## 📋 概要

このガイドは、Miyabi Orchestra の**完全な運用標準**を定義します。全ての操作は再現可能で、標準化されています。

---

## 🚀 Quick Start - 1コマンドで環境構築

```bash
./scripts/miyabi-orchestra-bootstrap.sh
```

このコマンドで以下が自動的にセットアップされます：

✅ tmux session "miyabi-orchestra" 作成
✅ 4 windows with 標準レイアウト
✅ 11 agents (Coding: 4, Business: 3, Control: 3, Utilities: 2)
✅ Dashboard monitoring (自動更新)
✅ Auto-healing system (30秒間隔)
✅ UI/UX enhancements (大きな文字・強い色)

---

## 📐 標準環境構成

### Window 1: Main Control (3 panes)

| Pane | Role | Title | Purpose |
|------|------|-------|---------|
| 0 | Conductor | 🎼 CONDUCTOR | メイン制御・タスク調整 |
| 1 | Dashboard | 📊 DASHBOARD | リアルタイム状態監視 |
| 2 | Auto-Heal | 🤖 AUTO-HEAL | 自動問題検知・修復 |

### Window 2: Core Coding Agents (4 panes)

| Pane | Agent | Character | Role |
|------|-------|-----------|------|
| 0 | CodeGenAgent | 🎹 カエデ | コード実装 |
| 1 | ReviewAgent | 🎺 サクラ | コードレビュー |
| 2 | PRAgent | 🥁 ツバキ | PR作成 |
| 3 | DeploymentAgent | 🎷 ボタン | デプロイ |

### Window 3: Business Agents (3 panes)

| Pane | Agent | Character | Role |
|------|-------|-----------|------|
| 0 | MarketResearchAgent | 🎻 スミレ | 市場調査 |
| 1 | AnalyticsAgent | 📊 カスミ | データ分析 |
| 2 | ContentCreationAgent | 📈 アヤメ | コンテンツ作成 |

### Window 4: Utilities (2 panes)

| Pane | Role | Purpose |
|------|------|---------|
| 0 | CLI Terminal | 手動コマンド実行 |
| 1 | Log Viewer | Auto-healログ監視 |

---

## 🔄 タスクライフサイクル

### タスク開始

```bash
./scripts/miyabi-task-lifecycle.sh start <issue_number> <agent_name> <agent_pane>
```

**Example**:
```bash
./scripts/miyabi-task-lifecycle.sh start 679 カエデ %8
```

**実行される処理**:
1. Git Worktree作成 (`.worktrees/issue-679`)
2. Worktreeへ移動
3. Conductorへ作業開始を報告
4. Agent skill実行準備完了

### タスク終了

```bash
./scripts/miyabi-task-lifecycle.sh end <issue_number> <agent_name> <agent_pane>
```

**Example**:
```bash
./scripts/miyabi-task-lifecycle.sh end 679 カエデ %8
```

**実行される処理**:
1. Conductorへ完了を報告
2. メインブランチへ戻る
3. Worktree削除
4. ローカルブランチ削除
5. Agent記憶リセット (/clear)

### セッション終了時のクリーンアップ

```bash
./scripts/miyabi-task-lifecycle.sh cleanup
```

**実行される処理**:
1. 全Worktree削除
2. 全Agent記憶リセット
3. タスクキュークリア
4. ログアーカイブ

---

## 🤖 自動監視・修復システム

### Auto-Heal機能

**監視間隔**: 30秒

**チェック項目**:
- ✅ Crashed agent検知 → Claude Code自動再起動
- ✅ Idle agent + Pending task → タスク自動割り当て
- ✅ Paneタイトル更新
- ✅ Healthスコア計算

**ログ**:
```bash
tail -f .ai/logs/auto-heal.log
```

### Health Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 90%+ | 🟢 Healthy | なし |
| 70-89% | 🟡 Degraded | 警告 |
| <70% | 🔴 Unhealthy | 自動修復 |

---

## 🎨 UI/UX標準

### 視認性の原則

1. **大きな文字** - paneタイトルは大きなアイコン + 明確な役割名
2. **強い色** - アクティブpaneは明るい黄色（#FFE700）
3. **明確なハイライト** - 背景色で視覚的階層を構築

### 適用コマンド

```bash
./scripts/miyabi-uiux-enhance.sh
```

### 推奨ターミナル設定

**フォントサイズ**: 16pt - 18pt
**推奨フォント**: Nerd Font系 (FiraCode, Hack, JetBrains Mono)

---

## 📚 スクリプト一覧

### Setup & Bootstrap

| Script | Purpose | Usage |
|--------|---------|-------|
| `miyabi-orchestra-bootstrap.sh` | 完全環境構築 | `./scripts/miyabi-orchestra-bootstrap.sh` |
| `miyabi-orchestra.sh` | レガシー起動 | `./scripts/miyabi-orchestra.sh coding-ensemble` |

### Monitoring

| Script | Purpose | Usage |
|--------|---------|-------|
| `miyabi-dashboard.sh` | リアルタイム監視 | `./scripts/miyabi-dashboard.sh watch` |
| `miyabi-auto-heal.sh` | 自動修復（1回） | `./scripts/miyabi-auto-heal.sh` |
| `miyabi-auto-heal-watch.sh` | 自動修復（監視モード） | `./scripts/miyabi-auto-heal-watch.sh` |

### Lifecycle

| Script | Purpose | Usage |
|--------|---------|-------|
| `miyabi-task-lifecycle.sh` | タスク管理 | `./scripts/miyabi-task-lifecycle.sh start 679 カエデ %8` |

### UI/UX

| Script | Purpose | Usage |
|--------|---------|-------|
| `miyabi-uiux-enhance.sh` | UI/UX改善 | `./scripts/miyabi-uiux-enhance.sh` |

---

## ⌨️ Quick Commands

```bash
# Attach to session
mo

# Dashboard (once)
./scripts/miyabi-dashboard.sh once

# Dashboard (watch mode)
./scripts/miyabi-dashboard.sh watch

# Auto-heal (once)
./scripts/miyabi-auto-heal.sh

# Task start
./scripts/miyabi-task-lifecycle.sh start 679 カエデ %8

# Task end
./scripts/miyabi-task-lifecycle.sh end 679 カエデ %8

# Session cleanup
./scripts/miyabi-task-lifecycle.sh cleanup
```

---

## 🔗 関連ドキュメント

### Orchestra System
- **Parallel Orchestra Philosophy**: [MIYABI_PARALLEL_ORCHESTRA.md](.claude/MIYABI_PARALLEL_ORCHESTRA.md) - 雅なる並列実行の哲学
- **Orchestra Integration**: [MIYABI_ORCHESTRA_INTEGRATION.md](.claude/MIYABI_ORCHESTRA_INTEGRATION.md) - miyabi_def統合ガイド
- **Orchestra Config**: [orchestra-config.yaml](.claude/orchestra-config.yaml) - Master configuration
- **Config Schema**: [schemas/orchestra-config.schema.yaml](.claude/schemas/orchestra-config.schema.yaml) - YAML validation

### Quick Start
- **3-Step Setup**: [QUICK_START_3STEPS.md](docs/QUICK_START_3STEPS.md) - 3分でセットアップ
- **tmux Quickstart**: [TMUX_QUICKSTART.md](docs/TMUX_QUICKSTART.md) - 5分入門
- **Visual Guide**: [VISUAL_GUIDE.md](docs/VISUAL_GUIDE.md) - UI/UX最適化

### Technical Details
- **Tmux Operations**: [TMUX_OPERATIONS.md](.claude/TMUX_OPERATIONS.md) - tmux技術詳細
- **Agent Specs**: [agents/specs/](.claude/agents/specs/) - 21 Agent仕様
- **Workflow DSL**: [context/workflows.md](.claude/context/workflows.md) - ワークフロー定義

### MCP Integration
- **MCP Protocol**: [MCP_INTEGRATION_PROTOCOL.md](.claude/MCP_INTEGRATION_PROTOCOL.md) - MCP統合手順
- **Miyabi MCP Server**: [crates/miyabi-mcp-server/](crates/miyabi-mcp-server/) - MCP server実装

---

## 📝 Communication Protocol

### 報告フォーマット

```
[{agent_name}] {message}
```

**Examples**:
```
[カエデ] Issue #679 実装完了
[サクラ] コードレビュー完了。品質スコア: 88/100
[ツバキ] PR #680 作成完了
```

### tmux send-keys Protocol

**Strict Syntax** (必須):
```bash
tmux send-keys -t {pane_id} "{message}" && sleep 0.5 && tmux send-keys -t {pane_id} Enter
```

**⚠️ 重要変更 (2025-11-06)**:
- `sleep` 時間を `0.1s` → `0.5s` に変更
- **理由**: メッセージ送信とEnter確定を確実に分離し、安定性を向上
- 以前の `0.1s` では不安定な動作が報告されていました

**Technical Details**:
- tmux の内部バッファに確実にメッセージを書き込むため
- Claude Code の入力処理との同期を取るため
- 特に長いメッセージの場合に重要

---

## 🎯 Best Practices

### ✅ DO

1. 常に `miyabi-orchestra-bootstrap.sh` で環境を構築
2. タスク開始時は必ず `miyabi-task-lifecycle.sh start` を使用
3. タスク終了時は必ず `miyabi-task-lifecycle.sh end` を使用
4. セッション終了時は `miyabi-task-lifecycle.sh cleanup` を実行
5. Auto-healシステムを常時稼働

### ❌ DON'T

1. 手動でWorktree作成/削除しない
2. Agent記憶リセットを忘れない
3. タスク割り当てを報告なしで実行しない
4. UI/UX設定をスキップしない

---

## 🐛 Troubleshooting

### 問題: Session already exists

```bash
tmux kill-session -t miyabi-orchestra
./scripts/miyabi-orchestra-bootstrap.sh
```

### 問題: Agent crashed

Auto-healシステムが30秒以内に自動修復します。手動で修復する場合：

```bash
./scripts/miyabi-auto-heal.sh
```

### 問題: UI/UXが適用されない

```bash
./scripts/miyabi-uiux-enhance.sh
```

### 問題: Worktreeが残っている

```bash
./scripts/miyabi-task-lifecycle.sh cleanup
```

---

## 📊 Metrics & Monitoring

### Log Files

| Log | Location | Purpose |
|-----|----------|---------|
| Auto-heal | `.ai/logs/auto-heal.log` | 自動修復履歴 |
| Task lifecycle | `.ai/logs/task-lifecycle.log` | タスクライフサイクル |
| Performance | `.ai/metrics/performance-metrics.json` | パフォーマンス指標 |

### Real-time Monitoring

Dashboard は以下を監視：
- Active agents count
- Idle agents count
- Crashed agents count
- Health score
- Active tasks
- Window/Pane status

---

## 🎓 まとめ

この完全運用ガイドに従うことで：

✅ **再現性**: 毎回同じ環境を構築可能
✅ **自動化**: 問題検知・修復が自動
✅ **標準化**: 全ての操作が統一
✅ **視認性**: UI/UXが最適化
✅ **信頼性**: タスクライフサイクルが確立

---

**🎭 Miyabi Orchestra - Where Standards Meet Excellence**
