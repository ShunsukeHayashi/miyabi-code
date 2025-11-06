# Miyabi tmux Operations Guide

**Last Updated**: 2025-11-03
**Version**: 1.0.0

MiyabiエージェントをtmuxベースのClaude Code Companyとして組織化し、並列実行するガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [実行パターン](#実行パターン)
4. [報連相プロトコル](#報連相プロトコル)
5. [ベストプラクティス](#ベストプラクティス)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Miyabi並列実行の2つのアプローチ

**Approach A: Miyabi CLI直接実行** (推奨)
```bash
# Git Worktreeベースの並列実行（Miyabi標準機能）
miyabi parallel --issues 270,271,272 --concurrency 3
miyabi infinity  # 全Issue自動処理
```

**Approach B: tmux + Claude Code Company** (柔軟性重視)
```bash
# tmux paneで複数Claude Codeインスタンスを起動
# 各paneで異なるエージェントを実行
# メインpaneでコーディネート
```

このドキュメントでは **Approach B** の詳細を解説します。

### なぜtmuxアプローチが有効か？

| Aspect | Miyabi CLI (`parallel`) | tmux + Claude Code |
|--------|------------------------|-------------------|
| **セットアップ** | 不要 | tmux pane構成が必要 |
| **並列度** | `--concurrency` で指定 | pane数で制御 |
| **エージェント種類** | CoordinatorAgentのみ | 全21エージェント可 |
| **柔軟性** | 構造化された処理 | アドホックなタスク配分 |
| **報連相** | 自動（ログ） | 明示的（tmux send-keys） |
| **トークン管理** | 自動 | 手動（/clear必要） |
| **適用場面** | Issue大量処理 | 多様なエージェント同時実行 |

**推奨**: 定型Issue処理は `miyabi parallel`、異種エージェント同時実行はtmuxアプローチ。

---

## セットアップ

### 1. Claude Codeエイリアス設定

```bash
# ~/.zshrc または ~/.bashrc に追加
alias cc="claude --dangerously-skip-permissions"
```

⚠️ **注意**: `--dangerously-skip-permissions` は自己責任で使用してください。

### 2. tmux pane構成作成

#### パターンA: 5-pane構成（Coding Agents特化）

```bash
# Main (pane 0) + 4 Coding Agents
tmux split-window -h && \
tmux split-window -v && \
tmux select-pane -t 0 && \
tmux split-window -v && \
tmux select-pane -t 2 && \
tmux split-window -v

# pane構成確認
tmux list-panes -F "#{pane_index}: #{pane_id} #{pane_current_command} #{pane_active}"
```

**出力例**:
```
0: %22 zsh 1  ← Conductor (Main pane)
1: %27 zsh 0  ← CodeGen Agent
2: %28 zsh 0  ← Review Agent
3: %25 zsh 0  ← PR Agent
4: %29 zsh 0  ← Deployment Agent
```

#### パターンB: 7-pane構成（Coding + Business Agents）

```bash
# Main (pane 0) + 3 Coding + 3 Business
tmux split-window -h && \
tmux split-window -v && \
tmux split-window -v && \
tmux select-pane -t 0 && \
tmux split-window -v && \
tmux split-window -v && \
tmux select-pane -t 0

# Ctrl-b + Space で自動レイアウト調整
```

**構成例**:
```
0: Conductor (Main pane)
1: CodeGenAgent
2: ReviewAgent
3: PRAgent
4: MarketResearchAgent
5: ContentCreationAgent
6: AnalyticsAgent
```

### 3. Claude Code起動

#### ⚠️ 重要: pane ID確認

```bash
# 実際のpane IDを確認（%22, %27等は環境依存）
tmux list-panes -F "#{pane_index}: #{pane_id}"
```

#### 全pane並列起動

```bash
# 実際のpane IDに置き換えて実行
tmux send-keys -t %27 "cc" && sleep 0.1 && tmux send-keys -t %27 Enter & \
tmux send-keys -t %28 "cc" && sleep 0.1 && tmux send-keys -t %28 Enter & \
tmux send-keys -t %25 "cc" && sleep 0.1 && tmux send-keys -t %25 Enter & \
tmux send-keys -t %29 "cc" && sleep 0.1 && tmux send-keys -t %29 Enter & \
wait
```

---

## 実行パターン

### パターン1: 単一Issue → 複数エージェントパイプライン

Issue #270を4エージェントで順次処理：

```bash
# pane 1: CodeGenAgent
tmux send-keys -t %27 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane1 CodeGenAgentです。Issue #270のコード実装を担当。\
完了後は[pane1]でtmux send-keys -t %22 '[pane1] コード実装完了' && \
sleep 0.1 && tmux send-keys -t %22 Enter で報告" && \
sleep 0.1 && tmux send-keys -t %27 Enter &

# pane 2: ReviewAgent (pane1完了後に起動)
tmux send-keys -t %28 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane2 ReviewAgentです。pane1完了後にIssue #270のコードレビュー実施。\
完了後は[pane2]で報告" && \
sleep 0.1 && tmux send-keys -t %28 Enter &

# pane 3: PRAgent (pane2完了後に起動)
tmux send-keys -t %25 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane3 PRAgentです。pane2完了後にIssue #270のPR作成。\
完了後は[pane3]で報告" && \
sleep 0.1 && tmux send-keys -t %25 Enter &

wait
```

### パターン2: 複数Issue → 並列処理

Issue #270, #271, #272を3つのpaneで並列処理：

```bash
# pane 1: Issue #270
tmux send-keys -t %27 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane1です。Issue #270をCoordinatorAgentとして処理。\
agent-executionスキルを使用してください。\
miyabi agent coordinator --issue 270 相当の処理を実施。\
完了後は[pane1]でtmux send-keys -t %22 '[pane1] Issue #270完了' && \
sleep 0.1 && tmux send-keys -t %22 Enter で報告" && \
sleep 0.1 && tmux send-keys -t %27 Enter &

# pane 2: Issue #271
tmux send-keys -t %28 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane2です。Issue #271を処理。[pane2]で報告" && \
sleep 0.1 && tmux send-keys -t %28 Enter &

# pane 3: Issue #272
tmux send-keys -t %25 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane3です。Issue #272を処理。[pane3]で報告" && \
sleep 0.1 && tmux send-keys -t %25 Enter &

wait
```

### パターン3: Coding + Business Agents並列実行

技術実装とビジネス戦略を同時進行：

```bash
# pane 1: CodeGenAgent - 技術実装
tmux send-keys -t %27 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane1 CodeGenAgentです。Issue #270の実装担当。\
agent-executionスキル または rust-developmentスキル使用。\
完了後は[pane1]で報告" && \
sleep 0.1 && tmux send-keys -t %27 Enter &

# pane 4: MarketResearchAgent - 市場調査
tmux send-keys -t %29 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane4 MarketResearchAgentです。Issue #300の市場調査担当。\
miyabi agent market-research --issue 300 相当の処理を実施。\
完了後は[pane4]で報告" && \
sleep 0.1 && tmux send-keys -t %29 Enter &

# pane 5: ContentCreationAgent - コンテンツ制作
tmux send-keys -t %30 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane5 ContentCreationAgentです。Issue #301のコンテンツ制作担当。\
miyabi agent content-creation --issue 301 相当の処理を実施。\
完了後は[pane5]で報告" && \
sleep 0.1 && tmux send-keys -t %30 Enter &

wait
```

### パターン4: Miyabiスキル活用（推奨）

Claude Codeのスキルを明示的に使用：

```bash
# pane 1: agent-execution スキル
tmux send-keys -t %27 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane1です。agent-executionスキルを使用してIssue #270を処理。\
Skill tool with command 'agent-execution' を実行してください。\
完了後は[pane1]で報告" && \
sleep 0.1 && tmux send-keys -t %27 Enter &

# pane 2: rust-development スキル
tmux send-keys -t %28 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane2です。rust-developmentスキルでビルド・テスト実行。\
Skill tool with command 'rust-development' を実行してください。\
完了後は[pane2]で報告" && \
sleep 0.1 && tmux send-keys -t %28 Enter &

# pane 3: security-audit スキル
tmux send-keys -t %25 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane3です。security-auditスキルでセキュリティスキャン実行。\
Skill tool with command 'security-audit' を実行してください。\
完了後は[pane3]で報告" && \
sleep 0.1 && tmux send-keys -t %25 Enter &

wait
```

---

## 報連相プロトコル

### 部下 → メインへの報告

各paneのClaude（部下）は以下のワンライナーでメインpane（%22）に報告：

```bash
tmux send-keys -t %22 '[pane番号] 報告内容' && sleep 0.1 && tmux send-keys -t %22 Enter
```

### 報告例テンプレート

**成功報告**:
```bash
tmux send-keys -t %22 '[pane1] Issue #270 コード実装完了。46行追加、3テスト追加。' && sleep 0.1 && tmux send-keys -t %22 Enter
```

**エラー報告**:
```bash
tmux send-keys -t %22 '[pane2] エラー発生: cargo build failed。詳細: error[E0308] mismatched types' && sleep 0.1 && tmux send-keys -t %22 Enter
```

**進捗報告**:
```bash
tmux send-keys -t %22 '[pane3] PR作成中。現在コミットメッセージ作成中。完了まで2分予定。' && sleep 0.1 && tmux send-keys -t %22 Enter
```

**質問・エスカレーション**:
```bash
tmux send-keys -t %22 '[pane4] 確認: MarketResearchAgentの出力形式はMarkdownでよいですか？' && sleep 0.1 && tmux send-keys -t %22 Enter
```

### メイン → 部下への指示

```bash
# 個別指示
tmux send-keys -t %27 "Issue #270のテストカバレッジを80%以上にしてください" && sleep 0.1 && tmux send-keys -t %27 Enter

# 全体指示（ブロードキャスト）
for pane in %27 %28 %25 %29; do
    tmux send-keys -t $pane "現在の作業を一時停止して、進捗を[pane番号]で報告してください" && sleep 0.1 && tmux send-keys -t $pane Enter
done
```

---

## トークン管理

### /clear実行タイミング

部下（各pane）は自分で `/clear` できないため、メインが判断して実行：

**実行基準**:
1. ✅ タスク完了時（新タスクに集中させる）
2. ✅ トークン使用量が高い時（`ccusage`で確認）
3. ✅ エラー頻発時（コンテキストリセット）
4. ✅ 複雑 → 単純タスク切替時

### 個別/clear

```bash
tmux send-keys -t %27 "/clear" && sleep 0.1 && tmux send-keys -t %27 Enter
```

### 全pane一括/clear

```bash
for pane in %27 %28 %25 %29 %30; do
    tmux send-keys -t $pane "/clear" && sleep 0.1 && tmux send-keys -t $pane Enter
    sleep 0.5  # pane間で少し間隔を開ける
done
```

### トークン使用量確認

```bash
# メインpaneで各paneの状況を確認
for pane in %27 %28 %25 %29; do
    echo "=== Pane $pane ==="
    tmux send-keys -t $pane "ccusage" && sleep 0.1 && tmux send-keys -t $pane Enter
    sleep 2
    tmux capture-pane -t $pane -p | tail -10
done
```

---

## 状況確認コマンド

### pane状況確認

```bash
# 各paneの最新出力（最後の10行）
tmux capture-pane -t %27 -p | tail -10
tmux capture-pane -t %28 -p | tail -10
```

### 全pane一括確認

```bash
for pane in %27 %28 %25 %29; do
    echo "=== Pane $pane ==="
    tmux capture-pane -t $pane -p | tail -5
    echo ""
done
```

### フリーズ検出

```bash
# 各paneが応答しているか確認（最終更新時刻チェック）
tmux list-panes -F "#{pane_id}: last activity #{pane_activity_string}"
```

---

## ベストプラクティス

### 1. 明確な役割分担

✅ **DO**:
```bash
"あなたはpane1 CodeGenAgentです。Issue #270のコード実装を担当。
完了条件: 全テストパス、clippy警告なし、cargo fmt適用済み。
完了後は[pane1]で報告してください。"
```

❌ **DON'T**:
```bash
"Issue #270をやってください"  # 役割・完了条件が不明確
```

### 2. Git Worktree活用

Miyabiは既にWorktree機能を持つため、tmuxとの併用でさらに強力に：

```bash
# メインpaneでWorktree作成
miyabi worktree create issue-270

# pane 1で該当Worktreeに移動
tmux send-keys -t %27 "cd .worktrees/issue-270 && \
あなたはpane1です。このWorktree内でIssue #270を処理。\
miyabi agent codegen --issue 270 を実行してください。" && \
sleep 0.1 && tmux send-keys -t %27 Enter
```

### 3. エラー対処プロトコル

```bash
"エラー発生時の対処:
1. エラーメッセージ全文を[pane番号]で報告
2. Web検索で解決策を調査（WebSearch tool使用）
3. 自力解決できない場合はエスカレーション
4. 解決後は成功事例として共有"
```

### 4. 並列度の適切な設定

| Concurrency | 適用場面 | トークン消費 | 推奨 |
|-------------|---------|------------|------|
| 2-3 panes | 小規模タスク | 低 | ⭐⭐⭐⭐⭐ |
| 4-5 panes | 中規模タスク | 中 | ⭐⭐⭐⭐ |
| 6-8 panes | 大規模タスク | 高 | ⭐⭐⭐ |
| 9+ panes | 超大規模タスク | 極高 | ⭐⭐ (注意) |

⚠️ **注意**: MAX($100)プランでも9+ panesは注意。従量課金プランは特に注意。

### 5. Skill優先原則

tmuxで直接 `miyabi agent` コマンドを実行するより、Claude Code Skillを優先：

✅ **推奨**:
```bash
"Skill tool with command 'agent-execution' を使用してIssue #270を処理"
```

❌ **非推奨**:
```bash
"miyabi agent coordinator --issue 270 を実行"  # Skill経由の方が柔軟
```

---

## トラブルシューティング

### 問題1: paneがフリーズ

**症状**: paneが応答しない、報告が来ない

**原因**:
- LLM処理中（長時間タスク）
- エラーで停止
- トークン枯渇

**対処**:
```bash
# 状況確認
tmux capture-pane -t %27 -p | tail -20

# 強制入力（Enter送信）
tmux send-keys -t %27 Enter

# 再起動が必要な場合
tmux send-keys -t %27 C-c  # Ctrl-C
tmux send-keys -t %27 "/clear" Enter
```

### 問題2: トークン消費が激しい

**症状**: すぐにトークン制限に達する

**原因**:
- 大量のファイル読み込み
- 長いコンテキスト
- 複雑なタスク

**対処**:
```bash
# 定期的な/clear実行
for pane in %27 %28 %25 %29; do
    tmux send-keys -t $pane "/clear" && sleep 0.1 && tmux send-keys -t $pane Enter
done

# タスク粒度を小さく
# ❌ "Issue #270の全実装"
# ✅ "Issue #270のステップ1: データ構造定義のみ"
```

### 問題3: 報告が届かない

**症状**: 部下からの報告がメインpaneに表示されない

**原因**:
- pane ID間違い
- tmux send-keys構文エラー

**対処**:
```bash
# pane ID再確認
tmux list-panes -F "#{pane_index}: #{pane_id}"

# 手動テスト
tmux send-keys -t %22 "test message" && sleep 0.1 && tmux send-keys -t %22 Enter

# 部下paneで直接テスト
# （部下pane内で実行）
tmux send-keys -t %22 '[pane1] 接続テスト' && sleep 0.1 && tmux send-keys -t %22 Enter
```

### 問題4: Git競合

**症状**: 複数paneで同じブランチを編集して競合

**原因**:
- Worktree未使用
- 同一ブランチでの並列編集

**対処**:
```bash
# Worktreeを使用（推奨）
miyabi worktree create issue-270  # pane1用
miyabi worktree create issue-271  # pane2用

# または、各paneで別ブランチ作成
tmux send-keys -t %27 "git checkout -b feature/issue-270-pane1" Enter
tmux send-keys -t %28 "git checkout -b feature/issue-271-pane2" Enter
```

---

## 実践例: フルワークフロー

### シナリオ: Issue #270-275の6件を並列処理

**構成**: Main + 6 panes

**Step 1: tmux構成作成**

```bash
# 7-pane構成作成
tmux split-window -h && \
tmux split-window -v && \
tmux split-window -v && \
tmux select-pane -t 0 && \
tmux split-window -v && \
tmux split-window -v && \
tmux select-pane -t 0 && \
tmux split-window -v

# pane確認
tmux list-panes -F "#{pane_index}: #{pane_id}"
```

**Step 2: Claude Code起動**

```bash
# 実際のpane IDに置き換えて実行
tmux send-keys -t %27 "cc" Enter & \
tmux send-keys -t %28 "cc" Enter & \
tmux send-keys -t %25 "cc" Enter & \
tmux send-keys -t %29 "cc" Enter & \
tmux send-keys -t %30 "cc" Enter & \
tmux send-keys -t %31 "cc" Enter & \
wait
```

**Step 3: タスク割り当て**

```bash
# pane 1: Issue #270
tmux send-keys -t %27 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane1です。Issue #270を処理。\
agent-executionスキル使用。完了後は[pane1]で報告" Enter &

# pane 2: Issue #271
tmux send-keys -t %28 "cd /Users/shunsuke/Dev/miyabi-private && \
あなたはpane2です。Issue #271を処理。\
agent-executionスキル使用。完了後は[pane2]で報告" Enter &

# pane 3-6: 同様に #272-275を割り当て
# ...

wait
```

**Step 4: 監視・調整**

```bash
# 定期的に全pane状況確認
watch -n 30 'for pane in %27 %28 %25 %29 %30 %31; do \
    echo "=== $pane ==="; \
    tmux capture-pane -t $pane -p | tail -3; \
done'
```

**Step 5: 完了後クリーンナップ**

```bash
# 全pane /clear
for pane in %27 %28 %25 %29 %30 %31; do
    tmux send-keys -t $pane "/clear" Enter
    sleep 0.5
done

# Worktree cleanup（Miyabi使用時）
miyabi worktree cleanup
```

---

## まとめ

### tmux vs Miyabi CLI比較

| 項目 | `miyabi parallel` | tmux + Claude Code |
|------|------------------|-------------------|
| **セットアップ** | ✅ 簡単 | ⚠️ 複雑 |
| **並列度** | ✅ 自動管理 | 🔧 手動管理 |
| **柔軟性** | ⚠️ 限定的 | ✅ 極めて高い |
| **報連相** | ✅ 自動 | 🔧 手動 |
| **トークン管理** | ✅ 自動 | ⚠️ 手動 |
| **学習コスト** | ✅ 低い | ⚠️ 高い |

### 推奨用途

✅ **Miyabi CLI使用を推奨**:
- 定型Issue大量処理
- CoordinatorAgentのみ使用
- 安定性重視

✅ **tmuxアプローチ推奨**:
- 異種エージェント同時実行
- アドホックなタスク配分
- リアルタイム調整が必要
- 実験的なワークフロー

### ハイブリッドアプローチ

最強の組み合わせ：

```bash
# Main (pane 0): Miyabi CLIで定型処理
miyabi parallel --issues 270,271,272 --concurrency 3

# pane 1-3: tmux + Claude Codeで柔軟なタスク
# → ビジネスAgents、マーケティング、コンテンツ制作など
```

---

**参考リンク**:
- 元記事: [Claude Codeを並列組織化してClaude Code "Company"にするtmuxコマンド集](https://zenn.dev/kazuph/articles/claude-code-tmux-parallel)
- Miyabi並列実行: `crates/miyabi-cli/src/commands/parallel.rs`
- Agent定義: `.claude/context/agents.md`
- Worktreeガイド: `.claude/context/worktree.md`

---

**Last Updated**: 2025-11-03
**Maintained by**: Miyabi Team
