# Next Task Master Plan - 2025-10-31

**Generated**: 2025-10-31 12:05:00 JST
**Context**: Post Codex PR Review Session
**Current State**: 13 Open PRs, 10 Active Worktrees, 28 Local Branches

---

## 📊 Current Status Analysis

### PR状態
- **Total Open PRs**: 13
- **Commented (Large PRs)**: 10 - 手動レビュー推奨
- **Failed Reviews**: 3 - 調査必要

### Branch状態
- **Local Branches**: 28個（feat/, feature/, world-* など）
- **Active Worktrees**: 11個
- **Merged Branches**: 6個（PR #626, #625, #607, #604, #603, #602）

### Issue状態
- **Open Issues**: 635個まで確認
- **Priority P1**: Issue #624 (TUI Worktree表示)
- **New Desktop App**: Issue #635, #632

---

## 🎯 Next Task Options (優先順位順)

### Option 1: Repository Cleanup & Organization ⭐⭐⭐⭐⭐
**Priority**: Critical
**Estimated Time**: 30-45 minutes
**Complexity**: Medium

#### 目的
- リポジトリの健全性維持
- 不要なブランチ・worktreeの削除
- ディスク容量の最適化
- 開発環境のクリーンアップ

#### タスク内訳

##### Phase 1: Merged Branch Cleanup (15分)
```bash
# 1.1 マージ済みブランチの特定
git branch --merged main | grep -v "main\|master\|\*"

# 1.2 リモートでマージ済みブランチの削除
git remote prune origin

# 1.3 ローカルマージ済みブランチの削除
git branch --merged main | grep -v "main\|master\|\*" | xargs git branch -d
```

##### Phase 2: Worktree Cleanup (10分)
```bash
# 2.1 古いworktreeの特定
find .worktrees/ -type d -mtime +7

# 2.2 マージ済みworktreeの削除
for wt in .worktrees/*; do
  branch=$(git -C "$wt" branch --show-current)
  if git branch --merged main | grep -q "$branch"; then
    git worktree remove "$wt"
  fi
done

# 2.3 world-* 系worktreeの削除（Issue #270完了後）
git worktree remove .worktrees/world-*
```

##### Phase 3: Stale Branch Cleanup (10分)
```bash
# 3.1 30日以上更新なしのブランチ検出
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(refname:short)|%(committerdate:relative)'

# 3.2 対象ブランチのアーカイブ
mkdir -p .ai/archive/branches
git bundle create .ai/archive/branches/stale-$(date +%Y%m%d).bundle \
  feat/old-branch-1 feat/old-branch-2

# 3.3 ブランチ削除
git branch -D feat/old-branch-1 feat/old-branch-2
```

##### Phase 4: Artifact Cleanup (10分)
```bash
# 4.1 古いログファイル削除
find .ai/logs/ -type f -mtime +30 -delete

# 4.2 古いプランファイル整理
mv .ai/plans/*.md .ai/archive/plans/ 2>/dev/null

# 4.3 ビルド成果物クリーンアップ
cargo clean
rm -rf target/debug
```

#### 成果物
- ✅ クリーンなブランチ構造
- ✅ 削除されたworktree一覧
- ✅ アーカイブレポート
- ✅ ディスク容量レポート

---

### Option 2: Large PR Manual Review & Merge ⭐⭐⭐⭐
**Priority**: High
**Estimated Time**: 2-3 hours
**Complexity**: High

#### 目的
- Codexでコメントされた大規模PRの手動レビュー
- 承認可能なものは承認・マージ
- 問題があるものは具体的な改善提案

#### タスク内訳

##### Phase 1: Desktop App PRs (60分)
```
PR #634: Miyabi Desktop Electron App - Sprint 0 (76,794 lines)
PR #633: Dashboard Phase 1 Quick Wins (75,881 lines)
PR #631: Dashboard Phase 1 UI/UX Quick Wins (75,876 lines)
```

**レビュー観点**:
1. Electron/Tauri architecture設計
2. React/TypeScript code quality
3. Component structure
4. State management (Redux/Zustand)
5. API integration
6. Security considerations

##### Phase 2: Agent Integration PRs (45分)
```
PR #630: TaskMetadata persistence (22,509 lines)
PR #623: Agent Configuration Management CLI
PR #622: Task Metadata Persistence System
```

**レビュー観点**:
1. Rust code quality (clippy, fmt)
2. Error handling
3. Database schema changes
4. API compatibility
5. Test coverage

##### Phase 3: Feature PRs (45分)
```
PR #518: YouTube/Twitch Streaming (Priority: P1-High)
PR #517: React Flow Visual Editor
PR #516: Demo video production plan
PR #502: Agent Execution UI
```

**レビュー観点**:
1. Feature completeness
2. Documentation
3. Breaking changes
4. Migration path

#### 成果物
- ✅ 各PRのレビューコメント
- ✅ 承認済みPRリスト
- ✅ 改善提案ドキュメント
- ✅ マージ済みPRレポート

---

### Option 3: Miyabi Desktop App Development ⭐⭐⭐⭐
**Priority**: High (New Priority Item)
**Estimated Time**: 4-6 hours
**Complexity**: Very High

#### 目的
- VS Code-like Desktop Appの開発開始
- Issue #635, #632の実装
- Tauri + React + TypeScript構成

#### タスク内訳

##### Phase 1: Project Setup (60分)
```bash
# 1.1 Tauri CLI インストール
cargo install tauri-cli

# 1.2 プロジェクト初期化
mkdir -p miyabi-desktop
cd miyabi-desktop
cargo tauri init

# 1.3 React + TypeScript セットアップ
npm create vite@latest frontend -- --template react-ts
```

##### Phase 2: Core Architecture (120分)
- メインウィンドウ設計
- サイドバー（Worktree一覧）
- コンテンツエリア（Issue/PR/Agent状態）
- ステータスバー（Git status, Agent status）

##### Phase 3: Tauri Backend Integration (90分)
- Rust backend API
- Miyabi CLI統合
- Git操作ラッパー
- Agent実行制御

##### Phase 4: Frontend Components (90分)
- WorktreeList component
- IssueViewer component
- AgentMonitor component
- DeploymentDashboard component

#### 成果物
- ✅ 動作するDesktop App (MVP)
- ✅ ドキュメント
- ✅ Demo video
- ✅ PR作成

---

### Option 4: TUI Worktree Monitor (Issue #624) ⭐⭐⭐⭐
**Priority**: P1-High
**Estimated Time**: 3-4 hours
**Complexity**: High

#### 目的
- `miyabi status --tui` コマンド実装
- リアルタイムWorktree状態表示
- ratatui使用

#### タスク内訳

##### Phase 1: TUI Framework Setup (45分)
```rust
// crates/miyabi-tui/src/lib.rs
use ratatui::{
    backend::CrosstermBackend,
    widgets::{Block, Borders, List, ListItem},
    Terminal,
};

pub struct WorktreeMonitor {
    worktrees: Vec<WorktreeState>,
    selected: usize,
}
```

##### Phase 2: Data Collection (60分)
- Git worktree情報取得
- Branch状態監視
- Agent実行状態統合
- リアルタイム更新ロジック

##### Phase 3: UI Layout (90分)
```
┌─────────────────────────────────────────────────────────┐
│ Miyabi Worktree Monitor                                 │
├─────────────────────────────────────────────────────────┤
│ Worktrees (11)                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ● main                      [c7b4cb9] ✓ Clean       │ │
│ │ ○ feat/miyabi-desktop-app   [0a43faf] ⚡ Modified   │ │
│ │ ○ feat/claude-x-issue-537   [10f9b80] ✓ Clean       │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Details: feat/miyabi-desktop-app                        │
│ - Files changed: 24                                     │
│ - Agent: None                                           │
│ - Last commit: 2 hours ago                              │
└─────────────────────────────────────────────────────────┘
```

##### Phase 4: Interactive Features (45分)
- キーボードナビゲーション (j/k, ↑/↓)
- Worktree切り替え (Enter)
- Git操作 (p: pull, s: status)
- Agent起動 (a: run agent)

#### 成果物
- ✅ `miyabi status --tui` 動作
- ✅ リアルタイム更新
- ✅ テスト
- ✅ ドキュメント

---

### Option 5: Failed PR Investigation ⭐⭐⭐
**Priority**: Medium
**Estimated Time**: 1-2 hours
**Complexity**: Medium

#### 目的
- Codex review失敗3件の原因調査
- 修正・再レビュー

#### 対象PR
```
PR #527: feat(phase-1): ConfigLoader & Progress Tracking
PR #514: feat(a2a): Error Recovery Backend - Phase 2.2
PR #491: feat(backend): Phase 2 - Backend API Integration
```

#### タスク内訳

##### Phase 1: ログ分析 (20分)
```bash
# Codex実行ログ確認
cat .ai/codex-tasks/pr-review-20251031-115806/progress.log | grep -A 10 "PR #527\|PR #514\|PR #491"

# CI状態確認
gh pr checks 527
gh pr checks 514
gh pr checks 491
```

##### Phase 2: 問題特定 (30分)
- CI失敗原因
- マージコンフリクト
- Draft状態
- Permission問題

##### Phase 3: 修正実施 (40分)
- 必要なコード修正
- CI再実行
- レビュー再実施

#### 成果物
- ✅ 問題分析レポート
- ✅ 修正PR（必要な場合）
- ✅ 再レビュー結果

---

## 🎯 推奨タスク順序

### Scenario A: Stability First (推奨) 🌟
```
1. Repository Cleanup (45min) ← 最優先
2. Failed PR Investigation (1-2h)
3. Large PR Manual Review (2-3h)
4. [Break]
5. TUI Worktree Monitor (3-4h)
6. Miyabi Desktop App (4-6h)
```

**理由**:
- まずリポジトリをクリーンアップして健全な状態に
- 失敗したPRを修正して技術的負債を解消
- 大規模PRをレビューしてマージ可能なものは進める
- その後、新機能開発に集中

### Scenario B: Feature First
```
1. Miyabi Desktop App (4-6h) ← 新機能優先
2. TUI Worktree Monitor (3-4h)
3. Repository Cleanup (45min)
4. Large PR Manual Review (2-3h)
5. Failed PR Investigation (1-2h)
```

**理由**:
- Issue #635, #632は新規プライオリティ
- Desktop Appは戦略的に重要
- 後でクリーンアップ・レビューを実施

### Scenario C: Parallel Execution
```
Terminal 1: Repository Cleanup → Failed PR Investigation
Terminal 2: Large PR Manual Review (Background)
Terminal 3: Codex に TUI Worktree Monitor を依頼
```

**理由**:
- 並列実行で時間効率最大化
- Codexに複雑なコーディングタスクを任せる
- 人間はレビュー・調査に集中

---

## 📋 Implementation Plan Details

### Plan A-1: Repository Cleanup (Detailed)

#### Prerequisites
```bash
# バックアップ作成
git bundle create ~/Desktop/miyabi-backup-$(date +%Y%m%d).bundle --all

# ディスク使用量確認
du -sh .git .worktrees .ai
```

#### Execution Script
```bash
#!/bin/bash
# scripts/repo-cleanup.sh

set -euo pipefail

echo "=== Phase 1: Merged Branch Cleanup ==="
# マージ済みローカルブランチ削除
git branch --merged main | grep -v "main\|master\|\*" | xargs -r git branch -d

# リモート追跡ブランチクリーンアップ
git remote prune origin

echo "=== Phase 2: Worktree Cleanup ==="
# マージ済みworktree削除
for wt in .worktrees/*; do
  if [ -d "$wt" ]; then
    branch=$(git -C "$wt" branch --show-current 2>/dev/null || echo "")
    if [ -n "$branch" ] && git branch --merged main | grep -q "^  $branch$"; then
      echo "Removing merged worktree: $wt ($branch)"
      git worktree remove "$wt" --force
    fi
  fi
done

# world-* worktree削除（Issue #270完了後）
git worktree list | grep "world-" | awk '{print $1}' | xargs -I {} git worktree remove {} --force

echo "=== Phase 3: Stale Branch Detection ==="
# 90日以上更新なし
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(refname:short)|%(committerdate:iso)|%(committerdate:relative)' \
  | awk -F'|' '$2 < "'$(date -v-90d +%Y-%m-%d)'" {print $1"|"$3}'

echo "=== Phase 4: Artifact Cleanup ==="
# 古いログ削除（30日以上）
find .ai/logs/ -type f -mtime +30 -delete
find .ai/plans/ -type f -mtime +30 -exec mv {} .ai/archive/plans/ \;

# ビルド成果物削除
cargo clean
rm -rf target/debug

echo "=== Phase 5: Report Generation ==="
# レポート生成
cat > .ai/reports/cleanup-report-$(date +%Y%m%d).md <<EOF
# Repository Cleanup Report

**Date**: $(date)

## Before Cleanup
- Local Branches: $(git branch | wc -l)
- Worktrees: $(git worktree list | wc -l)
- Disk Usage: $(du -sh .git .worktrees .ai)

## Actions Taken
- Merged branches deleted: $(git branch --merged main | wc -l)
- Worktrees removed: X
- Stale branches archived: Y

## After Cleanup
- Local Branches: $(git branch | wc -l)
- Worktrees: $(git worktree list | wc -l)
- Disk Space Saved: Z GB
EOF
```

#### Success Criteria
- [ ] 全マージ済みブランチ削除
- [ ] 不要なworktree削除（< 5個まで削減）
- [ ] 90日以上更新なしブランチをアーカイブ
- [ ] ディスク容量10GB以上節約
- [ ] クリーンアップレポート生成

---

### Plan A-2: Failed PR Investigation (Detailed)

#### Investigation Checklist

```markdown
## PR #527: ConfigLoader & Progress Tracking

### 1. CI Status
- [ ] Check CI logs: `gh pr checks 527`
- [ ] Identify failing tests
- [ ] Check for merge conflicts

### 2. Code Review
- [ ] Read diff: `gh pr diff 527 | less`
- [ ] Check for breaking changes
- [ ] Verify test coverage

### 3. Local Testing
```bash
# Checkout PR
gh pr checkout 527

# Run tests
cargo test --package miyabi-config
cargo clippy -- -D warnings

# Run specific test
cargo test config_loader
```

### 4. Fix Actions
- [ ] Fix failing tests
- [ ] Resolve merge conflicts
- [ ] Update documentation
- [ ] Push fixes

### 5. Re-review
```bash
# Approve if passing
gh pr review 527 --approve --body "Fixed CI failures. LGTM."

# Merge
gh pr merge 527 --squash
```
```

---

## 🚀 Recommended Next Action

### Immediate Action (Next 15 minutes)

```bash
# 1. Repository Cleanup Quick Win
cd /Users/shunsuke/Dev/miyabi-private

# バックアップ
git bundle create ~/Desktop/miyabi-backup-$(date +%Y%m%d).bundle --all

# マージ済みブランチ削除
git branch --merged main | grep -v "main\|master\|\*" | xargs -r git branch -d

# マージ済みworktree削除スクリプト実行
./scripts/repo-cleanup.sh

# 結果確認
git branch | wc -l
git worktree list
```

### Then Choose:

**If time < 2h**: Focus on Cleanup + Failed PR Investigation
**If time 2-4h**: Add Large PR Manual Review
**If time 4-6h**: Start TUI Worktree Monitor
**If time > 6h**: Begin Miyabi Desktop App

---

## 📊 Success Metrics

### Repository Health
- [ ] Branches < 15
- [ ] Worktrees < 5
- [ ] Disk usage < 10GB (.git + .worktrees + .ai)
- [ ] All PRs reviewed

### Development Progress
- [ ] Failed PRs resolved
- [ ] Large PRs merged (at least 5/10)
- [ ] New features started (TUI or Desktop)

### Documentation
- [ ] Cleanup report generated
- [ ] PR review reports
- [ ] Implementation progress tracked

---

## 🔗 Related Documentation

- [CODEX_MONITORING_GUIDE.md](../docs/CODEX_MONITORING_GUIDE.md)
- [CODEX_SESSION_SUMMARY_20251031.md](./CODEX_SESSION_SUMMARY_20251031.md)
- [.claude/commands/codex-monitor.md](../.claude/commands/codex-monitor.md)

---

**Next Step**: Choose a scenario and execute!
**Recommendation**: Start with Scenario A (Stability First) 🌟
