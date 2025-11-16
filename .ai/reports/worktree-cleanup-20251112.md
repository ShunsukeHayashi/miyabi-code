# Worktree Cleanup Report - Issue #812

**Date**: 2025-11-12
**Repository**: /Users/shunsuke/Dev/miyabi-private
**Issue**: https://github.com/customer-cloud/miyabi-private/issues/812
**Priority**: P1-High (Score: 75)

---

## Executive Summary

**Total Worktrees Analyzed**: 13 (excluding main)

**Categorization**:
- Ready to Clean: 6 worktrees (safe to remove)
- Needs Review: 4 worktrees (has uncommitted changes)
- Active Development: 3 worktrees (keep for now)

**Actions Taken**: Analysis complete, safe cleanup recommendations documented
**Manual Review Required**: 4 worktrees with uncommitted changes

---

## Detailed Analysis

### Category 1: Safe to Clean (6 worktrees)

These worktrees have no uncommitted changes and appear to be stale or completed work.

#### 1.1 codex-pr-review
- **Path**: `.worktrees/codex-pr-review`
- **Branch**: `codex/pr-review`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 0
- **Remote Branch**: None
- **Status**: Clean, no uncommitted changes
- **Risk Level**: LOW
- **Recommendation**: SAFE TO REMOVE
- **Reason**: No active PR, clean state, appears to be old review worktree

#### 1.2 log-comment
- **Path**: `.worktrees/log-comment`
- **Branch**: Detached HEAD at `fac7a1469`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 0
- **Remote Branch**: None
- **Status**: Detached HEAD, clean state
- **Risk Level**: LOW
- **Recommendation**: SAFE TO REMOVE
- **Reason**: Detached HEAD state indicates temporary worktree, no changes

#### 1.3 miyabi-orchestra (LOCKED)
- **Path**: `.worktrees/miyabi-orchestra`
- **Branch**: `worktree/miyabi-orchestra`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 0
- **Remote Branch**: `origin/claude/miyabi-orchestra-011CUprztUYVmni56G4s48Yb`
- **Status**: LOCKED, clean state
- **Risk Level**: MEDIUM
- **Recommendation**: UNLOCK AND REVIEW
- **Reason**: Locked worktree, may be in use by another process. Check if process still active before removing.

#### 1.4 phase1-18-codex-setup
- **Path**: `.worktrees/phase1-18-codex-setup`
- **Branch**: `phase1-18-codex-setup`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 0
- **Remote Branch**: None
- **Status**: Clean, appears to be completed phase
- **Risk Level**: LOW
- **Recommendation**: SAFE TO REMOVE
- **Reason**: Phase 1 is complete, no active work, clean state

#### 1.5 root-dir-cleanup
- **Path**: `.worktrees/root-dir-cleanup`
- **Branch**: `chore/root-dir-cleanup`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 0
- **Remote Branch**: None
- **Status**: Clean, cleanup task appears complete
- **Risk Level**: LOW
- **Recommendation**: SAFE TO REMOVE
- **Reason**: No uncommitted changes, cleanup appears complete, can remove worktree

#### 1.6 issue-787-video-pipeline
- **Path**: `.worktrees/issue-787-video-pipeline`
- **Branch**: `issue-787-video-pipeline`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 414 (mostly target/ directory)
- **Remote Branch**: None
- **Status**: Build artifacts, no real code changes
- **Risk Level**: LOW
- **Recommendation**: CLEAN TARGET/ AND REVIEW
- **Reason**: 414 changes are mostly build artifacts in target/. Can clean and reassess.

---

### Category 2: Needs Review (4 worktrees)

These worktrees have uncommitted changes that need human review before cleanup.

#### 2.1 issue-708 (Dependabot PR)
- **Path**: `.worktrees/issue-708`
- **Branch**: `dependabot/cargo/tokio-ecosystem-1da738d72b`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 2
  - `miyabi-desktop/src/App.tsx` (modified)
  - `miyabi-desktop/package-lock.json` (untracked)
- **Remote Branch**: `origin/dependabot/cargo/tokio-ecosystem-1da738d72b`
- **Associated PR**: #778 (OPEN)
- **Status**: Active Dependabot PR with local changes
- **Risk Level**: HIGH
- **Recommendation**: REVIEW CHANGES, COMMIT OR STASH
- **Action Required**:
  1. Review App.tsx changes
  2. Decide if changes should be committed to PR #778
  3. Handle package-lock.json (add to gitignore or commit)
  4. Once clean, can merge PR or keep worktree

#### 2.2 phase-2.1-lark-sync
- **Path**: `.worktrees/phase-2.1-lark-sync`
- **Branch**: `feat/lark-sync-core`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 34,628 (mostly target/, 7 real changes)
- **Real Changes**:
  - `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md`
  - `.claude/agents/tmux_agents_control.md`
  - `.claude/commands/tmux-orchestra-start.md`
  - `.codex/CODEX.md`
  - `.codex/CODEX_TMUX_PARALLEL_EXECUTION.md`
  - `.codex/commands/tmux-orchestra-start.md`
  - `CLAUDE_v3.0_backup.md`
- **Remote Branch**: `origin/feat/miyabi-lark-sync` (different name)
- **Status**: Phase 2 in progress, documentation changes
- **Risk Level**: MEDIUM
- **Recommendation**: CLEAN TARGET/, REVIEW DOCS, COMMIT OR DISCARD
- **Action Required**:
  1. Clean target/ directory: `cargo clean` or `git clean -fdx target/`
  2. Review documentation changes
  3. Commit if valuable, discard if experimental

#### 2.3 phase-2.2-task-manager
- **Path**: `.worktrees/phase-2.2-task-manager`
- **Branch**: `feat/task-manager`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 34,628 (similar pattern to 2.1)
- **Remote Branch**: None
- **Status**: Phase 2 in progress
- **Risk Level**: MEDIUM
- **Recommendation**: CLEAN TARGET/, REVIEW CHANGES
- **Action Required**: Same as 2.1

#### 2.4 phase-2.3-mcp-integration
- **Path**: `.worktrees/phase-2.3-mcp-integration`
- **Branch**: `feat/lark-mcp`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 34,628 (similar pattern to 2.1, 2.2)
- **Remote Branch**: None
- **Status**: Phase 2 in progress
- **Risk Level**: MEDIUM
- **Recommendation**: CLEAN TARGET/, REVIEW CHANGES
- **Action Required**: Same as 2.1, 2.2

---

### Category 3: Active Development (3 worktrees)

These worktrees appear to be actively used or have significant uncommitted work.

#### 3.1 pr-773-fix
- **Path**: `.worktrees/pr-773-fix`
- **Branch**: `worktree/pr-773-fix`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 35,146 (massive, mostly target/)
- **Remote Branch**: None
- **Status**: PR fix in progress
- **Risk Level**: HIGH
- **Recommendation**: KEEP, CLEAN TARGET/
- **Reason**: Active PR work, need to investigate changes beyond target/

#### 3.2 task-mcp-handshake
- **Path**: `.worktrees/task-mcp-handshake`
- **Branch**: `worktree/task-mcp-handshake`
- **Last Commit**: 2025-11-12 (CLAUDE.md update)
- **Changed Files**: 104 (many new directories/files)
- **Remote Branch**: None
- **Status**: Active MCP integration work
- **Risk Level**: HIGH
- **Recommendation**: KEEP, REVIEW NEW FILES
- **Reason**: New directories and configuration files suggest active development

#### 3.3 Current Branch (pr-778-review)
- **Path**: `/Users/shunsuke/Dev/miyabi-private` (main worktree)
- **Branch**: `pr-778-review`
- **Status**: Current working directory
- **Recommendation**: KEEP (obviously)

---

## Actions Taken Today

### Phase 1: Analysis Complete
- Analyzed all 13 worktrees
- Checked commit history, branch status, uncommitted changes
- Verified remote tracking branches
- Checked for associated PRs
- Categorized by risk and status

### Phase 2: No Destructive Actions (Safe Approach)
- Did not remove any worktrees (user approval needed)
- Did not commit or discard changes
- Created comprehensive documentation

---

## Recommended Action Plan

### Immediate Actions (Low Risk)

1. **Clean build artifacts in all worktrees**:
   ```bash
   for wt in .worktrees/*/; do
     (cd "$wt" && cargo clean 2>/dev/null || true)
   done
   ```

2. **Remove safe worktrees** (after user confirmation):
   ```bash
   # Safe candidates
   git worktree remove .worktrees/codex-pr-review
   git worktree remove .worktrees/log-comment
   git worktree remove .worktrees/phase1-18-codex-setup
   git worktree remove .worktrees/root-dir-cleanup
   ```

3. **Unlock and review miyabi-orchestra**:
   ```bash
   git worktree unlock .worktrees/miyabi-orchestra
   # Then assess if still needed
   ```

### Manual Review Required (Medium Risk)

4. **Review issue-708 changes**:
   ```bash
   cd .worktrees/issue-708
   git diff miyabi-desktop/src/App.tsx
   # Decide: commit to PR #778 or discard
   ```

5. **Review and clean Phase 2 worktrees**:
   ```bash
   cd .worktrees/phase-2.1-lark-sync
   cargo clean
   git status
   # Review doc changes, commit or discard
   ```

6. **Same for phase-2.2 and phase-2.3**

### Keep for Now (High Risk)

7. **Keep pr-773-fix**: Active PR work
8. **Keep task-mcp-handshake**: Active MCP work
9. **Keep issue-787-video-pipeline**: After cleaning target/, reassess

---

## Automation Scripts

### Script 1: Safe Cleanup (User Approval Required)

```bash
#!/bin/bash
# safe-worktree-cleanup.sh

echo "Removing safe worktrees..."

# Safe candidates (no uncommitted changes, no active work)
safe_worktrees=(
  "codex-pr-review"
  "log-comment"
  "phase1-18-codex-setup"
  "root-dir-cleanup"
)

for wt in "${safe_worktrees[@]}"; do
  if [ -d ".worktrees/$wt" ]; then
    echo "Removing .worktrees/$wt..."
    git worktree remove ".worktrees/$wt" --force
  fi
done

# Unlock and remove miyabi-orchestra if confirmed
if [ -d ".worktrees/miyabi-orchestra" ]; then
  echo "Unlocking miyabi-orchestra..."
  git worktree unlock .worktrees/miyabi-orchestra
  echo "Review and remove manually if not needed"
fi

echo "Safe cleanup complete!"
echo "Run 'git worktree list' to verify"
```

### Script 2: Clean Build Artifacts

```bash
#!/bin/bash
# clean-worktree-builds.sh

echo "Cleaning build artifacts in all worktrees..."

for wt in .worktrees/*/; do
  if [ -d "$wt" ]; then
    echo "Cleaning $wt..."
    (cd "$wt" && cargo clean 2>/dev/null || true)
  fi
done

echo "Build cleanup complete!"
echo "Re-run worktree analysis to see actual code changes"
```

### Script 3: Generate Status Report

```bash
#!/bin/bash
# worktree-status.sh

echo "# Worktree Status Report"
echo "Generated: $(date)"
echo ""

git worktree list | while read -r path commit branch; do
  echo "## $path"
  echo "Branch: $branch"
  (cd "$path" && \
    echo "Last commit: $(git log -1 --format='%cd %s' --date=short)" && \
    echo "Changed files: $(git status --short | wc -l | xargs)" && \
    echo "Real changes: $(git status --short | grep -v 'target/' | wc -l | xargs)")
  echo ""
done
```

---

## Risk Assessment Summary

| Risk Level | Count | Action |
|------------|-------|--------|
| LOW        | 6     | Safe to remove after review |
| MEDIUM     | 4     | Clean build artifacts, review docs |
| HIGH       | 3     | Keep, active development |

---

## Storage Impact

### Before Cleanup
- Total worktrees: 13
- Approximate disk usage: ~15 GB (including all target/ directories)

### After Cleanup (Estimated)
- Worktrees to remove: 5-6
- Build artifact cleanup: ~10 GB savings
- Remaining worktrees: 7-8
- Estimated disk usage: ~5 GB

---

## Next Steps

1. **User Decision Required**:
   - Approve removal of 4-6 safe worktrees
   - Review uncommitted changes in issue-708
   - Decide on Phase 2 worktrees (keep or consolidate)

2. **Execute Cleanup**:
   - Run safe cleanup script
   - Clean build artifacts
   - Remove approved worktrees

3. **Post-Cleanup**:
   - Verify worktree list
   - Update documentation
   - Close Issue #812

---

## Conclusion

**Safe to proceed with**:
- Removing 4 worktrees immediately (codex-pr-review, log-comment, phase1-18-codex-setup, root-dir-cleanup)
- Cleaning build artifacts in all worktrees
- Unlocking miyabi-orchestra for review

**Needs manual review**:
- issue-708: Uncommitted App.tsx changes
- Phase 2 worktrees: Document changes
- pr-773-fix: Large uncommitted changes
- task-mcp-handshake: New configuration files

**Recommendation**: Start with safe cleanups, then address manual review items one by one.

---

**Report Generated By**: Miyabi Agent
**Date**: 2025-11-12
**Status**: Analysis Complete, Awaiting User Approval
