---
title: "Quick Action Guide - Next Tasks"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Team"
category: "guides"
tags: ['context', 'guide', 'guides', 'miyabi', 'quick-start', 'reference']
status: "published"
---

# Quick Action Guide - Next Tasks

**Generated**: 2025-10-31 12:05:00 JST
**Context**: Post Codex PR Review & Merge Session

---

## 🚀 Ready-to-Execute Commands

### Option 1: Repository Cleanup (推奨) ⭐⭐⭐⭐⭐
**Time**: 15-30 minutes | **Difficulty**: Easy

```bash
cd /Users/shunsuke/Dev/miyabi-private

# 1. バックアップ作成（安全のため）
git bundle create ~/Desktop/miyabi-backup-$(date +%Y%m%d).bundle --all

# 2. Dry Runで確認
./scripts/repo-cleanup.sh --dry-run

# 3. 問題なければ実行
./scripts/repo-cleanup.sh

# 4. 結果確認
git branch | wc -l
git worktree list
cat .ai/reports/cleanup-report-*.md | tail -50
```

**Expected Results**:
- ✅ Branches: 28 → ~15
- ✅ Worktrees: 11 → ~5
- ✅ Disk space saved: ~5-10GB

---

### Option 2: Failed PR Investigation
**Time**: 30-60 minutes | **Difficulty**: Medium

```bash
cd /Users/shunsuke/Dev/miyabi-private

# PR #527 調査
echo "=== PR #527: ConfigLoader & Progress Tracking ==="
gh pr view 527
gh pr checks 527
gh pr diff 527 | head -100

# ローカルでテスト
gh pr checkout 527
cargo test --package miyabi-config
cargo clippy --package miyabi-config -- -D warnings

# 問題なければ承認
gh pr review 527 --approve --body "Manually reviewed and tested. LGTM."
gh pr merge 527 --squash

# PR #514, #491も同様に実施
```

**Expected Results**:
- ✅ 3つのfailed PRの原因特定
- ✅ 修正またはクローズ
- ✅ 問題レポート作成

---

### Option 3: Large PR Manual Review (Codex併用)
**Time**: 2-3 hours | **Difficulty**: High

#### Step 1: Desktop App PRs (最優先)

```bash
# PR #634: Miyabi Desktop Electron App (76,794 lines)
gh pr view 634
gh pr diff 634 | head -500

# 主要な変更箇所を確認
gh pr diff 634 -- miyabi-desktop/src/ | head -300
gh pr diff 634 -- miyabi-desktop/package.json

# レビュー観点:
# - TypeScript/React code quality
# - Component structure
# - Security (Electron IPC)
# - Performance considerations

# 承認または改善要求
gh pr review 634 --approve --body "Desktop app architecture looks good. LGTM."
# OR
gh pr review 634 --comment --body "請考慮以下改善点: [...]"
```

#### Step 2: Codexに残りを任せる

```bash
# Codexに大規模PRレビューを依頼
cat > /tmp/large_pr_review_instructions.md <<'EOF'
# Large PR Review Instructions

## Task
Review and approve large PRs (10 PRs, 630-518)

## Review Criteria
1. Architecture consistency
2. Code quality (TypeScript/Rust)
3. Test coverage
4. Documentation
5. Breaking changes

## Action
For each PR:
- If quality is good → APPROVE
- If has minor issues → COMMENT with suggestions
- If has major issues → REQUEST_CHANGES

## Output
Markdown report with decisions
EOF

# Codex実行
TASK_ID="large-pr-review-$(date +%Y%m%d-%H%M%S)"
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --instructions /tmp/large_pr_review_instructions.md --type pr_review
./scripts/codex-pr-review-executor.sh "$TASK_ID" &

# モニタリング
./scripts/codex-task-runner.sh monitor "$TASK_ID"
```

**Expected Results**:
- ✅ 10 Large PRs reviewed
- ✅ 5-7 PRs approved & merged
- ✅ 3-5 PRs with improvement suggestions

---

### Option 4: TUI Worktree Monitor (Issue #624)
**Time**: 3-4 hours | **Difficulty**: High

```bash
cd /Users/shunsuke/Dev/miyabi-private

# 1. Create worktree for Issue #624
git worktree add .worktrees/issue-624-tui-worktree-monitor -b feat/issue-624-tui-worktree-monitor

cd .worktrees/issue-624-tui-worktree-monitor

# 2. Create new crate
cargo new --lib crates/miyabi-tui
cd crates/miyabi-tui

# 3. Add dependencies
cat >> Cargo.toml <<'EOF'
[dependencies]
ratatui = "0.28"
crossterm = "0.29"
tokio = { version = "1.40", features = ["full"] }
anyhow = "1.0"
serde = { version = "1.0", features = ["derive"] }
EOF

# 4. Implement basic TUI
cat > src/lib.rs <<'EOF'
use ratatui::{
    backend::CrosstermBackend,
    Terminal,
};

pub struct WorktreeMonitor {
    // Implementation
}

impl WorktreeMonitor {
    pub fn new() -> Self {
        Self {}
    }

    pub fn run(&mut self) -> anyhow::Result<()> {
        // TUI loop
        Ok(())
    }
}
EOF

# 5. Add CLI command
# Edit crates/miyabi-cli/src/main.rs to add `status --tui` command

# 6. Test
cargo build --bin miyabi
./target/debug/miyabi status --tui

# 7. Create PR
git add .
git commit -m "feat(tui): implement Worktree monitor with ratatui (#624)"
gh pr create --title "feat(tui): TUI Worktree Monitor (#624)" --body "..."
```

**Expected Results**:
- ✅ Working TUI command: `miyabi status --tui`
- ✅ Real-time worktree display
- ✅ Interactive navigation
- ✅ PR created

---

### Option 5: Miyabi Desktop App (Issue #635, #632)
**Time**: 4-6 hours | **Difficulty**: Very High

```bash
cd /Users/shunsuke/Dev/miyabi-private

# 1. Create worktree
git worktree add .worktrees/issue-635-miyabi-desktop -b feat/issue-635-miyabi-desktop
cd .worktrees/issue-635-miyabi-desktop

# 2. Initialize Tauri project
cargo install tauri-cli
mkdir -p miyabi-desktop-tauri
cd miyabi-desktop-tauri
cargo tauri init

# 3. Setup React + TypeScript frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# 4. Install Tauri dependencies
npm install @tauri-apps/api
npm install @tauri-apps/cli

# 5. Configure Tauri
# Edit src-tauri/tauri.conf.json

# 6. Create main window layout
# Edit frontend/src/App.tsx

# 7. Build & test
npm run tauri dev

# 8. Create PR
cd ../..
git add miyabi-desktop-tauri/
git commit -m "feat(desktop): Initialize Tauri + React Desktop App (#635)"
gh pr create --title "feat(desktop): Miyabi Desktop App - Tauri + React (#635)" --body "..."
```

**Expected Results**:
- ✅ Working Desktop App (MVP)
- ✅ Tauri + React + TypeScript
- ✅ Basic UI layout
- ✅ PR created

---

## 📋 Decision Matrix

| Criteria | Cleanup | Failed PRs | Large PRs | TUI Monitor | Desktop App |
|----------|---------|------------|-----------|-------------|-------------|
| **Time** | 30min | 1h | 2-3h | 3-4h | 4-6h |
| **Impact** | High | Medium | High | Medium | Very High |
| **Difficulty** | Easy | Medium | Medium | High | Very High |
| **Priority** | P0 | P1 | P1 | P1 | P2 |
| **Can Delegate** | No | Partial | Yes (Codex) | Partial | Partial |

---

## 🎯 Recommended Sequence (今から実行)

### Scenario A: Quick Win (< 1 hour available)
```bash
# 1. Repository Cleanup (30min)
./scripts/repo-cleanup.sh

# 2. Failed PR #527 Quick Fix (20min)
gh pr checkout 527
cargo test
gh pr review 527 --approve
gh pr merge 527 --squash
```

### Scenario B: Productive Session (2-3 hours available)
```bash
# 1. Repository Cleanup (30min)
./scripts/repo-cleanup.sh

# 2. Failed PR Investigation (1h)
# Investigate all 3 failed PRs

# 3. Large PR Review with Codex (1-2h background)
# Start Codex review task for 10 large PRs
```

### Scenario C: Deep Work (4-6 hours available)
```bash
# Morning:
# 1. Repository Cleanup (30min)
./scripts/repo-cleanup.sh

# 2. Failed PRs (1h)
# Fix all 3 failed PRs

# Afternoon:
# 3. Start TUI Monitor (3-4h)
# Implement Issue #624

# Background:
# 4. Codex reviews large PRs
# Monitor progress periodically
```

### Scenario D: Parallel Execution (複数ターミナル)
```bash
# Terminal 1: Cleanup + Investigation
./scripts/repo-cleanup.sh
# Then investigate failed PRs

# Terminal 2: Codex Large PR Review
# Start background task
TASK_ID="large-pr-review-$(date +%Y%m%d)"
./scripts/codex-task-runner.sh start --task-id "$TASK_ID" --type pr_review
./scripts/codex-pr-review-executor.sh "$TASK_ID" &

# Terminal 3: Monitor Codex
./scripts/codex-task-runner.sh monitor "$TASK_ID"

# Terminal 4: Development (TUI or Desktop App)
# Start coding new feature
```

---

## 💡 Pro Tips

### 1. Always Backup First
```bash
git bundle create ~/Desktop/miyabi-backup-$(date +%Y%m%d).bundle --all
```

### 2. Use Dry Run for Cleanup
```bash
./scripts/repo-cleanup.sh --dry-run
```

### 3. Delegate to Codex
Large, repetitive tasks (like PR reviews) are perfect for Codex:
```bash
# Let Codex review PRs while you focus on coding
./scripts/codex-pr-review-executor.sh "task-id" &
```

### 4. Monitor Progress
```bash
# Real-time monitoring
watch -n 5 'git branch | wc -l; git worktree list | wc -l'

# Codex task monitoring
./scripts/codex-task-runner.sh monitor "task-id"
```

### 5. Document Everything
Every cleanup, review, or feature should generate a report:
- Cleanup → `.ai/reports/cleanup-report-YYYYMMDD.md`
- PR Review → `.ai/codex-tasks/<task-id>/results.json`
- Development → PR description + commit messages

---

## 🚦 Status Check Commands

### Quick Health Check
```bash
# Branch count
git branch | wc -l

# Worktree count
git worktree list | wc -l

# Disk usage
du -sh .git .worktrees .ai

# Open PRs
gh pr list --state open | wc -l

# Open Issues (P1-High)
gh issue list --label "priority:P1-High" --state open
```

### Detailed Status
```bash
# Full git status
git status --short

# All worktrees
git worktree list

# Recent branches
git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short)|%(committerdate:relative)' | head -10

# CI status of open PRs
gh pr list --state open --json number,title,statusCheckRollup
```

---

## 📞 Next Steps

**Choose one scenario and execute now!**

**Recommendation**: Start with **Scenario A** (Quick Win) for immediate results. 🌟

---

**Document Location**: `/Users/shunsuke/Dev/miyabi-private/docs/QUICK_ACTION_GUIDE.md`
**Master Plan**: `/Users/shunsuke/Dev/miyabi-private/.ai/plans/NEXT_TASK_MASTER_PLAN_20251031.md`
