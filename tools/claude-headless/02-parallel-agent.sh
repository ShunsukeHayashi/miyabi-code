#!/bin/bash
# Miyabi Headless Mode: 並列 Agent 実行
# Usage: ./02-parallel-agent.sh <issue1> <issue2> <issue3> ...

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/tmp/miyabi-headless"
mkdir -p "$LOG_DIR"

# カラー出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 引数チェック
if [ $# -eq 0 ]; then
    echo "Usage: $0 <issue1> <issue2> <issue3> ..."
    echo "Example: $0 270 271 272"
    exit 1
fi

ISSUES=("$@")

log_info "=========================================="
log_info "Miyabi Parallel Headless Agent"
log_info "=========================================="
log_info "並列実行 Issue 数: ${#ISSUES[@]}"
log_info "Issues: ${ISSUES[*]}"
log_info "時刻: $(date '+%Y-%m-%d %H:%M:%S')"
log_info ""

# 並列実行
PIDS=()
for issue in "${ISSUES[@]}"; do
    log_info "Issue #$issue を Headless Mode で実行開始..."
    "$SCRIPT_DIR/01-process-issue.sh" "$issue" > "$LOG_DIR/parallel-$issue.log" 2>&1 &
    PIDS+=($!)
done

log_info ""
log_info "全 ${#PIDS[@]} 個の Agent が並列実行中..."
log_info "プロセスID: ${PIDS[*]}"
log_info ""

# 全プロセスの完了を待機
SUCCESS_COUNT=0
FAIL_COUNT=0

for i in "${!PIDS[@]}"; do
    pid=${PIDS[$i]}
    issue=${ISSUES[$i]}

    if wait "$pid"; then
        log_success "Issue #$issue 完了 (PID: $pid)"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "\033[0;31m[ERROR]\033[0m Issue #$issue 失敗 (PID: $pid)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

log_info ""
log_success "=========================================="
log_success "並列実行完了"
log_success "=========================================="
log_info "成功: $SUCCESS_COUNT"
log_info "失敗: $FAIL_COUNT"
log_info "合計: ${#ISSUES[@]}"
log_info ""

# レポート一覧表示
log_info "生成されたレポート:"
for issue in "${ISSUES[@]}"; do
    if [ -f "$LOG_DIR/report-$issue.md" ]; then
        echo "  - $LOG_DIR/report-$issue.md"
    fi
done

exit $([ $FAIL_COUNT -eq 0 ] && echo 0 || echo 1)
