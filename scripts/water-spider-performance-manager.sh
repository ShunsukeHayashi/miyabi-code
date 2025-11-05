#!/bin/bash
# Water Spider - Performance Management Module
# Purpose: Strict performance monitoring, SLA enforcement, and KPI tracking

set -euo pipefail

WORKING_DIR="$(cd "$(dirname "$0")/.." && pwd)"
METRICS_FILE="${WORKING_DIR}/.ai/metrics/performance-metrics.json"
SLA_FILE="${WORKING_DIR}/.ai/metrics/sla-violations.log"
KPI_REPORT="${WORKING_DIR}/.ai/reports/kpi-dashboard.md"

# ディレクトリ作成
mkdir -p "$(dirname "$METRICS_FILE")"
mkdir -p "$(dirname "$SLA_FILE")"

# SLA定義
SLA_MAX_TASK_DURATION=3600      # 最大タスク時間: 60分
SLA_MAX_IDLE_TIME=300           # 最大アイドル時間: 5分
SLA_MIN_THROUGHPUT=10           # 最小スループット: 10タスク/日
SLA_MAX_ERROR_RATE=0.1          # 最大エラー率: 10%

# メトリクス初期化
init_metrics() {
    if [ ! -f "$METRICS_FILE" ]; then
        cat > "$METRICS_FILE" <<EOF
{
  "version": "1.0.0",
  "initialized_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agents": {}
}
EOF
    fi
}

# メトリクス記録
record_metric() {
    local agent="$1"
    local metric_type="$2"  # task_started, task_completed, task_failed, idle_start, idle_end
    local task_id="${3:-N/A}"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    init_metrics

    # メトリクス追加
    local temp_file=$(mktemp)
    jq --arg agent "$agent" \
       --arg type "$metric_type" \
       --arg task "$task_id" \
       --arg ts "$timestamp" \
       '.agents[$agent] //= {events: [], stats: {}} |
        .agents[$agent].events += [{
          type: $type,
          task_id: $task,
          timestamp: $ts
        }]' "$METRICS_FILE" > "$temp_file"
    mv "$temp_file" "$METRICS_FILE"

    echo "[$(date '+%H:%M:%S')] 📊 Metric recorded: $agent - $metric_type ($task_id)"
}

# パフォーマンス計算
calculate_performance() {
    local agent="$1"

    init_metrics

    local events=$(jq -r --arg agent "$agent" '.agents[$agent].events // []' "$METRICS_FILE")

    # タスク完了数
    local completed=$(echo "$events" | jq '[.[] | select(.type == "task_completed")] | length')

    # タスク失敗数
    local failed=$(echo "$events" | jq '[.[] | select(.type == "task_failed")] | length')

    # エラー率
    local total=$((completed + failed))
    local error_rate=0
    if [ "$total" -gt 0 ]; then
        error_rate=$(echo "scale=2; $failed / $total" | bc)
    fi

    # スループット（タスク/時間）
    local throughput=0
    if [ "$completed" -gt 0 ]; then
        local first_event=$(echo "$events" | jq -r '.[0].timestamp')
        local last_event=$(echo "$events" | jq -r '.[-1].timestamp')

        if [ "$first_event" != "null" ] && [ "$last_event" != "null" ]; then
            local start_ts=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$first_event" +%s 2>/dev/null || echo "0")
            local end_ts=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$last_event" +%s 2>/dev/null || echo "0")
            local duration=$((end_ts - start_ts))

            if [ "$duration" -gt 0 ]; then
                throughput=$(echo "scale=2; $completed * 3600 / $duration" | bc)
            fi
        fi
    fi

    # JSON形式で返す
    jq -n \
        --arg agent "$agent" \
        --argjson completed "$completed" \
        --argjson failed "$failed" \
        --argjson total "$total" \
        --arg error_rate "$error_rate" \
        --arg throughput "$throughput" \
        '{
            agent: $agent,
            completed: $completed,
            failed: $failed,
            total: $total,
            error_rate: $error_rate,
            throughput: $throughput
        }'
}

# SLA違反チェック
check_sla_violations() {
    local agent="$1"

    local perf=$(calculate_performance "$agent")

    local completed=$(echo "$perf" | jq -r '.completed')
    local error_rate=$(echo "$perf" | jq -r '.error_rate')
    local throughput=$(echo "$perf" | jq -r '.throughput')

    local violations=()

    # エラー率チェック
    if (( $(echo "$error_rate > $SLA_MAX_ERROR_RATE" | bc -l) )); then
        violations+=("ERROR_RATE_EXCEEDED: ${error_rate} > ${SLA_MAX_ERROR_RATE}")
    fi

    # スループットチェック（1日あたりに換算）
    local daily_throughput=$(echo "$throughput * 24" | bc)
    if (( $(echo "$daily_throughput < $SLA_MIN_THROUGHPUT" | bc -l) )); then
        violations+=("THROUGHPUT_TOO_LOW: ${daily_throughput} < ${SLA_MIN_THROUGHPUT}")
    fi

    # 違反があればログに記録
    if [ ${#violations[@]} -gt 0 ]; then
        for violation in "${violations[@]}"; do
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] SLA VIOLATION | $agent | $violation" >> "$SLA_FILE"
            echo "⚠️ SLA違反: $agent - $violation"
        done
        return 1
    else
        echo "✅ SLA遵守: $agent"
        return 0
    fi
}

# KPIダッシュボード生成
generate_kpi_dashboard() {
    init_metrics

    local agents=("カエデ" "サクラ" "ツバキ" "ボタン" "Codex-1" "Codex-2" "Codex-3" "Codex-4")

    cat > "$KPI_REPORT" <<EOF
# 🕷️ Water Spider - Performance KPI Dashboard

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**SLA Version**: 1.0.0

---

## 📊 Overall Performance Metrics

| Agent | Completed | Failed | Total | Error Rate | Throughput (tasks/h) | SLA Status |
|-------|-----------|--------|-------|------------|----------------------|------------|
EOF

    local total_completed=0
    local total_failed=0
    local total_violations=0

    for agent in "${agents[@]}"; do
        local perf=$(calculate_performance "$agent")

        local completed=$(echo "$perf" | jq -r '.completed')
        local failed=$(echo "$perf" | jq -r '.failed')
        local total=$(echo "$perf" | jq -r '.total')
        local error_rate=$(echo "$perf" | jq -r '.error_rate')
        local throughput=$(echo "$perf" | jq -r '.throughput')

        total_completed=$((total_completed + completed))
        total_failed=$((total_failed + failed))

        # SLAチェック
        local sla_status="✅ OK"
        if ! check_sla_violations "$agent" 2>/dev/null; then
            sla_status="❌ VIOLATED"
            total_violations=$((total_violations + 1))
        fi

        echo "| $agent | $completed | $failed | $total | ${error_rate} | ${throughput} | $sla_status |" >> "$KPI_REPORT"
    done

    cat >> "$KPI_REPORT" <<EOF

---

## 🎯 SLA Compliance

- **Total Agents**: ${#agents[@]}
- **SLA Compliant**: $((${#agents[@]} - total_violations))
- **SLA Violations**: $total_violations
- **Compliance Rate**: $(echo "scale=2; ($((${#agents[@]} - total_violations)) * 100) / ${#agents[@]}" | bc)%

---

## 📈 System-Wide Metrics

- **Total Tasks Completed**: $total_completed
- **Total Tasks Failed**: $total_failed
- **Overall Error Rate**: $(echo "scale=4; $total_failed / ($total_completed + $total_failed)" | bc 2>/dev/null || echo "0")

---

## ⚖️ SLA Thresholds

| Metric | Threshold | Status |
|--------|-----------|--------|
| Max Task Duration | ${SLA_MAX_TASK_DURATION}s (60min) | $([ "$total_violations" -eq 0 ] && echo "✅ OK" || echo "⚠️ Check individual") |
| Max Idle Time | ${SLA_MAX_IDLE_TIME}s (5min) | $([ "$total_violations" -eq 0 ] && echo "✅ OK" || echo "⚠️ Check individual") |
| Min Throughput | ${SLA_MIN_THROUGHPUT} tasks/day | $([ "$total_violations" -eq 0 ] && echo "✅ OK" || echo "⚠️ Check individual") |
| Max Error Rate | ${SLA_MAX_ERROR_RATE} (10%) | $([ "$total_violations" -eq 0 ] && echo "✅ OK" || echo "⚠️ Check individual") |

---

## 🚨 Recent SLA Violations

EOF

    if [ -f "$SLA_FILE" ]; then
        tail -10 "$SLA_FILE" >> "$KPI_REPORT" || echo "No recent violations" >> "$KPI_REPORT"
    else
        echo "No violations recorded" >> "$KPI_REPORT"
    fi

    echo ""
    echo "📄 KPIダッシュボード生成完了: $KPI_REPORT"
}

# メイン実行
case "${1:-help}" in
    record)
        if [ $# -lt 3 ]; then
            echo "Usage: $0 record <agent> <metric_type> [task_id]"
            exit 1
        fi
        record_metric "$2" "$3" "${4:-N/A}"
        ;;
    perf)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 perf <agent>"
            exit 1
        fi
        calculate_performance "$2"
        ;;
    sla)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 sla <agent>"
            exit 1
        fi
        check_sla_violations "$2"
        ;;
    dashboard)
        generate_kpi_dashboard
        ;;
    report)
        if [ -f "$KPI_REPORT" ]; then
            cat "$KPI_REPORT"
        else
            echo "⚠️ KPIレポートが存在しません。'$0 dashboard' を実行してください。"
        fi
        ;;
    *)
        echo "Water Spider Performance Manager"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  record <agent> <type> [task_id]  - メトリクス記録"
        echo "  perf <agent>                      - パフォーマンス計算"
        echo "  sla <agent>                       - SLA違反チェック"
        echo "  dashboard                         - KPIダッシュボード生成"
        echo "  report                            - 最新レポート表示"
        echo ""
        echo "Metric Types:"
        echo "  task_started, task_completed, task_failed, idle_start, idle_end"
        exit 1
        ;;
esac
