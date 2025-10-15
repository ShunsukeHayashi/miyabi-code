#!/bin/bash
# Phase 5 Level 0並列実行セットアップスクリプト
# 4つのWorktreeを作成して並列開発環境を構築

set -e  # エラー時に停止

echo "🚀 Phase 5 Level 0: 4並列Worktree作成開始"
echo ""

# プロジェクトルートに移動
cd "$(git rev-parse --show-toplevel)"

# 既存Worktreeのクリーンアップ (存在する場合)
echo "🧹 既存Worktreeのクリーンアップ..."
git worktree remove .worktrees/p0-3-worktree 2>/dev/null || true
git worktree remove .worktrees/p1-1-tests 2>/dev/null || true
git worktree remove .worktrees/p1-5-review 2>/dev/null || true
git worktree remove .worktrees/p1-9-issue 2>/dev/null || true

# ブランチ削除 (存在する場合)
git branch -D feat/p0-3-worktree-integration 2>/dev/null || true
git branch -D feat/p1-1-coordinator-tests 2>/dev/null || true
git branch -D feat/p1-5-review-static-analysis 2>/dev/null || true
git branch -D feat/p1-9-issue-type-detection 2>/dev/null || true

echo ""
echo "📁 Worktreeディレクトリ作成..."
mkdir -p .worktrees

echo ""
echo "🌿 Level 0 Worktree作成 (4並列)..."
echo ""

# P0-3: CodeGenAgent Worktree統合 (6h)
echo "1️⃣  P0-3: CodeGenAgent Worktree統合"
git worktree add .worktrees/p0-3-worktree -b feat/p0-3-worktree-integration
echo "   ✅ .worktrees/p0-3-worktree (feat/p0-3-worktree-integration)"
echo ""

# P1-1: CoordinatorAgent テスト拡充 (5h)
echo "2️⃣  P1-1: CoordinatorAgent テスト拡充"
git worktree add .worktrees/p1-1-tests -b feat/p1-1-coordinator-tests
echo "   ✅ .worktrees/p1-1-tests (feat/p1-1-coordinator-tests)"
echo ""

# P1-5: ReviewAgent 静的解析統合 (8h)
echo "3️⃣  P1-5: ReviewAgent 静的解析統合"
git worktree add .worktrees/p1-5-review -b feat/p1-5-review-static-analysis
echo "   ✅ .worktrees/p1-5-review (feat/p1-5-review-static-analysis)"
echo ""

# P1-9: IssueAgent Issue種別判定 (6h)
echo "4️⃣  P1-9: IssueAgent Issue種別判定"
git worktree add .worktrees/p1-9-issue -b feat/p1-9-issue-type-detection
echo "   ✅ .worktrees/p1-9-issue (feat/p1-9-issue-type-detection)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Level 0 Worktree作成完了！"
echo ""
echo "📊 作成されたWorktree:"
git worktree list
echo ""

echo "🎯 次のステップ:"
echo ""
echo "  各Worktreeで並列実装を開始してください:"
echo ""
echo "  Terminal 1:"
echo "    cd .worktrees/p0-3-worktree"
echo "    # P0-3: Worktree統合実装 (6h)"
echo ""
echo "  Terminal 2:"
echo "    cd .worktrees/p1-1-tests"
echo "    # P1-1: テスト拡充 (5h)"
echo ""
echo "  Terminal 3:"
echo "    cd .worktrees/p1-5-review"
echo "    # P1-5: 静的解析統合 (8h)"
echo ""
echo "  Terminal 4:"
echo "    cd .worktrees/p1-9-issue"
echo "    # P1-9: Issue種別判定 (6h)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏱️  Level 0所要時間: max(6h, 5h, 8h, 6h) = 8時間"
echo "🚀 並列実行により、Sequential 25h → Parallel 8h (68%削減)"
echo ""
echo "🦀 Rust 2021 Edition - Parallel Execution Ready!"
