# 🚀 Phase 5 並列実行ガイド - 実践マニュアル

**作成日**: 2025-10-15
**対象**: Phase 5 Agent実装
**効率化効果**: **Sequential 119h → Parallel 44h (63%削減)**

---

## 📊 並列実行の概要

### 効率化効果

| 指標 | Sequential | **Parallel (4並列)** | 改善 |
|------|-----------|---------------------|------|
| **総実行時間** | 119時間 | **44時間** | **-63%** ✅ |
| **所要日数** | 15日間 | **5.5日間** | **-63%** ✅ |
| **スループット** | 1タスク/h | **2.7タスク/h** | **+170%** ✅ |

### DAG構造 (5 Levels)

```
Level 0 (8h並列) → Level 1 (12h並列) → Level 2 (8h並列) → Level 3 (8h並列) → Level 4 (8h並列)

総時間: 44時間
```

---

## 🎯 Level 0: 即座に開始可能な4並列タスク

### タスク一覧

| # | タスク | 見積 | Agent | 独立性 | 担当 |
|---|--------|------|-------|--------|------|
| 1 | **P0-3: Worktree統合** | 6h | CodeGenAgent | ✅ 完全独立 | Terminal 1 |
| 2 | **P1-1: テスト拡充** | 5h | CoordinatorAgent | ✅ 完全独立 | Terminal 2 |
| 3 | **P1-5: 静的解析統合** | 8h | ReviewAgent | ✅ 完全独立 | Terminal 3 |
| 4 | **P1-9: Issue種別判定** | 6h | IssueAgent | ✅ 完全独立 | Terminal 4 |

**Level 0所要時間**: max(6, 5, 8, 6) = **8時間**

---

## 🛠️ セットアップ手順

### Step 1: Worktree環境構築 (5分)

```bash
# プロジェクトルートに移動
cd /Users/shunsuke/Dev/miyabi-private

# セットアップスクリプト実行権限付与
chmod +x scripts/parallel-execution/setup-level0-worktrees.sh

# Worktree作成 (4並列環境)
./scripts/parallel-execution/setup-level0-worktrees.sh
```

**出力**:
```
🚀 Phase 5 Level 0: 4並列Worktree作成開始

📁 Worktreeディレクトリ作成...

🌿 Level 0 Worktree作成 (4並列)...

1️⃣  P0-3: CodeGenAgent Worktree統合
   ✅ .worktrees/p0-3-worktree (feat/p0-3-worktree-integration)

2️⃣  P1-1: CoordinatorAgent テスト拡充
   ✅ .worktrees/p1-1-tests (feat/p1-1-coordinator-tests)

3️⃣  P1-5: ReviewAgent 静的解析統合
   ✅ .worktrees/p1-5-review (feat/p1-5-review-static-analysis)

4️⃣  P1-9: IssueAgent Issue種別判定
   ✅ .worktrees/p1-9-issue (feat/p1-9-issue-type-detection)

✅ Level 0 Worktree作成完了！
```

### Step 2: Worktree確認

```bash
# 作成されたWorktreeを確認
git worktree list
```

**出力例**:
```
/Users/shunsuke/Dev/miyabi-private              35b8fe6 [main]
/Users/shunsuke/Dev/miyabi-private/.worktrees/p0-3-worktree  35b8fe6 [feat/p0-3-worktree-integration]
/Users/shunsuke/Dev/miyabi-private/.worktrees/p1-1-tests     35b8fe6 [feat/p1-1-coordinator-tests]
/Users/shunsuke/Dev/miyabi-private/.worktrees/p1-5-review    35b8fe6 [feat/p1-5-review-static-analysis]
/Users/shunsuke/Dev/miyabi-private/.worktrees/p1-9-issue     35b8fe6 [feat/p1-9-issue-type-detection]
```

---

## 🖥️ 並列実行方法

### 方法1: マルチターミナル (推奨)

**4つのターミナルウィンドウを開く**:

#### Terminal 1: P0-3 Worktree統合 (6h)

```bash
cd .worktrees/p0-3-worktree

# 実装開始
cat scripts/parallel-execution/EXECUTION_CONTEXT_P0-3.md

# 実装後テスト
cargo test --package miyabi-agents
cargo clippy --package miyabi-agents -- -D warnings

# commit
git add .
git commit -m "feat(codegen): P0-3完了 - Worktree統合実装"
```

#### Terminal 2: P1-1 テスト拡充 (5h)

```bash
cd .worktrees/p1-1-tests

# 実装: CoordinatorAgent追加テスト
# - GitHub API mockテスト
# - Plans.md生成エッジケーステスト
# - DAG循環依存テスト

cargo test --package miyabi-agents coordinator
cargo clippy --package miyabi-agents -- -D warnings

git add .
git commit -m "test(coordinator): P1-1完了 - テスト拡充"
```

#### Terminal 3: P1-5 静的解析統合 (8h)

```bash
cd .worktrees/p1-5-review

# 実装: ReviewAgent新規作成
touch crates/miyabi-agents/src/review.rs

# cargo clippy統合
# 品質スコア計算ロジック
# QualityReport生成

cargo test --package miyabi-agents review
cargo clippy --package miyabi-agents -- -D warnings

git add .
git commit -m "feat(review): P1-5完了 - 静的解析統合"
```

#### Terminal 4: P1-9 Issue種別判定 (6h)

```bash
cd .worktrees/p1-9-issue

# 実装: IssueAgent新規作成
touch crates/miyabi-agents/src/issue.rs

# キーワードマッチング
# Label推論ロジック
# Issue分析

cargo test --package miyabi-agents issue
cargo clippy --package miyabi-agents -- -D warnings

git add .
git commit -m "feat(issue): P1-9完了 - Issue種別判定"
```

---

### 方法2: tmux セッション (上級者向け)

```bash
# tmuxセッション作成
tmux new-session -s phase5-level0

# 4ペイン分割
tmux split-window -h
tmux split-window -v
tmux select-pane -t 0
tmux split-window -v

# 各ペインで実行
# Pane 0: P0-3
tmux select-pane -t 0
tmux send-keys "cd .worktrees/p0-3-worktree" C-m

# Pane 1: P1-1
tmux select-pane -t 1
tmux send-keys "cd .worktrees/p1-1-tests" C-m

# Pane 2: P1-5
tmux select-pane -t 2
tmux send-keys "cd .worktrees/p1-5-review" C-m

# Pane 3: P1-9
tmux select-pane -t 3
tmux send-keys "cd .worktrees/p1-9-issue" C-m

# セッションにアタッチ
tmux attach-session -t phase5-level0
```

---

## 🔄 マージ手順 (Level 0完了後)

### Step 1: 各Worktreeでテスト実行

```bash
# Terminal 1
cd .worktrees/p0-3-worktree
cargo test --all
cargo clippy -- -D warnings

# Terminal 2
cd .worktrees/p1-1-tests
cargo test --all
cargo clippy -- -D warnings

# Terminal 3
cd .worktrees/p1-5-review
cargo test --all
cargo clippy -- -D warnings

# Terminal 4
cd .worktrees/p1-9-issue
cargo test --all
cargo clippy -- -D warnings
```

### Step 2: mainブランチにマージ

```bash
# mainブランチに戻る
cd /Users/shunsuke/Dev/miyabi-private
git checkout main

# 各ブランチをマージ
git merge --no-ff feat/p0-3-worktree-integration -m "feat: P0-3完了 - Worktree統合"
git merge --no-ff feat/p1-1-coordinator-tests -m "test: P1-1完了 - テスト拡充"
git merge --no-ff feat/p1-5-review-static-analysis -m "feat: P1-5完了 - 静的解析統合"
git merge --no-ff feat/p1-9-issue-type-detection -m "feat: P1-9完了 - Issue種別判定"

# 統合テスト
cargo test --all
cargo clippy -- -D warnings

# Push
git push origin main
```

### Step 3: Worktreeクリーンアップ

```bash
# Worktree削除
git worktree remove .worktrees/p0-3-worktree
git worktree remove .worktrees/p1-1-tests
git worktree remove .worktrees/p1-5-review
git worktree remove .worktrees/p1-9-issue

# ブランチ削除
git branch -d feat/p0-3-worktree-integration
git branch -d feat/p1-1-coordinator-tests
git branch -d feat/p1-5-review-static-analysis
git branch -d feat/p1-9-issue-type-detection
```

---

## 📊 進捗管理

### チェックリスト

**Level 0 (8時間)**:
- [ ] P0-3: Worktree統合 (6h) - Terminal 1
- [ ] P1-1: テスト拡充 (5h) - Terminal 2
- [ ] P1-5: 静的解析統合 (8h) - Terminal 3
- [ ] P1-9: Issue種別判定 (6h) - Terminal 4

**マージ・統合**:
- [ ] 全Worktreeでテスト成功
- [ ] Clippy警告0件
- [ ] mainブランチにマージ
- [ ] 統合テスト成功
- [ ] Worktreeクリーンアップ完了

---

## 🎯 Level 1への移行 (Level 0完了後)

Level 0完了後、以下のLevel 1タスクを開始:

### Level 1 (12時間) - 4並列

| # | タスク | 見積 | 依存関係 |
|---|--------|------|----------|
| 1 | **P0-4: Claude Code統合** | 12h | P0-3完了後 |
| 2 | **P1-6: 品質スコア計算** | 8h | 独立 |
| 3 | **P1-10: Severity評価** | 6h | 独立 |
| 4 | **P1-13: Conventional Commits** | 6h | 独立 |

**セットアップ**:
```bash
./scripts/parallel-execution/setup-level1-worktrees.sh
```

---

## ⚠️ トラブルシューティング

### Worktree作成失敗

**エラー**: `fatal: 'feat/p0-3-worktree-integration' is already checked out`

**解決**:
```bash
git worktree remove .worktrees/p0-3-worktree
git worktree add .worktrees/p0-3-worktree -b feat/p0-3-worktree-integration
```

### コンフリクト発生

**エラー**: `CONFLICT (content): Merge conflict in crates/miyabi-agents/src/lib.rs`

**解決**:
```bash
# コンフリクトファイルを手動編集
vim crates/miyabi-agents/src/lib.rs

# 解決後
git add crates/miyabi-agents/src/lib.rs
git commit -m "fix: Resolve merge conflict"
```

### ビルド失敗

**エラー**: `error: could not compile miyabi-agents`

**解決**:
```bash
# 各Worktreeで個別にビルド確認
cd .worktrees/p0-3-worktree
cargo clean
cargo build

# 依存関係更新
cargo update
```

---

## 📈 進捗レポート

### Level 0完了時の報告テンプレート

**GitHub Issue #112 コメント**:

```markdown
# ✅ Level 0完了報告 - 4並列タスク完了

**完了日**: 2025-10-XX
**所要時間**: 8時間 (見積: 8時間)

## 完了タスク

| # | タスク | 見積 | 実績 | commit |
|---|--------|------|------|--------|
| P0-3 | Worktree統合 | 6h | 6h | XXXXXXX |
| P1-1 | テスト拡充 | 5h | 5h | XXXXXXX |
| P1-5 | 静的解析統合 | 8h | 8h | XXXXXXX |
| P1-9 | Issue種別判定 | 6h | 6h | XXXXXXX |

## 統計

- ✅ 並列実行により8時間で4タスク完了
- ✅ Sequential実行なら25時間 → **68%削減達成**
- ✅ 全テストパス
- ✅ Clippy警告0件

## 次のアクション

Level 1開始 (12時間見積)
```

---

## 🦀 まとめ

**並列実行の3つのポイント**:

1. **完全独立タスクの特定** - DAG分析で依存関係のないタスクを並列化
2. **Worktree分離** - 物理的に独立した作業環境で同時実装
3. **段階的マージ** - Levelごとに統合してコンフリクトを最小化

**効果**:
- ⏱️ **63%時間削減** (119h → 44h)
- 🚀 **170%スループット向上**
- ✅ **高品質維持** (テスト・Clippy完備)

---

**詳細計画**: [PHASE5_PARALLEL_EXECUTION_PLAN.md](./PHASE5_PARALLEL_EXECUTION_PLAN.md)

🦀 **Rust 2021 Edition - Parallel Execution Optimized**
