# Worktree Quick Actions - Issue #812

**For**: Repository Maintainer
**Status**: Phase 1 Complete, Ready for Phase 2

---

## TL;DR

✅ Removed 4 safe worktrees (31% reduction)
🎯 Next: Run build cleanup script (~10 GB savings)
📖 Full details: `.ai/reports/WORKTREE_CLEANUP_SUMMARY.md`

---

## Quick Commands

### Check Current Status
```bash
git worktree list
```

### Run Build Cleanup (Recommended)
```bash
# Safe operation - removes target/ directories only
.ai/scripts/clean-worktree-builds.sh
```

### Generate Status Report
```bash
# See real changes without build artifacts
.ai/scripts/worktree-status.sh
```

---

## Decision Tree

### For Each Remaining Worktree:

**miyabi-orchestra** (0 changes, unlocked):
- ✅ Safe to remove
- Command: `git worktree remove .worktrees/miyabi-orchestra`

**issue-708** (PR #778 open):
- ⚠️ Review App.tsx changes first
- Command: `cd .worktrees/issue-708 && git diff miyabi-desktop/src/App.tsx`
- Decision: Commit to PR or discard

**Phase 2 worktrees** (lark-sync, task-manager, mcp-integration):
- 🔄 Likely duplicate work
- Recommendation: Consolidate into one
- After build cleanup: Review and decide

**issue-787-video-pipeline**:
- 🔄 Clean build artifacts first
- Then: Assess if work is complete

**pr-773-fix**:
- 🚧 Active work, keep for now
- Clean build artifacts to see real changes

**task-mcp-handshake**:
- 🚧 Active work, keep for now
- Review new configuration files

---

## One-Liner Commands

```bash
# Remove miyabi-orchestra (if confirmed not in use)
git worktree remove .worktrees/miyabi-orchestra

# Clean all build artifacts (safe, recommended)
.ai/scripts/clean-worktree-builds.sh

# Check issue-708 changes
cd .worktrees/issue-708 && git diff miyabi-desktop/src/App.tsx

# Remove Phase 2 duplicates (after review)
git worktree remove .worktrees/phase-2.2-task-manager
git worktree remove .worktrees/phase-2.3-mcp-integration

# Full status check
.ai/scripts/worktree-status.sh | less
```

---

## If Something Goes Wrong

### Restore a Removed Worktree
```bash
# If you removed something by mistake
git worktree add .worktrees/<name> <branch-name>
```

### Check What Was Removed
```bash
# See commit message
git log -1 --stat

# See removed worktrees
git reflog | grep worktree
```

### Rollback Everything
```bash
# Revert the cleanup commit
git revert 21d6e5c84
```

---

## Priority Actions

### High Priority (Do Today)
1. Run build cleanup: `.ai/scripts/clean-worktree-builds.sh`
2. Remove miyabi-orchestra: `git worktree remove .worktrees/miyabi-orchestra`

### Medium Priority (This Week)
3. Review issue-708 changes
4. Consolidate Phase 2 worktrees
5. Generate new status report

### Low Priority (As Needed)
6. Review pr-773-fix and task-mcp-handshake
7. Close Issue #812

---

## Storage Calculator

```
Current Usage:
- Main worktree: ~2 GB
- 8 worktrees: ~10-13 GB
- Total: ~12-15 GB

After Build Cleanup:
- Main worktree: ~2 GB
- 8 worktrees: ~1-2 GB
- Total: ~3-4 GB

After Full Cleanup (5-6 worktrees):
- Main worktree: ~2 GB
- 5-6 worktrees: ~0.5-1 GB
- Total: ~2.5-3 GB

Savings: ~10-12 GB (67-80% reduction)
```

---

## Contact & Support

- **Full Analysis**: `.ai/reports/worktree-cleanup-20251112.md`
- **Action Log**: `.ai/reports/worktree-cleanup-actions-20251112.md`
- **Summary**: `.ai/reports/WORKTREE_CLEANUP_SUMMARY.md`
- **Issue**: https://github.com/customer-cloud/miyabi-private/issues/812

---

**Generated**: 2025-11-12
**Commit**: 21d6e5c84
**Status**: Ready for Phase 2 🚀
