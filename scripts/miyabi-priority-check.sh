#!/bin/bash
# ============================================
# Miyabi DevOPS Priority Enforcement System
# 厳格優先順位シーケンス強制スクリプト
# ============================================
#
# 目的: 判断の余地なく、絶対的な優先順位を強制
# 使用: miyabi-priority-check [--json|--verbose|--enforce]
#
# Exit Codes:
#   0 - 全優先タスク完了（技術的負債解消フェーズ）
#   1 - 承認済みPRあり
#   2 - CIエラーあり
#   3 - P0 (Critical) Issueあり
#   4 - レビュー待ちPRあり
#   5 - P1 (High) Issueあり
#   6 - P2 (Medium) Issueあり
#   7 - P3 (Low) Issueあり
#   99 - エラー発生
# ============================================

set -e

# カラー定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 設定
REPO_ROOT="${MIYABI_ROOT:-$HOME/Dev/01-miyabi/_core/miyabi-private}"
LOG_DIR="$REPO_ROOT/.ai/logs"
PRIORITY_LOG="$LOG_DIR/priority-check-$(date +%Y-%m-%d).log"

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# タイムスタンプ
timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# ログ出力
log() {
    local level="$1"
    local message="$2"
    echo "[$(timestamp)] [$level] $message" >> "$PRIORITY_LOG"
}

# JSONモードフラグ
JSON_MODE=false
VERBOSE_MODE=false
ENFORCE_MODE=false

# 引数解析
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --json) JSON_MODE=true ;;
        --verbose) VERBOSE_MODE=true ;;
        --enforce) ENFORCE_MODE=true ;;
        -h|--help)
            echo "Usage: $0 [--json|--verbose|--enforce]"
            echo ""
            echo "Options:"
            echo "  --json     JSON形式で出力"
            echo "  --verbose  詳細表示"
            echo "  --enforce  強制モード（違反時に作業ブロック）"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 99 ;;
    esac
    shift
done

# ============================================
# STEP 1: 承認済みPRマージ
# ============================================
check_approved_prs() {
    local count
    count=$(gh pr list --state open --search "review:approved" --json number 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_approved_prs() {
    gh pr list --state open --search "review:approved" --json number,title,url 2>/dev/null || echo "[]"
}

# ============================================
# STEP 2: CIエラー修正
# ============================================
check_ci_failures() {
    local count
    count=$(gh run list --status failure --limit 10 --json databaseId 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_ci_failures() {
    gh run list --status failure --limit 10 --json databaseId,name,conclusion,url,createdAt 2>/dev/null || echo "[]"
}

# ============================================
# STEP 3: P0 (Critical) Issue
# ============================================
check_p0_issues() {
    local count
    count=$(gh issue list --state open --label "priority/critical" --json number 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_p0_issues() {
    gh issue list --state open --label "priority/critical" --json number,title,url,labels 2>/dev/null || echo "[]"
}

# ============================================
# STEP 4: レビュー待ちPR
# ============================================
check_review_required() {
    local count
    count=$(gh pr list --state open --search "review:required" --json number 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_review_required() {
    gh pr list --state open --search "review:required" --json number,title,url,author 2>/dev/null || echo "[]"
}

# ============================================
# STEP 5: P1 (High) Issue
# ============================================
check_p1_issues() {
    local count
    count=$(gh issue list --state open --label "priority/high" --json number 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_p1_issues() {
    gh issue list --state open --label "priority/high" --json number,title,url,labels 2>/dev/null || echo "[]"
}

# ============================================
# STEP 6: P2 (Medium) Issue
# ============================================
check_p2_issues() {
    local count
    count=$(gh issue list --state open --label "priority/medium" --json number 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_p2_issues() {
    gh issue list --state open --label "priority/medium" --json number,title,url,labels 2>/dev/null || echo "[]"
}

# ============================================
# STEP 7: P3 (Low) Issue
# ============================================
check_p3_issues() {
    local count
    count=$(gh issue list --state open --label "priority/low" --json number 2>/dev/null | jq length || echo 0)
    echo "$count"
}

get_p3_issues() {
    gh issue list --state open --label "priority/low" --json number,title,url,labels 2>/dev/null || echo "[]"
}

# ============================================
# メイン処理
# ============================================
main() {
    log "INFO" "Priority check started"

    # 各ステップのカウント取得
    local approved_prs=$(check_approved_prs)
    local ci_failures=$(check_ci_failures)
    local p0_issues=$(check_p0_issues)
    local review_required=$(check_review_required)
    local p1_issues=$(check_p1_issues)
    local p2_issues=$(check_p2_issues)
    local p3_issues=$(check_p3_issues)

    # JSON出力モード
    if [ "$JSON_MODE" = true ]; then
        cat <<EOF
{
  "timestamp": "$(timestamp)",
  "steps": {
    "step1_approved_prs": {
      "count": $approved_prs,
      "status": $([ "$approved_prs" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_approved_prs)
    },
    "step2_ci_failures": {
      "count": $ci_failures,
      "status": $([ "$ci_failures" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_ci_failures)
    },
    "step3_p0_critical": {
      "count": $p0_issues,
      "status": $([ "$p0_issues" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_p0_issues)
    },
    "step4_review_required": {
      "count": $review_required,
      "status": $([ "$review_required" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_review_required)
    },
    "step5_p1_high": {
      "count": $p1_issues,
      "status": $([ "$p1_issues" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_p1_issues)
    },
    "step6_p2_medium": {
      "count": $p2_issues,
      "status": $([ "$p2_issues" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_p2_issues)
    },
    "step7_p3_low": {
      "count": $p3_issues,
      "status": $([ "$p3_issues" -gt 0 ] && echo '"blocked"' || echo '"clear"'),
      "items": $(get_p3_issues)
    }
  },
  "current_step": $(
    if [ "$approved_prs" -gt 0 ]; then echo '1';
    elif [ "$ci_failures" -gt 0 ]; then echo '2';
    elif [ "$p0_issues" -gt 0 ]; then echo '3';
    elif [ "$review_required" -gt 0 ]; then echo '4';
    elif [ "$p1_issues" -gt 0 ]; then echo '5';
    elif [ "$p2_issues" -gt 0 ]; then echo '6';
    elif [ "$p3_issues" -gt 0 ]; then echo '7';
    else echo '8';
    fi
  ),
  "action_required": $(
    if [ "$approved_prs" -gt 0 ]; then echo '"merge_approved_prs"';
    elif [ "$ci_failures" -gt 0 ]; then echo '"fix_ci_errors"';
    elif [ "$p0_issues" -gt 0 ]; then echo '"resolve_p0_issues"';
    elif [ "$review_required" -gt 0 ]; then echo '"review_pending_prs"';
    elif [ "$p1_issues" -gt 0 ]; then echo '"resolve_p1_issues"';
    elif [ "$p2_issues" -gt 0 ]; then echo '"resolve_p2_issues"';
    elif [ "$p3_issues" -gt 0 ]; then echo '"resolve_p3_issues"';
    else echo '"technical_debt"';
    fi
  )
}
EOF
        # Exit code設定
        if [ "$approved_prs" -gt 0 ]; then exit 1;
        elif [ "$ci_failures" -gt 0 ]; then exit 2;
        elif [ "$p0_issues" -gt 0 ]; then exit 3;
        elif [ "$review_required" -gt 0 ]; then exit 4;
        elif [ "$p1_issues" -gt 0 ]; then exit 5;
        elif [ "$p2_issues" -gt 0 ]; then exit 6;
        elif [ "$p3_issues" -gt 0 ]; then exit 7;
        else exit 0;
        fi
    fi

    # 通常出力モード
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   🔍 Miyabi DevOPS 優先順位チェック                ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║   判断の余地なし。例外なし。シーケンス実行。       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""

    # STEP 1: 承認済みPR
    if [ "$approved_prs" -gt 0 ]; then
        echo -e "${RED}🔴 STEP 1: 承認済みPRマージ ($approved_prs件)${NC}"
        echo ""
        echo "  ⚠️  新規作業を開始する前に、これらのPRをマージしてください"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh pr list --state open --search "review:approved" --json number,title --jq '.[] | "  - PR #\(.number): \(.title)"'
        fi
        echo ""
        echo -e "  ${YELLOW}実行コマンド:${NC}"
        echo "  gh pr list --state open --search \"review:approved\" --json number --jq '.[].number' | while read pr; do"
        echo "      gh pr merge \$pr --merge"
        echo "  done"
        echo "  git checkout main && git pull origin main"
        echo ""
        log "BLOCKED" "Step 1: $approved_prs approved PRs pending merge"

        if [ "$ENFORCE_MODE" = true ]; then
            echo -e "${RED}❌ ENFORCE MODE: 作業ブロック - 承認済みPRをマージしてください${NC}"
        fi
        exit 1
    fi

    # STEP 2: CIエラー
    if [ "$ci_failures" -gt 0 ]; then
        echo -e "${RED}🔴 STEP 2: CIエラー修正 ($ci_failures件)${NC}"
        echo ""
        echo "  ⚠️  CIが失敗しています。修正してください"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh run list --status failure --limit 5 --json name,conclusion,createdAt --jq '.[] | "  - \(.name): \(.conclusion) (\(.createdAt))"'
        fi
        echo ""
        echo -e "  ${YELLOW}実行コマンド:${NC}"
        echo "  gh run list --status failure"
        echo "  gh run view <run_id> --log"
        echo ""
        log "BLOCKED" "Step 2: $ci_failures CI failures"

        if [ "$ENFORCE_MODE" = true ]; then
            echo -e "${RED}❌ ENFORCE MODE: 作業ブロック - CIエラーを修正してください${NC}"
        fi
        exit 2
    fi

    # STEP 3: P0 Critical
    if [ "$p0_issues" -gt 0 ]; then
        echo -e "${RED}🔴 STEP 3: P0 Critical Issue ($p0_issues件)${NC}"
        echo ""
        echo "  ⚠️  Critical Issueがあります。即時対応が必要です"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh issue list --state open --label "priority/critical" --json number,title --jq '.[] | "  - Issue #\(.number): \(.title)"'
        fi
        echo ""
        echo -e "  ${YELLOW}実行コマンド:${NC}"
        echo "  issue=\$(gh issue list --state open --label \"priority/critical\" --json number --jq '.[0].number')"
        echo "  git worktree add .worktrees/issue-\$issue -b worktree/issue-\$issue"
        echo ""
        log "BLOCKED" "Step 3: $p0_issues P0 critical issues"

        if [ "$ENFORCE_MODE" = true ]; then
            echo -e "${RED}❌ ENFORCE MODE: 作業ブロック - P0 Issueを対応してください${NC}"
        fi
        exit 3
    fi

    # STEP 4: レビュー待ちPR
    if [ "$review_required" -gt 0 ]; then
        echo -e "${YELLOW}🟡 STEP 4: レビュー待ちPR ($review_required件)${NC}"
        echo ""
        echo "  ⚠️  レビューが必要なPRがあります"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh pr list --state open --search "review:required" --json number,title --jq '.[] | "  - PR #\(.number): \(.title)"'
        fi
        echo ""
        echo -e "  ${YELLOW}実行コマンド:${NC}"
        echo "  gh pr list --state open --search \"review:required\""
        echo "  gh pr view <pr_number> && gh pr review <pr_number>"
        echo ""
        log "BLOCKED" "Step 4: $review_required PRs need review"
        exit 4
    fi

    # STEP 5: P1 High
    if [ "$p1_issues" -gt 0 ]; then
        echo -e "${YELLOW}🟡 STEP 5: P1 High Issue ($p1_issues件)${NC}"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh issue list --state open --label "priority/high" --json number,title --jq '.[] | "  - Issue #\(.number): \(.title)"'
        fi
        echo ""
        echo -e "  ${YELLOW}実行コマンド:${NC}"
        echo "  gh issue list --state open --label \"priority/high\""
        echo ""
        log "BLOCKED" "Step 5: $p1_issues P1 high priority issues"
        exit 5
    fi

    # STEP 6: P2 Medium
    if [ "$p2_issues" -gt 0 ]; then
        echo -e "${GREEN}🟢 STEP 6: P2 Medium Issue ($p2_issues件)${NC}"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh issue list --state open --label "priority/medium" --json number,title --jq '.[] | "  - Issue #\(.number): \(.title)"'
        fi
        echo ""
        log "BLOCKED" "Step 6: $p2_issues P2 medium priority issues"
        exit 6
    fi

    # STEP 7: P3 Low
    if [ "$p3_issues" -gt 0 ]; then
        echo -e "${GREEN}🟢 STEP 7: P3 Low Issue ($p3_issues件)${NC}"
        echo ""
        if [ "$VERBOSE_MODE" = true ]; then
            gh issue list --state open --label "priority/low" --json number,title --jq '.[] | "  - Issue #\(.number): \(.title)"'
        fi
        echo ""
        log "BLOCKED" "Step 7: $p3_issues P3 low priority issues"
        exit 7
    fi

    # STEP 8: 技術的負債解消
    echo -e "${GREEN}✅ STEP 8: 技術的負債解消フェーズ${NC}"
    echo ""
    echo "  🎉 すべての優先タスクが完了しています！"
    echo "  技術的負債の解消や新機能開発に取り組めます。"
    echo ""
    log "CLEAR" "All priority tasks completed. Ready for technical debt or new features."
    exit 0
}

# 実行
main
