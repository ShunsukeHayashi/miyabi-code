#!/usr/bin/env bash
##############################################################################
# Miyabi Autopilot - Codex Execution Engine
# Version: 2.0.0
# Purpose: Execute Autopilot.yaml plans with worktree isolation, security
#          guardrails, and comprehensive logging for unattended execution.
#
# Usage:
#   ./scripts/autopilot/run_codex.sh <issue-number> [options]
#
# Options:
#   --plan <path>        Custom Autopilot.yaml path (default: .ai/plans/<issue>/Autopilot.yaml)
#   --dry-run            Validate plan without executing
#   --verbose            Enable verbose logging
#   --no-cleanup         Keep worktree after execution
#   --timeout <seconds>  Override default timeout (default: from plan or 3600)
#
# Example:
#   ./scripts/autopilot/run_codex.sh 653
#   ./scripts/autopilot/run_codex.sh 653 --plan custom.yaml --verbose
##############################################################################

set -euo pipefail

# ========================================
# 定数定義 & グローバル変数
# ========================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/.ai/logs/codex/autopilot"
readonly SUMMARY_DIR="${PROJECT_ROOT}/.ai/logs/autopilot"
readonly TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
readonly LOG_FILE="${LOG_DIR}/autopilot-${TIMESTAMP}.log"
readonly SUMMARY_FILE="${SUMMARY_DIR}/summary-${TIMESTAMP}.md"
readonly STATUS_FILE="${SUMMARY_DIR}/status-${TIMESTAMP}.log"

# Arguments & execution control
ISSUE_NUMBER=""
PLAN_FILE=""
DRY_RUN=false
VERBOSE=false
NO_CLEANUP=false
TIMEOUT_OVERRIDE=""
WORKTREE_PATH=""
BRANCH_NAME=""

# Execution tracking
STEPS_TOTAL=0
STEPS_COMPLETED=0
CONSECUTIVE_FAILURES=0
MAX_FAILURES=3
EXIT_STATUS=0
FAILED_STEP_ID=""
FAILED_STEP_DESC=""
ERROR_MSG=""
FILES_CHANGED=0
START_EPOCH=$(date +%s)

# ========================================
# カラー出力
# ========================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ========================================
# ログ関数
# ========================================
log_info() {
    local msg="${BLUE}[INFO]${NC} $*"
    if [[ -d "$(dirname "${LOG_FILE}")" ]]; then
        echo -e "$msg" | tee -a "${LOG_FILE}"
    else
        echo -e "$msg"
    fi
}

log_success() {
    local msg="${GREEN}[SUCCESS]${NC} $*"
    if [[ -d "$(dirname "${LOG_FILE}")" ]]; then
        echo -e "$msg" | tee -a "${LOG_FILE}"
    else
        echo -e "$msg"
    fi
}

log_warn() {
    local msg="${YELLOW}[WARN]${NC} $*"
    if [[ -d "$(dirname "${LOG_FILE}")" ]]; then
        echo -e "$msg" | tee -a "${LOG_FILE}"
    else
        echo -e "$msg"
    fi
}

log_error() {
    local msg="${RED}[ERROR]${NC} $*"
    if [[ -d "$(dirname "${LOG_FILE}")" ]]; then
        echo -e "$msg" | tee -a "${LOG_FILE}" >&2
    else
        echo -e "$msg" >&2
    fi
}

# ========================================
# エラーハンドリング
# ========================================
cleanup() {
    local exit_code=$?
    if [[ ${exit_code} -ne 0 ]]; then
        log_error "Autopilot failed with exit code: ${exit_code}"
        generate_failure_report "${exit_code}"
    fi
}

trap cleanup EXIT

# ========================================
# セットアップ
# ========================================
setup_environment() {
    log_info "Setting up environment..."

    # ログディレクトリ作成
    mkdir -p "${LOG_DIR}" "${SUMMARY_DIR}"

    # 初期ログ出力
    {
        echo "==================================="
        echo "Autopilot Codex Runner"
        echo "==================================="
        echo "Started at: $(date)"
        echo "Project: ${PROJECT_ROOT}"
        echo "Log file: ${LOG_FILE}"
        echo "==================================="
    } | tee -a "${LOG_FILE}"
}

# ========================================
# YAML解析（yqを使用）
# ========================================
parse_yaml() {
    local plan_file=$1

    if [[ ! -f "${plan_file}" ]]; then
        log_error "Plan file not found: ${plan_file}"
        return 1
    fi

    # yqがインストールされているか確認
    if ! command -v yq &> /dev/null; then
        log_error "yq is not installed. Please install: brew install yq"
        return 1
    fi

    log_info "Parsing plan file: ${plan_file}"

    # YAML内容を検証
    if ! yq eval '.' "${plan_file}" &> /dev/null; then
        log_error "Invalid YAML format in: ${plan_file}"
        return 1
    fi

    log_success "Plan file parsed successfully"
}

# ========================================
# Worktree管理
# ========================================
setup_worktree() {
    local issue_number=$1
    local branch_prefix=$2

    local branch_name="${branch_prefix}${issue_number}"
    local worktree_path="${PROJECT_ROOT}/.worktrees/${branch_name}"

    log_info "Setting up worktree: ${worktree_path}"

    # 既存Worktreeをチェック
    if [[ -d "${worktree_path}" ]]; then
        log_warn "Worktree already exists: ${worktree_path}"
        log_info "Removing existing worktree..."
        cd "${PROJECT_ROOT}"
        git worktree remove "${worktree_path}" --force || true
    fi

    # Worktree作成
    cd "${PROJECT_ROOT}"
    git worktree add "${worktree_path}" -b "${branch_name}" || {
        log_error "Failed to create worktree"
        return 1
    }

    # Worktreeに移動
    cd "${worktree_path}"

    log_success "Worktree created: ${worktree_path}"
    echo "${worktree_path}"
}

cleanup_worktree() {
    local worktree_path=$1
    local cleanup_enabled=$2

    if [[ "${cleanup_enabled}" == "true" ]]; then
        log_info "Cleaning up worktree: ${worktree_path}"
        cd "${PROJECT_ROOT}"
        git worktree remove "${worktree_path}" --force || log_warn "Failed to remove worktree"
        log_success "Worktree cleaned up"
    else
        log_info "Worktree cleanup skipped (cleanup_enabled=${cleanup_enabled})"
        log_info "Worktree preserved at: ${worktree_path}"
    fi
}

# ========================================
# ステップ実行 (with rollback & timeout support)
# ========================================
execute_step() {
    local step_id=$1
    local step_desc=$2
    local command=$3
    local expectation=$4
    local rollback=$5
    local optional=$6
    local timeout_sec=$7

    log_info "================================================"
    log_info "Step: ${step_id} - ${step_desc}"
    log_info "================================================"

    # Change to worktree
    cd "${WORKTREE_PATH}"

    # Count files before execution
    local files_before
    files_before=$(git status --porcelain 2>/dev/null | wc -l || echo 0)

    # Execute command with timeout
    local cmd_exit_code=0
    log_info "Executing: ${command}"

    if timeout "${timeout_sec}" bash -c "${command}" 2>&1 | tee -a "${LOG_FILE}"; then
        cmd_exit_code=0
        log_success "Command succeeded"
    else
        cmd_exit_code=$?
        log_error "Command failed with exit code: ${cmd_exit_code}"
    fi

    # Count files after execution
    local files_after
    files_after=$(git status --porcelain 2>/dev/null | wc -l || echo 0)
    local files_created=$((files_after > files_before ? files_after - files_before : 0))
    local files_modified=${files_after}

    FILES_CHANGED=$((FILES_CHANGED + files_modified))

    # Evaluate expectation
    if evaluate_expectation "${expectation}" "${cmd_exit_code}" "${files_created}" "${files_modified}"; then
        log_success "Step ${step_id} completed successfully"
        return 0
    else
        log_error "Step ${step_id} failed (expectation: ${expectation} not met)"

        # Execute rollback if provided
        if [[ -n "${rollback}" ]] && [[ "${rollback}" != "null" ]]; then
            log_warn "Executing rollback: ${rollback}"
            if bash -c "${rollback}" 2>&1 | tee -a "${LOG_FILE}"; then
                log_success "Rollback successful"
            else
                log_error "Rollback failed"
            fi
        fi

        # Store failure info
        FAILED_STEP_ID="${step_id}"
        FAILED_STEP_DESC="${step_desc}"
        ERROR_MSG="Expectation '${expectation}' not met (exit code: ${cmd_exit_code}, files created: ${files_created}, files modified: ${files_modified})"

        # Check if step is optional
        if [[ "${optional}" == "true" ]]; then
            log_warn "Step ${step_id} is optional - continuing execution"
            return 0
        else
            return 1
        fi
    fi
}

# ========================================
# 期待値評価
# ========================================
evaluate_expectation() {
    local expectation=$1
    local exit_code=$2
    local files_created=$3
    local files_modified=$4

    case "${expectation}" in
        "exit_code == 0")
            [[ ${exit_code} -eq 0 ]]
            ;;
        "files_created > 0")
            [[ ${files_created} -gt 0 ]]
            ;;
        "files_modified > 0")
            [[ ${files_modified} -gt 0 ]]
            ;;
        "files_created > 0 || files_modified > 0")
            [[ ${files_created} -gt 0 ]] || [[ ${files_modified} -gt 0 ]]
            ;;
        "test_passed")
            [[ ${exit_code} -eq 0 ]]
            ;;
        *)
            # Default: check exit code
            log_warn "Unknown expectation: ${expectation}, defaulting to exit_code == 0"
            [[ ${exit_code} -eq 0 ]]
            ;;
    esac
}

# ========================================
# サマリー生成
# ========================================
generate_summary() {
    local issue_number=$1
    local total_steps=$2
    local completed_steps=$3
    local duration=$4

    log_info "Generating summary..."

    cat > "${SUMMARY_FILE}" <<EOF
# Autopilot Execution Summary

**Issue**: #${issue_number}
**Status**: ✅ SUCCESS
**Started**: $(date -r "${LOG_FILE}" "+%Y-%m-%d %H:%M:%S")
**Completed**: $(date "+%Y-%m-%d %H:%M:%S")
**Duration**: ${duration}
**Steps**: ${completed_steps}/${total_steps}

## Execution Log

[Full log](${LOG_FILE})

## Steps Executed

EOF

    # ステップ詳細を追加（TODO: YAML解析から取得）

    log_success "Summary generated: ${SUMMARY_FILE}"
}

generate_failure_report() {
    local exit_code=$1

    log_error "Generating failure report..."

    local failure_log="${LOG_DIR}/FAILED-${TIMESTAMP}.log"

    cat > "${failure_log}" <<EOF
# Autopilot Execution Failed

**Exit Code**: ${exit_code}
**Failed at**: $(date "+%Y-%m-%d %H:%M:%S")

## Error Log

$(tail -50 "${LOG_FILE}")

## Next Steps

1. Check full log: ${LOG_FILE}
2. Review worktree: Check if worktree was preserved
3. Manual intervention required

EOF

    log_error "Failure report generated: ${failure_log}"
}

# ========================================
# GitHub通知
# ========================================
post_github_comment() {
    local issue_number=$1
    local comment=$2

    log_info "Posting GitHub comment to issue #${issue_number}"

    if gh issue comment "${issue_number}" --body "${comment}"; then
        log_success "GitHub comment posted"
    else
        log_error "Failed to post GitHub comment"
    fi
}

# ========================================
# 引数パース
# ========================================
parse_arguments() {
    if [[ $# -lt 1 ]]; then
        echo "Usage: $0 <issue-number> [options]"
        echo ""
        echo "Options:"
        echo "  --plan <path>        Custom Autopilot.yaml path"
        echo "  --dry-run            Validate plan without executing"
        echo "  --verbose            Enable verbose logging"
        echo "  --no-cleanup         Keep worktree after execution"
        echo "  --timeout <seconds>  Override default timeout"
        exit 1
    fi

    ISSUE_NUMBER="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --plan)
                PLAN_FILE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --no-cleanup)
                NO_CLEANUP=true
                shift
                ;;
            --timeout)
                TIMEOUT_OVERRIDE="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Set default plan path
    if [[ -z "${PLAN_FILE}" ]]; then
        PLAN_FILE="${PROJECT_ROOT}/.ai/plans/${ISSUE_NUMBER}/Autopilot.yaml"
    fi

    # Validate
    if [[ ! "${ISSUE_NUMBER}" =~ ^[0-9]+$ ]]; then
        log_error "Invalid issue number: ${ISSUE_NUMBER}"
        exit 1
    fi

    if [[ ! -f "${PLAN_FILE}" ]]; then
        log_error "Plan file not found: ${PLAN_FILE}"
        exit 1
    fi
}

# ========================================
# メイン処理
# ========================================
main() {
    # セットアップ
    setup_environment

    # 引数パース
    parse_arguments "$@"

    log_info "=== Miyabi Autopilot Execution ==="
    log_info "Issue: #${ISSUE_NUMBER}"
    log_info "Plan: ${PLAN_FILE}"
    log_info "Dry run: ${DRY_RUN}"
    log_info "======================================"

    # YAML解析 & バリデーション
    parse_yaml "${PLAN_FILE}" || exit 1

    # Get plan configuration
    MAX_FAILURES=$(yq eval '.config.max_failures // 3' "${PLAN_FILE}")
    local timeout_seconds=$(yq eval '.config.timeout_seconds // 3600' "${PLAN_FILE}")

    if [[ -n "${TIMEOUT_OVERRIDE}" ]]; then
        timeout_seconds="${TIMEOUT_OVERRIDE}"
    fi

    log_info "Max failures: ${MAX_FAILURES}"
    log_info "Timeout: ${timeout_seconds}s"

    # Read steps count
    STEPS_TOTAL=$(yq eval '.steps | length' "${PLAN_FILE}")
    log_info "Total steps: ${STEPS_TOTAL}"

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_success "Dry run mode - plan validated, exiting without execution"
        exit 0
    fi

    # Worktree作成
    BRANCH_NAME="autopilot/issue-${ISSUE_NUMBER}-${TIMESTAMP}"
    WORKTREE_PATH="${PROJECT_ROOT}/.worktrees/autopilot-${ISSUE_NUMBER}-${TIMESTAMP}"
    WORKTREE_PATH=$(setup_worktree "${ISSUE_NUMBER}" "autopilot/issue-") || exit 1

    # ステップ実行
    local execution_failed=0

    for ((i=0; i<STEPS_TOTAL; i++)); do
        local step_id
        step_id=$(yq eval ".steps[${i}].id" "${PLAN_FILE}")

        local step_desc
        step_desc=$(yq eval ".steps[${i}].description" "${PLAN_FILE}")

        local command
        command=$(yq eval ".steps[${i}].command" "${PLAN_FILE}")

        local expectation
        expectation=$(yq eval ".steps[${i}].expectation" "${PLAN_FILE}")

        local rollback
        rollback=$(yq eval ".steps[${i}].rollback" "${PLAN_FILE}")

        local optional
        optional=$(yq eval ".steps[${i}].optional" "${PLAN_FILE}")

        if execute_step "${step_id}" "${step_desc}" "${command}" "${expectation}" "${rollback}" "${optional}" "${timeout_seconds}"; then
            ((STEPS_COMPLETED++))
            CONSECUTIVE_FAILURES=0
        else
            execution_failed=1
            ((CONSECUTIVE_FAILURES++))

            if [[ ${CONSECUTIVE_FAILURES} -ge ${MAX_FAILURES} ]]; then
                log_error "Aborting: ${CONSECUTIVE_FAILURES} consecutive failures (max: ${MAX_FAILURES})"
                break
            fi
        fi
    done

    local end_time=$(date +%s)
    local duration=$((end_time - START_EPOCH))

    # サマリー生成
    generate_summary "${ISSUE_NUMBER}" "${STEPS_TOTAL}" "${STEPS_COMPLETED}" "${duration}"

    # Worktreeクリーンアップ
    local cleanup_enabled
    if [[ ${execution_failed} -eq 0 ]]; then
        cleanup_enabled=$(yq eval '.cleanup.remove_worktree // true' "${PLAN_FILE}")
    else
        cleanup_enabled=$(yq eval '.cleanup.remove_branch_on_failure // false' "${PLAN_FILE}")
    fi

    if [[ "${NO_CLEANUP}" == "true" ]]; then
        cleanup_enabled="false"
    fi

    cleanup_worktree "${WORKTREE_PATH}" "${cleanup_enabled}"

    # 通知
    if [[ ${execution_failed} -eq 0 ]]; then
        local success_comment
        success_comment=$(cat <<EOF
✅ Autopilot execution completed successfully

**Duration**: ${duration}s
**Steps**: ${STEPS_COMPLETED}/${STEPS_TOTAL}
**Files changed**: ${FILES_CHANGED}

See logs: \`.ai/logs/autopilot/summary-${TIMESTAMP}.md\`

🤖 Generated via Autopilot
EOF
)
        post_github_comment "${ISSUE_NUMBER}" "${success_comment}"
        log_success "Autopilot execution completed successfully!"
        exit 0
    else
        local failure_comment
        failure_comment=$(cat <<EOF
❌ Autopilot execution failed

**Failed at step**: ${FAILED_STEP_ID} - ${FAILED_STEP_DESC}
**Error**: ${ERROR_MSG}
**Duration**: ${duration}s

See failure log: \`.ai/logs/autopilot/failed/FAILED-${TIMESTAMP}.log\`

🚨 Manual intervention required
EOF
)
        post_github_comment "${ISSUE_NUMBER}" "${failure_comment}"
        log_error "Autopilot execution failed!"
        exit 1
    fi
}

# スクリプト実行
main "$@"
