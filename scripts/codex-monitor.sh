#!/bin/bash
# Codex Agent Monitor & Evaluator
# Purpose: Monitor Codex agents, detect stalls, and evaluate performance

set -euo pipefail

WORKING_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="${WORKING_DIR}/.ai/logs/codex-monitor.log"
REPORT_FILE="${WORKING_DIR}/.ai/reports/codex-evaluation.md"

# ログ出力
log_monitor() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Codexペインの状態をチェック
check_codex_pane() {
    local pane_index="$1"
    local pane_id="$2"
    local agent_name="$3"

    # 最後の30行を取得
    local output=$(tmux capture-pane -t "Miyabi:1.${pane_index}" -p | tail -30)

    # 停滞パターンの検出
    local is_stalled=false
    local stall_reason=""

    # パターン1: Leavening... が長時間表示
    if echo "$output" | grep -q "Leavening…"; then
        is_stalled=true
        stall_reason="Leavening状態で停滞（プロンプト待機）"
    fi

    # パターン2: エラーメッセージ
    if echo "$output" | grep -qi "error\|failed\|timeout"; then
        is_stalled=true
        stall_reason="エラー発生: $(echo "$output" | grep -i "error\|failed\|timeout" | tail -1)"
    fi

    # パターン3: hook error
    if echo "$output" | grep -q "hook error"; then
        is_stalled=true
        stall_reason="Hook エラー発生"
    fi

    # パターン4: 入力待ち状態
    if echo "$output" | grep -q "ctrl-g to edit prompt"; then
        is_stalled=true
        stall_reason="プロンプト編集待機状態"
    fi

    # パターン5: 何も表示されていない
    if [ -z "$(echo "$output" | tr -d '[:space:]')" ]; then
        is_stalled=true
        stall_reason="出力なし（起動していない可能性）"
    fi

    # 結果を報告
    if [ "$is_stalled" = true ]; then
        log_monitor "⚠️  ${agent_name} (${pane_id}): 停滞検出 - ${stall_reason}"
        echo "STALLED|${stall_reason}"
    else
        log_monitor "✅ ${agent_name} (${pane_id}): 正常動作"
        echo "RUNNING|正常動作中"
    fi
}

# Codex performance evaluation
evaluate_codex_performance() {
    local agent_name="$1"
    local pane_index="$2"
    local status="$3"

    # キャプチャした出力から評価
    local output=$(tmux capture-pane -t "Miyabi:1.${pane_index}" -p -S -100 2>/dev/null || echo "")

    local tool_uses=$(echo "$output" | grep -c "⏺" 2>/dev/null || echo "0")
    local completed_tasks=$(echo "$output" | grep -c "✅" 2>/dev/null || echo "0")
    local errors=$(echo "$output" | grep -c -i "error" 2>/dev/null || echo "0")

    # 数値に変換（改行削除）
    tool_uses=$(echo "$tool_uses" | tr -d '\n' | tr -d ' ')
    completed_tasks=$(echo "$completed_tasks" | tr -d '\n' | tr -d ' ')
    errors=$(echo "$errors" | tr -d '\n' | tr -d ' ')

    # デフォルト値設定
    : ${tool_uses:=0}
    : ${completed_tasks:=0}
    : ${errors:=0}

    local score=0

    # スコアリング
    if [ "$status" = "RUNNING" ]; then
        score=$((score + 50))
    fi

    # ツール使用数に応じて加点
    if [ "$tool_uses" -gt 0 ] 2>/dev/null; then
        score=$((score + tool_uses * 5))
    fi

    # タスク完了に応じて大幅加点
    if [ "$completed_tasks" -gt 0 ] 2>/dev/null; then
        score=$((score + completed_tasks * 20))
    fi

    # エラーに応じて減点
    if [ "$errors" -gt 0 ] 2>/dev/null; then
        score=$((score - errors * 10))
    fi

    # 最低0点
    if [ "$score" -lt 0 ]; then
        score=0
    fi

    echo "${score}"
}

# メイン監視ループ
monitor_all_codex() {
    log_monitor "🔍 Codex Agent 監視開始"

    # Codex agent definitions
    declare -a CODEX_AGENTS=(
        "4|%7|Codex-1"
        "5|%8|Codex-2"
        "6|%9|Codex-3"
        "7|%10|Codex-4"
    )

    local total_score=0
    local stalled_count=0

    for agent_def in "${CODEX_AGENTS[@]}"; do
        IFS='|' read -r index pane_id name <<< "$agent_def"

        # 状態チェック
        local check_result=$(check_codex_pane "$index" "$pane_id" "$name")
        local status=$(echo "$check_result" | cut -d'|' -f1)
        local reason=$(echo "$check_result" | cut -d'|' -f2)

        # パフォーマンス評価
        local score=$(evaluate_codex_performance "$name" "$index" "$status")
        total_score=$((total_score + score))

        if [ "$status" = "STALLED" ]; then
            stalled_count=$((stalled_count + 1))

            # 自動復旧を試みる
            log_monitor "🔧 ${name} 自動復旧を試行..."
            tmux send-keys -t "Miyabi:1.${index}" C-c
            sleep 0.5
            tmux send-keys -t "Miyabi:1.${index}" "/clear" Enter
            sleep 0.5
            tmux send-keys -t "Miyabi:1.${index}" "codex" Enter

            # ペインUI更新
            "$WORKING_DIR/scripts/orchestra-set-pane-ui.sh" update "$name" "復旧中..." "stopped" 2>/dev/null || true
        else
            log_monitor "📊 ${name} スコア: ${score}点"
        fi
    done

    # 総合評価
    local avg_score=$((total_score / 4))
    log_monitor "📈 総合評価: ${avg_score}点/100 (停滞: ${stalled_count}/4)"

    # レポート生成
    generate_evaluation_report "$avg_score" "$stalled_count"
}

# 評価レポート生成
generate_evaluation_report() {
    local avg_score="$1"
    local stalled_count="$2"

    local grade="F"
    if [ "$avg_score" -ge 80 ]; then
        grade="A"
    elif [ "$avg_score" -ge 60 ]; then
        grade="B"
    elif [ "$avg_score" -ge 40 ]; then
        grade="C"
    elif [ "$avg_score" -ge 20 ]; then
        grade="D"
    fi

    cat > "$REPORT_FILE" <<EOF
# Codex Agent Evaluation Report

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**Version**: 1.0.0

---

## 📊 Overall Performance

- **Average Score**: ${avg_score}/100 (Grade: ${grade})
- **Stalled Agents**: ${stalled_count}/4
- **Active Agents**: $((4 - stalled_count))/4

## 🎯 Performance Grade

| Grade | Score Range | Status |
|-------|-------------|--------|
| A     | 80-100      | ${grade:+${grade}${grade/A/ ✅}} |
| B     | 60-79       | ${grade:+${grade}${grade/B/ ✅}} |
| C     | 40-59       | ${grade:+${grade}${grade/C/ ⚠️}} |
| D     | 20-39       | ${grade:+${grade}${grade/D/ ❌}} |
| F     | 0-19        | ${grade:+${grade}${grade/F/ ❌}} |

## 🔍 Detected Issues

EOF

    # ログから最近の停滞を抽出
    tail -20 "$LOG_FILE" | grep "⚠️" >> "$REPORT_FILE" || echo "No recent issues detected." >> "$REPORT_FILE"

    cat >> "$REPORT_FILE" <<EOF

---

## 💡 Recommendations

EOF

    if [ "$stalled_count" -gt 2 ]; then
        echo "- ❌ **CRITICAL**: 半数以上のCodexエージェントが停滞中。即座に調査が必要です。" >> "$REPORT_FILE"
    elif [ "$stalled_count" -gt 0 ]; then
        echo "- ⚠️ **WARNING**: 一部のCodexエージェントが停滞中。監視を継続してください。" >> "$REPORT_FILE"
    else
        echo "- ✅ **GOOD**: すべてのCodexエージェントが正常動作中です。" >> "$REPORT_FILE"
    fi

    if [ "$avg_score" -lt 40 ]; then
        echo "- プロンプトの最適化を検討してください。" >> "$REPORT_FILE"
        echo "- タスク割り当てロジックを見直してください。" >> "$REPORT_FILE"
    fi

    log_monitor "📄 評価レポート生成: $REPORT_FILE"
}

# 単発実行
case "${1:-monitor}" in
    monitor)
        monitor_all_codex
        ;;
    watch)
        # 継続監視モード（30秒ごと）
        while true; do
            monitor_all_codex
            echo ""
            sleep 30
        done
        ;;
    report)
        # レポートのみ表示
        if [ -f "$REPORT_FILE" ]; then
            cat "$REPORT_FILE"
        else
            echo "⚠️ レポートが見つかりません。先に monitor を実行してください。"
        fi
        ;;
    *)
        echo "Usage: $0 [monitor|watch|report]"
        echo ""
        echo "  monitor - 単発監視実行"
        echo "  watch   - 継続監視モード（30秒ごと）"
        echo "  report  - 最新レポート表示"
        exit 1
        ;;
esac
