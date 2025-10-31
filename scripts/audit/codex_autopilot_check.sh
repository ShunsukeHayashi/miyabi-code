#!/usr/bin/env bash
# Autopilot Audit Script
# Version: 1.0.0
# Purpose: Autopilot実行結果の監査
# Usage: ./scripts/audit/codex_autopilot_check.sh [log_file]

set -euo pipefail

# ========================================
# 定数定義
# ========================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/.ai/logs/codex/autopilot"
readonly SUMMARY_DIR="${PROJECT_ROOT}/.ai/logs/autopilot"

# ========================================
# カラー出力
# ========================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ========================================
# 監査結果
# ========================================
AUDIT_PASSED=true
AUDIT_WARNINGS=0
AUDIT_ERRORS=0

# ========================================
# ログ関数
# ========================================
audit_info() {
    echo -e "${BLUE}[AUDIT]${NC} $*"
}

audit_pass() {
    echo -e "${GREEN}[PASS]${NC} $*"
}

audit_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    ((AUDIT_WARNINGS++))
}

audit_fail() {
    echo -e "${RED}[FAIL]${NC} $*"
    ((AUDIT_ERRORS++))
    AUDIT_PASSED=false
}

# ========================================
# 監査チェック
# ========================================

check_log_existence() {
    local log_file=$1

    audit_info "Checking log file existence..."

    if [[ -f "${log_file}" ]]; then
        audit_pass "Log file exists: ${log_file}"
        return 0
    else
        audit_fail "Log file not found: ${log_file}"
        return 1
    fi
}

check_log_completeness() {
    local log_file=$1

    audit_info "Checking log completeness..."

    # 必須キーワードチェック
    local required_keywords=(
        "Autopilot Codex Runner"
        "Started at:"
        "Project:"
    )

    for keyword in "${required_keywords[@]}"; do
        if grep -q "${keyword}" "${log_file}"; then
            audit_pass "Found keyword: ${keyword}"
        else
            audit_fail "Missing keyword: ${keyword}"
        fi
    done
}

check_worktree_cleanup() {
    audit_info "Checking worktree cleanup..."

    local worktree_dir="${PROJECT_ROOT}/.worktrees"

    if [[ ! -d "${worktree_dir}" ]]; then
        audit_pass "Worktree directory does not exist (clean)"
        return 0
    fi

    # autopilot/*パターンのworktreeをチェック
    local autopilot_worktrees
    autopilot_worktrees=$(find "${worktree_dir}" -maxdepth 1 -type d -name "autopilot*" 2>/dev/null || true)

    if [[ -z "${autopilot_worktrees}" ]]; then
        audit_pass "No autopilot worktrees found (clean)"
    else
        audit_warn "Found autopilot worktrees:"
        echo "${autopilot_worktrees}"
        audit_warn "These may be preserved for debugging"
    fi
}

check_summary_file() {
    audit_info "Checking summary file..."

    # 最新のサマリーファイルを探す
    local latest_summary
    latest_summary=$(find "${SUMMARY_DIR}" -name "summary-*.md" -type f | sort -r | head -1)

    if [[ -n "${latest_summary}" ]]; then
        audit_pass "Summary file found: ${latest_summary}"

        # サマリー内容チェック
        if grep -q "# Autopilot Execution Summary" "${latest_summary}"; then
            audit_pass "Summary file has valid header"
        else
            audit_fail "Summary file missing valid header"
        fi
    else
        audit_fail "No summary file found in ${SUMMARY_DIR}"
    fi
}

check_security_issues() {
    local log_file=$1

    audit_info "Checking for security issues..."

    # シークレット漏洩チェック
    local secret_patterns=(
        "ghp_[a-zA-Z0-9]{36}"  # GitHub Personal Access Token
        "sk-[a-zA-Z0-9]{48}"   # Anthropic API Key
        "AKIA[0-9A-Z]{16}"     # AWS Access Key
    )

    local found_secrets=false

    for pattern in "${secret_patterns[@]}"; do
        if grep -qE "${pattern}" "${log_file}"; then
            audit_fail "Potential secret found matching pattern: ${pattern}"
            found_secrets=true
        fi
    done

    if [[ "${found_secrets}" == "false" ]]; then
        audit_pass "No secrets found in logs"
    fi
}

check_exit_status() {
    local log_file=$1

    audit_info "Checking execution exit status..."

    # ログファイルから成功/失敗を判定
    if grep -q "Autopilot execution completed successfully" "${log_file}"; then
        audit_pass "Execution completed successfully"
    elif grep -q "Autopilot failed" "${log_file}"; then
        audit_warn "Execution failed (check failure report)"
    else
        audit_warn "Exit status unclear from log"
    fi
}

check_log_size() {
    local log_file=$1

    audit_info "Checking log file size..."

    local log_size
    log_size=$(wc -c < "${log_file}")

    local log_size_mb=$((log_size / 1024 / 1024))

    if [[ ${log_size_mb} -gt 10 ]]; then
        audit_warn "Log file is large: ${log_size_mb}MB (consider log rotation)"
    else
        audit_pass "Log file size is reasonable: ${log_size_mb}MB"
    fi
}

# ========================================
# サマリー生成
# ========================================
generate_audit_report() {
    echo ""
    echo "========================================="
    echo "Autopilot Audit Report"
    echo "========================================="
    echo "Date: $(date)"
    echo "Project: ${PROJECT_ROOT}"
    echo ""
    echo "Results:"
    echo "  Warnings: ${AUDIT_WARNINGS}"
    echo "  Errors: ${AUDIT_ERRORS}"
    echo ""

    if [[ "${AUDIT_PASSED}" == "true" ]]; then
        echo -e "${GREEN}✅ AUDIT PASSED${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ AUDIT FAILED${NC}"
        echo ""
        return 1
    fi
}

# ========================================
# メイン処理
# ========================================
main() {
    local log_file

    if [[ $# -eq 0 ]]; then
        # 最新のログファイルを自動検出
        log_file=$(find "${LOG_DIR}" -name "autopilot-*.log" -type f | sort -r | head -1)

        if [[ -z "${log_file}" ]]; then
            echo "No autopilot log files found in ${LOG_DIR}"
            exit 1
        fi

        audit_info "Using latest log file: ${log_file}"
    else
        log_file=$1
    fi

    echo "========================================="
    echo "Autopilot Audit Script"
    echo "========================================="
    echo "Log file: ${log_file}"
    echo "========================================="
    echo ""

    # 監査チェック実行
    check_log_existence "${log_file}" || exit 1
    check_log_completeness "${log_file}"
    check_worktree_cleanup
    check_summary_file
    check_security_issues "${log_file}"
    check_exit_status "${log_file}"
    check_log_size "${log_file}"

    # レポート生成
    generate_audit_report
}

# スクリプト実行
main "$@"
