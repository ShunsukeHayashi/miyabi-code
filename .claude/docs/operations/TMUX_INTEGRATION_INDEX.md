# 🎭 Miyabi Orchestra - tmux Integration Index

**Last Updated**: 2025-11-03
**Version**: 1.0.0

---

## 📚 ドキュメント体系

Miyabi Orchestraのtmux並列実行システムは、以下の階層構造でドキュメント化されています。

```
レベル0: Codex原理
    ↓
レベル1: Miyabi哲学
    ↓
レベル2: 技術実装
    ↓
レベル3: ユーザーガイド
```

---

## 📖 レベル0: Codex原理（Claude Code Company）

### `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md` ⭐ NEW

**目的**: Claude Code Companyの原理をMiyabi Orchestra用に統合

**内容**:
- メインpaneと部下paneによるタスク分散の概念
- 基本スタイル定義（`cd + 指示 && sleep 0.1 && Enter`）
- タスク割り当てと報告（報連相）プロトコル
- トークン管理と状況確認
- ベストプラクティス
- トラブルシューティング
- 実践例：Issue #270を4人のAgentで処理

**対象読者**: システム設計者、上級ユーザー

**トークン数**: ~3,000 tokens

**リンク**: [CODEX_TMUX_PARALLEL_EXECUTION.md](./CODEX_TMUX_PARALLEL_EXECUTION.md)

---

## 🌸 レベル1: Miyabi哲学

### `.claude/MIYABI_PARALLEL_ORCHESTRA.md`

**目的**: 雅なる並列実行の哲学とコンセプト

**内容**:
- 21 Agentsとしてのオーケストラメタファー
- Conductor-Agent間の関係性
- 3つの実行パターン（Sequential, Parallel, Hybrid）
- 5-pane Coding Ensemble / 7-pane Hybrid Ensemble
- Agent Character設定（カエデ、サクラ、ツバキ、ボタン）

**対象読者**: 全ユーザー、特に初心者

**トークン数**: ~2,500 tokens

**リンク**: [MIYABI_PARALLEL_ORCHESTRA.md](./MIYABI_PARALLEL_ORCHESTRA.md)

---

## 🔧 レベル2: 技術実装

### `.claude/TMUX_OPERATIONS.md`

**目的**: tmux操作の技術詳細

**内容**:
- tmux基本コマンド
- pane管理
- window管理
- session管理
- Kamui設定との統合

**対象読者**: 技術者、カスタマイズ希望者

**トークン数**: ~2,000 tokens

**リンク**: [TMUX_OPERATIONS.md](./TMUX_OPERATIONS.md)

### `.claude/KAMUI_TMUX_GUIDE.md`

**目的**: Kamui tmux設定専用ガイド

**内容**:
- Kamui設定の特徴（Ctrl-a prefix）
- Kamui固有のキーバインド
- Miyabi Orchestraとの統合方法

**対象読者**: Kamuiユーザー

**トークン数**: ~1,500 tokens

**リンク**: [KAMUI_TMUX_GUIDE.md](./KAMUI_TMUX_GUIDE.md)

### `.claude/TMUX_ADVANCED_TECHNIQUES.md` ⭐ NEW

**目的**: Claude Code CLI完全活用と高度な並列実行

**内容**:
- Claude Code CLI全フラグ解説
- カスタムサブエージェント（`--agents`）
- miyabi_def統合パターン
- 高度な並列実行（階層的タスク分散、並列レビュー）
- Agent間通信
- パフォーマンスチューニング
- JSON出力活用

**対象読者**: 上級ユーザー、システムアーキテクト

**トークン数**: ~4,500 tokens

**リンク**: [TMUX_ADVANCED_TECHNIQUES.md](./TMUX_ADVANCED_TECHNIQUES.md)

---

## 📊 レベル3: ユーザーガイド

### `docs/CLAUDE_CODE_COMMANDS.md` ⭐ 基本スタイル統一済み

**目的**: Claude Code対応ワンライナーコマンド集

**内容**:
- 基本スタイル説明
- クイックテストコマンド
- 全Agent起動コマンド
- 実践タスクコマンド
- Agent管理コマンド
- テンプレート集
- トラブルシューティング

**対象読者**: 全ユーザー（最も頻繁に参照）

**トークン数**: ~2,000 tokens

**リンク**: [../docs/CLAUDE_CODE_COMMANDS.md](../docs/CLAUDE_CODE_COMMANDS.md)

### `docs/YOUR_CURRENT_SETUP.md` ⭐ 基本スタイル統一済み

**目的**: ユーザー固有の環境設定ガイド

**内容**:
- 現在のpane構成（%1, %2, %5, %3, %4）
- すぐに試せるコマンド（3パターン）
- Agent操作コマンド
- pane操作（Kamui版）
- コピペ用テンプレート
- 実践例：Issue #270を4人で処理

**対象読者**: 現在の環境で作業するユーザー

**トークン数**: ~1,800 tokens

**リンク**: [../docs/YOUR_CURRENT_SETUP.md](../docs/YOUR_CURRENT_SETUP.md)

### `docs/VISUAL_GUIDE.md` ⭐ 基本スタイル統一済み

**目的**: UI/UX改善ガイド

**内容**:
- Paneタイトル表示
- アクティブPane強調
- Kamuiテーマ互換
- Beautificationスクリプト使用方法
- ダッシュボード使用方法
- 操作チートシート

**対象読者**: UI/UX重視のユーザー

**トークン数**: ~1,500 tokens

**リンク**: [../docs/VISUAL_GUIDE.md](../docs/VISUAL_GUIDE.md)

### `docs/QUICK_START_3STEPS.md`

**目的**: 3ステップで開始

**内容**:
- Step 1: 環境確認
- Step 2: Orchestra起動
- Step 3: 最初のタスク実行

**対象読者**: 初心者

**トークン数**: ~800 tokens

**リンク**: [../docs/QUICK_START_3STEPS.md](../docs/QUICK_START_3STEPS.md)

### `docs/TMUX_LAYOUTS.md`

**目的**: tmuxレイアウトパターン集

**内容**:
- 5-pane Coding Ensemble
- 7-pane Hybrid Ensemble
- カスタムレイアウト作成方法

**対象読者**: レイアウトカスタマイズ希望者

**トークン数**: ~1,200 tokens

**リンク**: [../docs/TMUX_LAYOUTS.md](../docs/TMUX_LAYOUTS.md)

---

## 🔗 Context統合

### `.claude/context/INDEX.md` (更新済み)

**tmux Parallel Executionセクション**:
```markdown
**tmux Parallel Execution** (Claude Code Company統合):
- **Codex Integration**: .claude/CODEX_TMUX_PARALLEL_EXECUTION.md ⭐ NEW
- Philosophy: .claude/MIYABI_PARALLEL_ORCHESTRA.md
- Commands: docs/CLAUDE_CODE_COMMANDS.md
- Your Setup: docs/YOUR_CURRENT_SETUP.md
- Visual Guide: docs/VISUAL_GUIDE.md
```

**リンク**: [context/INDEX.md](./context/INDEX.md)

---

## 🎯 使用ガイドライン

### ドキュメント選択フローチャート

```
質問: 何を知りたいですか？

├─ 「そもそもこのシステムは何？」
│   → MIYABI_PARALLEL_ORCHESTRA.md (哲学)
│
├─ 「原理を深く理解したい」
│   → CODEX_TMUX_PARALLEL_EXECUTION.md (Codex原理)
│
├─ 「今すぐコマンドを実行したい」
│   → docs/CLAUDE_CODE_COMMANDS.md (コマンド集)
│
├─ 「自分の環境で動かしたい」
│   → docs/YOUR_CURRENT_SETUP.md (カスタム構成)
│
├─ 「見た目を良くしたい」
│   → docs/VISUAL_GUIDE.md (UI/UX改善)
│
├─ 「tmuxの技術詳細を知りたい」
│   → TMUX_OPERATIONS.md (技術実装)
│
├─ 「Kamui設定を使っている」
│   → KAMUI_TMUX_GUIDE.md (Kamui専用)
│
└─ 「高度なテクニックを知りたい」
    → TMUX_ADVANCED_TECHNIQUES.md (CLI完全活用、miyabi_def統合)
```

### 学習パス

**初心者向け（推奨順序）**:
1. `MIYABI_PARALLEL_ORCHESTRA.md` - 哲学理解
2. `docs/QUICK_START_3STEPS.md` - 3ステップ開始
3. `docs/CLAUDE_CODE_COMMANDS.md` - コマンド習得
4. `docs/YOUR_CURRENT_SETUP.md` - 環境適用
5. `docs/VISUAL_GUIDE.md` - UI改善

**上級者向け（推奨順序）**:
1. `CODEX_TMUX_PARALLEL_EXECUTION.md` - 原理理解
2. `TMUX_OPERATIONS.md` - 技術詳細
3. `TMUX_ADVANCED_TECHNIQUES.md` ⭐ NEW - CLI完全活用、miyabi_def統合
4. `docs/CLAUDE_CODE_COMMANDS.md` - コマンドマスター
5. カスタマイズ実践

---

## 🛠️ スクリプト統合

### メインスクリプト

| スクリプト | 場所 | 用途 |
|-----------|------|------|
| `miyabi-orchestra.sh` | `scripts/` | CLI起動（5-pane/7-pane） |
| `miyabi-orchestra-interactive.sh` | `scripts/` | インタラクティブセットアップ |
| `miyabi-pane-beautify.sh` | `scripts/` | Pane視覚化 |
| `miyabi-dashboard.sh` | `scripts/` | リアルタイムダッシュボード |

### スクリプト実行例

```bash
# インタラクティブセットアップ
./scripts/miyabi-orchestra-interactive.sh

# Beautification適用
./scripts/miyabi-pane-beautify.sh

# Dashboard表示
./scripts/miyabi-dashboard.sh

# ダッシュボード自動更新（5秒ごと）
watch -n 5 ./scripts/miyabi-dashboard.sh
```

---

## 📝 基本スタイル統一状況

### ✅ 統一済みドキュメント

全てのコマンド例が以下の基本スタイルで統一されています：

```bash
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [指示内容]" && sleep 0.1 && tmux send-keys -t %N Enter
```

**統一済みファイル**:
- ✅ `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md`
- ✅ `docs/CLAUDE_CODE_COMMANDS.md`
- ✅ `docs/YOUR_CURRENT_SETUP.md`
- ✅ `docs/VISUAL_GUIDE.md`

---

## 🚀 クイックリファレンス

### 最もよく使うコマンド

**1. 最初のテスト**:
```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。準備ができたら [カエデ] 準備OK と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**2. 全Agent起動**:
```bash
# カエデ
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」- Miyabi CodeGenAgentです。準備完了したら [カエデ] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」- Miyabi ReviewAgentです。準備完了したら [サクラ] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」- Miyabi PRAgentです。準備完了したら [ツバキ] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter

# ボタン
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」- Miyabi DeploymentAgentです。準備完了したら [ボタン] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

**3. Agent状態確認**:
```bash
# 全Agent一括確認
for pane in %2 %5 %3 %4; do echo "=== $pane ==="; tmux capture-pane -t $pane -p | tail -5; echo ""; done
```

**4. pane移動**:
```
Ctrl-a + 2  # カエデ
Ctrl-a + 3  # サクラ
Ctrl-a + 4  # ツバキ
Ctrl-a + 5  # ボタン
Ctrl-a + 1  # Conductor（戻る）
```

---

## 📊 トークン使用量

| ドキュメント | トークン数（推定） | 優先度 |
|-------------|------------------|--------|
| TMUX_ADVANCED_TECHNIQUES.md ⭐ NEW | ~4,500 | ⭐⭐⭐⭐⭐ |
| CODEX_TMUX_PARALLEL_EXECUTION.md | ~3,000 | ⭐⭐⭐⭐⭐ |
| MIYABI_PARALLEL_ORCHESTRA.md | ~2,500 | ⭐⭐⭐⭐ |
| TMUX_OPERATIONS.md | ~2,000 | ⭐⭐⭐ |
| CLAUDE_CODE_COMMANDS.md | ~2,000 | ⭐⭐⭐⭐⭐ |
| YOUR_CURRENT_SETUP.md | ~1,800 | ⭐⭐⭐⭐ |
| VISUAL_GUIDE.md | ~1,500 | ⭐⭐⭐ |
| KAMUI_TMUX_GUIDE.md | ~1,500 | ⭐⭐⭐ |
| QUICK_START_3STEPS.md | ~800 | ⭐⭐⭐⭐ |
| TMUX_LAYOUTS.md | ~1,200 | ⭐⭐ |

**合計**: ~20,800 tokens

---

## 🔄 更新履歴

### 2025-11-03
- ✅ `CODEX_TMUX_PARALLEL_EXECUTION.md` 作成（Claude Code Company原理統合）
- ✅ `TMUX_ADVANCED_TECHNIQUES.md` 作成（CLI完全活用、miyabi_def統合） ⭐ NEW
- ✅ 全コマンド例を基本スタイルに統一
- ✅ `context/INDEX.md` にtmux Parallel Executionセクション追加
- ✅ `CLAUDE.md` のドキュメントリンク更新
- ✅ このインデックスファイル作成・更新

### 2025-11-02
- Visual Guide作成（UI/UX改善）
- Pane beautificationスクリプト作成
- Dashboardスクリプト作成

### 2025-11-01
- Miyabi Parallel Orchestra哲学ドキュメント作成
- Kamui tmuxガイド作成
- Claude Code対応コマンド集作成

---

## 📚 関連リンク

**メインドキュメント**:
- [CLAUDE.md](../CLAUDE.md) - プロジェクトルート
- [AGENTS.md](../AGENTS.md) - Agent詳細
- [README.md](../README.md) - プロジェクト概要

**Context Modules**:
- [context/INDEX.md](./context/INDEX.md) - Context索引
- [context/agents.md](./context/agents.md) - Agent概要
- [context/worktree.md](./context/worktree.md) - Worktree管理

**外部リソース**:
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [tmux Documentation](https://github.com/tmux/tmux/wiki)
- [Kamui tmux](https://github.com/tmux-plugins/kamui)

---

**🎭 Miyabi Orchestra - tmux Integration Index**

**Maintained by**: Miyabi Team
**Last Updated**: 2025-11-03
**Version**: 1.0.0
