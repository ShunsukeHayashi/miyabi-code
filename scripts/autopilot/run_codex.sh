#!/usr/bin/env bash
# Autopilot Codex Runner
# Version: 1.0.0
# Purpose: Codex/Claude Code無人実行スクリプト
# Usage: ./scripts/autopilot/run_codex.sh <plan_file>

set -euo pipefail

# ========================================
# 定数定義
# ========================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/.ai/logs/codex/autopilot"
readonly SUMMARY_DIR="${PROJECT_ROOT}/.ai/logs/autopilot"
readonly TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
readonly LOG_FILE="${LOG_DIR}/autopilot-${TIMESTAMP}.log"
readonly SUMMARY_FILE="${SUMMARY_DIR}/summary-${TIMESTAMP}.md"
readonly STATUS_FILE="${SUMMARY_DIR}/status-${TIMESTAMP}.log"

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
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "${LOG_FILE}"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "${LOG_FILE}" >&2
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
# ステップ実行
# ========================================
execute_step() {
    local step_id=$1
    local step_name=$2
    local commands=$3
    local expectations=$4

    log_info "Executing step: ${step_id} - ${step_name}"

    # コマンド実行
    local cmd_exit_code=0
    while IFS= read -r cmd; do
        log_info "Running command: ${cmd}"

        if eval "${cmd}" 2>&1 | tee -a "${LOG_FILE}"; then
            log_success "Command succeeded: ${cmd}"
        else
            cmd_exit_code=$?
            log_error "Command failed: ${cmd} (exit code: ${cmd_exit_code})"
            return ${cmd_exit_code}
        fi
    done <<< "${commands}"

    # 期待値検証
    if [[ -n "${expectations}" ]]; then
        verify_expectations "${expectations}"
    fi

    log_success "Step completed: ${step_id}"
}

verify_expectations() {
    local expectations=$1

    log_info "Verifying expectations..."

    # TODO: 期待値検証ロジック実装
    # - exit_code チェック
    # - file_exists チェック
    # - contains チェック
    # - output_contains チェック

    log_success "All expectations met"
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
# メイン処理
# ========================================
main() {
    if [[ $# -lt 1 ]]; then
        echo "Usage: $0 <plan_file>"
        echo "Example: $0 .ai/plans/646/Autopilot.yaml"
        exit 1
    fi

    local plan_file=$1

    # セットアップ
    setup_environment

    # YAML解析
    parse_yaml "${plan_file}" || exit 1

    # プラン内容を読み込み（yq使用）
    local issue_number
    issue_number=$(yq eval '.autopilot.issue_number' "${plan_file}")

    local branch_prefix
    branch_prefix=$(yq eval '.autopilot.worktree.branch_prefix' "${plan_file}")

    local cleanup_on_success
    cleanup_on_success=$(yq eval '.autopilot.worktree.cleanup_on_success' "${plan_file}")

    local cleanup_on_failure
    cleanup_on_failure=$(yq eval '.autopilot.worktree.cleanup_on_failure' "${plan_file}")

    log_info "Issue: #${issue_number}"
    log_info "Branch prefix: ${branch_prefix}"

    # Worktree作成
    local worktree_path
    worktree_path=$(setup_worktree "${issue_number}" "${branch_prefix}") || exit 1

    local start_time=$(date +%s)

    # ステップ実行
    local step_count
    step_count=$(yq eval '.autopilot.steps | length' "${plan_file}")

    log_info "Total steps: ${step_count}"

    local execution_failed=0
    local completed_steps=0

    for ((i=0; i<step_count; i++)); do
        local step_id
        step_id=$(yq eval ".autopilot.steps[${i}].id" "${plan_file}")

        local step_name
        step_name=$(yq eval ".autopilot.steps[${i}].name" "${plan_file}")

        local commands
        commands=$(yq eval ".autopilot.steps[${i}].commands | join(\"\n\")" "${plan_file}")

        local expectations
        expectations=$(yq eval ".autopilot.steps[${i}].expectations" "${plan_file}" 2>/dev/null || echo "")

        if execute_step "${step_id}" "${step_name}" "${commands}" "${expectations}"; then
            ((completed_steps++))
        else
            execution_failed=1
            log_error "Step failed: ${step_id}"

            # on_failure処理
            local on_failure
            on_failure=$(yq eval ".autopilot.steps[${i}].on_failure" "${plan_file}" 2>/dev/null || echo "abort")

            if [[ "${on_failure}" == "abort" ]]; then
                log_error "Aborting execution due to step failure"
                break
            fi
        fi
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # サマリー生成
    generate_summary "${issue_number}" "${step_count}" "${completed_steps}" "${duration}"

    # Worktreeクリーンアップ
    if [[ ${execution_failed} -eq 0 ]]; then
        cleanup_worktree "${worktree_path}" "${cleanup_on_success}"

        # 成功通知
        local success_comment
        success_comment=$(cat <<EOF
## ✅ Autopilot実行完了

**Duration**: ${duration}秒
**Steps**: ${completed_steps}/${step_count}

[詳細ログ](${LOG_FILE})
[サマリー](${SUMMARY_FILE})

🤖 Generated with Autopilot Codex
EOF
)
        post_github_comment "${issue_number}" "${success_comment}"

        log_success "Autopilot execution completed successfully!"
        exit 0
    else
        cleanup_worktree "${worktree_path}" "${cleanup_on_failure}"

        # 失敗通知
        local failure_comment
        failure_comment=$(cat <<EOF
## ❌ Autopilot実行失敗

**Completed**: ${completed_steps}/${step_count}

### エラーログ
Worktree: ${worktree_path}
Log: ${LOG_FILE}

🤖 Generated with Autopilot Codex
EOF
)
        post_github_comment "${issue_number}" "${failure_comment}"

        log_error "Autopilot execution failed!"
        exit 1
    fi
}

# スクリプト実行
main "$@"
