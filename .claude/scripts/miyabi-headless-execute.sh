#!/usr/bin/env bash
# Miyabi Headless Execution with Optimized Context
# Version: 1.0.0
# Purpose: Execute Claude Code in headless mode with smart context loading

set -euo pipefail

MIYABI_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
LOADER_SCRIPT="$MIYABI_ROOT/.claude/scripts/miyabi-headless-loader.sh"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/miyabi-headless-output}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $*" >&2
}

log_error() {
    echo -e "${RED}✗${NC} $*" >&2
}

log_step() {
    echo -e "${MAGENTA}▶${NC} $*" >&2
}

usage() {
    cat <<EOF
$(echo -e "${CYAN}Miyabi Headless Execution${NC}")
$(echo -e "${GREEN}Version: 1.0.0${NC}")

Usage: $0 <task_description> [options]

Options:
    --context-only       Generate context file only, don't execute
    --cache-dir DIR      Specify custom cache directory
    --output-dir DIR     Specify output directory (default: $OUTPUT_DIR)
    --verbose           Show detailed logging
    --dry-run           Show what would be executed without running
    --help              Show this help message

Examples:
    $0 "Implement user authentication feature"
    $0 "Fix Issue #123" --verbose
    $0 "Run CoordinatorAgent for task decomposition" --context-only
    $0 "Analyze security vulnerabilities in miyabi-web-api" --dry-run

Task Types (auto-detected):
    - agent_execution: agent, execute, run, coordinate
    - code_implementation: implement, code, develop, fix, bug
    - issue_management: issue, label, triage, analyze
    - business_planning: business, strategy, market, crm
    - documentation: document, doc, readme, guide
    - testing_performance: test, benchmark, performance
    - deployment: deploy, release, publish, ci, cd
    - security: security, audit, vulnerability, scan
    - general: default for unmatched tasks
EOF
}

# 引数パース
parse_args() {
    local args=()
    CONTEXT_ONLY=false
    VERBOSE=false
    DRY_RUN=false
    CACHE_DIR="/tmp/miyabi-headless-context"
    TASK=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --context-only)
                CONTEXT_ONLY=true
                shift
                ;;
            --cache-dir)
                CACHE_DIR="$2"
                shift 2
                ;;
            --output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                TASK="$1"
                shift
                ;;
        esac
    done

    if [[ -z "$TASK" ]]; then
        log_error "Task description is required"
        usage
        exit 1
    fi

    export CONTEXT_CACHE="$CACHE_DIR"
}

# コンテキスト生成
generate_context() {
    local task="$1"

    log_step "Generating optimized context..."

    if [[ ! -x "$LOADER_SCRIPT" ]]; then
        log_error "Loader script not found or not executable: $LOADER_SCRIPT"
        exit 1
    fi

    local context_file
    context_file=$("$LOADER_SCRIPT" "$task")

    if [[ ! -f "$context_file" ]]; then
        log_error "Failed to generate context file"
        exit 1
    fi

    local size
    size=$(wc -c < "$context_file" | tr -d ' ')
    log_success "Context file generated: $context_file ($size bytes)"

    echo "$context_file"
}

# ヘッドレスモード実行
execute_headless() {
    local task="$1"
    local context_file="$2"

    log_step "Executing Claude Code in headless mode..."

    # 出力ディレクトリ作成
    mkdir -p "$OUTPUT_DIR"

    # 出力ファイル名生成
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local output_file="$OUTPUT_DIR/output-${timestamp}.md"
    local log_file="$OUTPUT_DIR/log-${timestamp}.txt"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would execute:"
        echo "  Task: $task"
        echo "  Context: $context_file"
        echo "  Output: $output_file"
        echo "  Log: $log_file"
        return 0
    fi

    # Claude Code実行
    # Note: 実際のClaude Code headless APIに合わせて調整が必要
    if [[ "$VERBOSE" == true ]]; then
        log_info "Command: claude code headless --task \"$task\""
    fi

    # 実行ログ
    {
        echo "=== Miyabi Headless Execution Log ==="
        echo "Timestamp: $(date -Iseconds)"
        echo "Task: $task"
        echo "Context File: $context_file"
        echo "Output File: $output_file"
        echo ""
        echo "=== Execution Start ==="
        echo ""
    } > "$log_file"

    # ここでClaude Code headless APIを呼び出す
    # 現時点では、コンテキストファイルを出力として保存
    {
        echo "# Miyabi Headless Execution Result"
        echo ""
        echo "**Task**: $task"
        echo "**Timestamp**: $(date -Iseconds)"
        echo ""
        echo "## Context Used"
        echo ""
        echo "Context file: \`$context_file\`"
        echo "Context size: $(wc -c < "$context_file") bytes"
        echo ""
        echo "## Execution Notes"
        echo ""
        echo "This is a placeholder output. Integrate with actual Claude Code headless API."
        echo ""
        echo "## Context Preview"
        echo ""
        echo '```'
        head -50 "$context_file"
        echo '```'
    } > "$output_file"

    log_success "Execution completed"
    log_info "Output: $output_file"
    log_info "Log: $log_file"

    echo "$output_file"
}

# 実行サマリー表示
show_summary() {
    local output_file="$1"

    echo ""
    echo -e "${CYAN}=== Execution Summary ===${NC}"
    echo ""
    echo -e "  ${GREEN}✓${NC} Task: $TASK"
    echo -e "  ${GREEN}✓${NC} Output: $output_file"
    echo ""

    if [[ -f "$output_file" ]]; then
        local size
        size=$(wc -c < "$output_file" | tr -d ' ')
        echo -e "  ${BLUE}ℹ${NC} Output size: $size bytes"
    fi

    echo ""
    echo -e "${CYAN}=========================${NC}"
    echo ""
}

# メイン処理
main() {
    # ヘッダー表示
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  ${GREEN}Miyabi Headless Execution${NC}${CYAN}         ║${NC}"
    echo -e "${CYAN}║  ${YELLOW}Version: 1.0.0${NC}${CYAN}                    ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
    echo ""

    # 引数パース
    parse_args "$@"

    # コンテキスト生成
    local context_file
    context_file=$(generate_context "$TASK")

    if [[ "$CONTEXT_ONLY" == true ]]; then
        log_success "Context-only mode: Context file generated"
        echo ""
        echo "Context file: $context_file"
        exit 0
    fi

    # ヘッドレスモード実行
    local output_file
    output_file=$(execute_headless "$TASK" "$context_file")

    # サマリー表示
    show_summary "$output_file"

    exit 0
}

main "$@"
