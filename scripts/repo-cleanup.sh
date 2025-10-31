#!/bin/bash
# Repository Cleanup Script
# Cleans up merged branches, stale worktrees, and old artifacts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
BRANCHES_DELETED=0
WORKTREES_REMOVED=0
ARTIFACTS_CLEANED=0

# Logging
log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*" >&2; }

# Dry run flag
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    log_warn "DRY RUN MODE - No changes will be made"
fi

# Create report directory
REPORT_DIR="$PROJECT_ROOT/.ai/reports"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/cleanup-report-$(date +%Y%m%d-%H%M%S).md"

# Initialize report
cat > "$REPORT_FILE" <<EOF
# Repository Cleanup Report

**Date**: $(date)
**Mode**: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")

## Before Cleanup

EOF

# Capture before state
log_info "Capturing current repository state..."

BEFORE_BRANCHES=$(git branch | wc -l | tr -d ' ')
BEFORE_WORKTREES=$(git worktree list | wc -l | tr -d ' ')
BEFORE_DISK_GIT=$(du -sh .git 2>/dev/null | awk '{print $1}')
BEFORE_DISK_WORKTREES=$(du -sh .worktrees 2>/dev/null | awk '{print $1}' || echo "0K")
BEFORE_DISK_AI=$(du -sh .ai 2>/dev/null | awk '{print $1}')

cat >> "$REPORT_FILE" <<EOF
- **Local Branches**: $BEFORE_BRANCHES
- **Worktrees**: $BEFORE_WORKTREES
- **Disk Usage (.git)**: $BEFORE_DISK_GIT
- **Disk Usage (.worktrees)**: $BEFORE_DISK_WORKTREES
- **Disk Usage (.ai)**: $BEFORE_DISK_AI

## Actions Taken

EOF

log_success "Current state captured"

# ============================================================================
# Phase 1: Merged Branch Cleanup
# ============================================================================

log_info "=== Phase 1: Merged Branch Cleanup ==="

# Get merged branches
MERGED_BRANCHES=$(git branch --merged main | grep -v "main\|master\|\*" | sed 's/^[ \t]*//' || echo "")

if [ -z "$MERGED_BRANCHES" ]; then
    log_info "No merged branches to clean up"
else
    log_info "Found $(echo "$MERGED_BRANCHES" | wc -l | tr -d ' ') merged branches"

    echo "$MERGED_BRANCHES" | while read -r branch; do
        if [ -n "$branch" ]; then
            if [ "$DRY_RUN" = true ]; then
                log_warn "Would delete branch: $branch"
            else
                if git branch -d "$branch" 2>/dev/null; then
                    log_success "Deleted merged branch: $branch"
                    BRANCHES_DELETED=$((BRANCHES_DELETED + 1))
                else
                    log_warn "Could not delete branch: $branch"
                fi
            fi
        fi
    done
fi

# Remote prune
log_info "Pruning remote tracking branches..."
if [ "$DRY_RUN" = true ]; then
    git remote prune origin --dry-run
else
    git remote prune origin
    log_success "Remote tracking branches pruned"
fi

cat >> "$REPORT_FILE" <<EOF
### Phase 1: Branch Cleanup
- Merged branches deleted: $BRANCHES_DELETED

EOF

# ============================================================================
# Phase 2: Worktree Cleanup
# ============================================================================

log_info "=== Phase 2: Worktree Cleanup ==="

if [ ! -d ".worktrees" ]; then
    log_info "No .worktrees directory found"
else
    # Find merged worktrees
    for wt_path in .worktrees/*; do
        if [ -d "$wt_path" ]; then
            wt_name=$(basename "$wt_path")

            # Get branch name for this worktree
            if cd "$wt_path" 2>/dev/null; then
                branch=$(git branch --show-current 2>/dev/null || echo "")
                cd "$PROJECT_ROOT"

                if [ -n "$branch" ]; then
                    # Check if branch is merged
                    if git branch --merged main | grep -q "^  $branch\$"; then
                        if [ "$DRY_RUN" = true ]; then
                            log_warn "Would remove merged worktree: $wt_name ($branch)"
                        else
                            if git worktree remove "$wt_path" --force 2>/dev/null; then
                                log_success "Removed merged worktree: $wt_name ($branch)"
                                WORKTREES_REMOVED=$((WORKTREES_REMOVED + 1))
                            else
                                log_warn "Could not remove worktree: $wt_name"
                            fi
                        fi
                    fi
                fi
            fi
        fi
    done

    # Clean up world-* worktrees (Issue #270 related)
    log_info "Cleaning up world-* worktrees..."
    git worktree list | grep -E "world-alpha|world-beta|world-gamma|world-delta|world-epsilon" | awk '{print $1}' | while read -r wt_path; do
        if [ -n "$wt_path" ]; then
            wt_name=$(basename "$wt_path")
            if [ "$DRY_RUN" = true ]; then
                log_warn "Would remove world worktree: $wt_name"
            else
                if git worktree remove "$wt_path" --force 2>/dev/null; then
                    log_success "Removed world worktree: $wt_name"
                    WORKTREES_REMOVED=$((WORKTREES_REMOVED + 1))
                else
                    log_warn "Could not remove worktree: $wt_name"
                fi
            fi
        fi
    done
fi

cat >> "$REPORT_FILE" <<EOF
### Phase 2: Worktree Cleanup
- Worktrees removed: $WORKTREES_REMOVED

EOF

# ============================================================================
# Phase 3: Stale Branch Detection
# ============================================================================

log_info "=== Phase 3: Stale Branch Detection ==="

# Find branches not updated in 90 days
STALE_DATE=$(date -v-90d +%Y-%m-%d 2>/dev/null || date -d '90 days ago' +%Y-%m-%d)

log_info "Detecting branches not updated since $STALE_DATE..."

STALE_BRANCHES=$(git for-each-ref --sort=-committerdate refs/heads/ \
    --format='%(refname:short)|%(committerdate:iso)|%(committerdate:relative)' \
    | awk -F'|' -v date="$STALE_DATE" '$2 < date {print $1"|"$3}' || echo "")

if [ -z "$STALE_BRANCHES" ]; then
    log_info "No stale branches found"
else
    log_warn "Found stale branches (not updated in 90+ days):"
    echo "$STALE_BRANCHES" | while IFS='|' read -r branch age; do
        if [ -n "$branch" ]; then
            log_warn "  - $branch (last update: $age)"
        fi
    done

    # Archive stale branches
    if [ "$DRY_RUN" = false ]; then
        mkdir -p .ai/archive/branches
        BUNDLE_FILE=".ai/archive/branches/stale-$(date +%Y%m%d).bundle"

        log_info "Archiving stale branches to $BUNDLE_FILE..."
        BRANCH_LIST=$(echo "$STALE_BRANCHES" | cut -d'|' -f1 | tr '\n' ' ')

        if [ -n "$BRANCH_LIST" ]; then
            git bundle create "$BUNDLE_FILE" $BRANCH_LIST 2>/dev/null || log_warn "Could not create bundle"
            log_success "Stale branches archived"
        fi
    fi
fi

cat >> "$REPORT_FILE" <<EOF
### Phase 3: Stale Branch Detection
- Stale branches found: $(echo "$STALE_BRANCHES" | wc -l | tr -d ' ')
- Archive bundle: .ai/archive/branches/stale-$(date +%Y%m%d).bundle

EOF

# ============================================================================
# Phase 4: Artifact Cleanup
# ============================================================================

log_info "=== Phase 4: Artifact Cleanup ==="

# Old logs (30+ days)
if [ -d ".ai/logs" ]; then
    OLD_LOGS=$(find .ai/logs/ -type f -mtime +30 2>/dev/null || echo "")
    if [ -n "$OLD_LOGS" ]; then
        LOG_COUNT=$(echo "$OLD_LOGS" | wc -l | tr -d ' ')
        log_info "Found $LOG_COUNT old log files (30+ days)"

        if [ "$DRY_RUN" = false ]; then
            find .ai/logs/ -type f -mtime +30 -delete
            log_success "Old logs deleted"
            ARTIFACTS_CLEANED=$((ARTIFACTS_CLEANED + LOG_COUNT))
        fi
    fi
fi

# Old plans (30+ days)
if [ -d ".ai/plans" ]; then
    mkdir -p .ai/archive/plans
    OLD_PLANS=$(find .ai/plans/ -type f -mtime +30 2>/dev/null || echo "")
    if [ -n "$OLD_PLANS" ]; then
        PLAN_COUNT=$(echo "$OLD_PLANS" | wc -l | tr -d ' ')
        log_info "Found $PLAN_COUNT old plan files (30+ days)"

        if [ "$DRY_RUN" = false ]; then
            find .ai/plans/ -type f -mtime +30 -exec mv {} .ai/archive/plans/ \; 2>/dev/null
            log_success "Old plans archived"
            ARTIFACTS_CLEANED=$((ARTIFACTS_CLEANED + PLAN_COUNT))
        fi
    fi
fi

# Build artifacts
log_info "Cleaning build artifacts..."
if [ "$DRY_RUN" = false ]; then
    cargo clean 2>/dev/null || log_warn "cargo clean failed"
    if [ -d "target/debug" ]; then
        rm -rf target/debug
        log_success "Debug build artifacts removed"
    fi
fi

cat >> "$REPORT_FILE" <<EOF
### Phase 4: Artifact Cleanup
- Old logs deleted: $LOG_COUNT
- Old plans archived: $PLAN_COUNT
- Build artifacts cleaned: Yes

EOF

# ============================================================================
# Phase 5: Report Generation
# ============================================================================

log_info "=== Phase 5: Finalizing Report ==="

# Capture after state
AFTER_BRANCHES=$(git branch | wc -l | tr -d ' ')
AFTER_WORKTREES=$(git worktree list | wc -l | tr -d ' ')
AFTER_DISK_GIT=$(du -sh .git 2>/dev/null | awk '{print $1}')
AFTER_DISK_WORKTREES=$(du -sh .worktrees 2>/dev/null | awk '{print $1}' || echo "0K")
AFTER_DISK_AI=$(du -sh .ai 2>/dev/null | awk '{print $1}')

cat >> "$REPORT_FILE" <<EOF

## After Cleanup

- **Local Branches**: $AFTER_BRANCHES (before: $BEFORE_BRANCHES)
- **Worktrees**: $AFTER_WORKTREES (before: $BEFORE_WORKTREES)
- **Disk Usage (.git)**: $AFTER_DISK_GIT (before: $BEFORE_DISK_GIT)
- **Disk Usage (.worktrees)**: $AFTER_DISK_WORKTREES (before: $BEFORE_DISK_WORKTREES)
- **Disk Usage (.ai)**: $AFTER_DISK_AI (before: $BEFORE_DISK_AI)

## Summary

- **Branches Deleted**: $BRANCHES_DELETED
- **Worktrees Removed**: $WORKTREES_REMOVED
- **Artifacts Cleaned**: $ARTIFACTS_CLEANED

## Next Steps

- [ ] Review remaining branches: \`git branch -vv\`
- [ ] Check worktree status: \`git worktree list\`
- [ ] Run git gc: \`git gc --aggressive --prune=now\`

---

**Generated by**: repo-cleanup.sh
**Status**: $([ "$DRY_RUN" = true ] && echo "DRY RUN - No changes made" || echo "COMPLETED")
EOF

log_success "Cleanup report saved to: $REPORT_FILE"

# Display summary
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                  Cleanup Summary                             ${CYAN}║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC} Branches Deleted:    $BRANCHES_DELETED"
echo -e "${CYAN}║${NC} Worktrees Removed:   $WORKTREES_REMOVED"
echo -e "${CYAN}║${NC} Artifacts Cleaned:   $ARTIFACTS_CLEANED"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}║${NC} Report: $REPORT_FILE"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"

if [ "$DRY_RUN" = true ]; then
    log_warn "This was a DRY RUN. No changes were made."
    log_info "Run without --dry-run to apply changes."
fi

log_success "Cleanup complete!"
