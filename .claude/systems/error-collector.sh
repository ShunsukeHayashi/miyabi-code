#!/bin/bash
# Miyabi Error Collector - Θ6 (Learn) Process
# エラー自動収集・分析・学習システム

set -e

PROJECT_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
ERROR_DB="${PROJECT_ROOT}/.claude/knowledge-base/errors"
KB_DB="${PROJECT_ROOT}/.claude/knowledge-base/solutions"

# ディレクトリ作成
mkdir -p "$ERROR_DB"/{deployment,agent,api,build,other}
mkdir -p "$KB_DB"/verified
mkdir -p "${PROJECT_ROOT}/.claude/knowledge-base/patterns"

# ===================================================================
# エラー検出関数
# ===================================================================

detect_errors_from_log() {
    local log_file="$1"
    local category="$2"

    if [[ ! -f "$log_file" ]]; then
        return 0
    fi

    # エラーパターン検出
    if grep -qi "error\|failed\|fatal\|exception" "$log_file"; then
        local error_id="error-$(date +%Y%m%d%H%M%S)-$(uuidgen | cut -d'-' -f1)"

        # エラーレコード作成
        cat > "${ERROR_DB}/${category}/${error_id}.json" <<EOF
{
  "error_id": "$error_id",
  "timestamp": "$(date -Iseconds)",
  "category": "$category",
  "severity": "$(classify_severity "$log_file")",
  "context": {
    "log_file": "$log_file",
    "operation": "$(basename $log_file .log)"
  },
  "error_details": {
    "message": "$(extract_error_message "$log_file")",
    "log_excerpt": "$(tail -20 "$log_file" | jq -Rs .)"
  },
  "status": "new",
  "first_occurrence": "$(date -Iseconds)"
}
EOF

        echo "📝 Error recorded: $error_id"
        return 1
    fi

    return 0
}

classify_severity() {
    local log_file="$1"

    if grep -qi "fatal\|critical\|p0" "$log_file"; then
        echo "P0"
    elif grep -qi "error\|failed" "$log_file"; then
        echo "P1"
    else
        echo "P2"
    fi
}

extract_error_message() {
    local log_file="$1"

    # 最初のエラーメッセージを抽出
    grep -i "error\|failed" "$log_file" | head -1 | sed 's/^[^:]*: //'
}

# ===================================================================
# エラー分析関数
# ===================================================================

analyze_error() {
    local error_file="$1"
    local error_id=$(basename "$error_file" .json)

    echo "🔍 Analyzing error: $error_id"

    # エラー内容読み込み
    local error_message=$(jq -r '.error_details.message' "$error_file")

    # 既知のパターンマッチング
    local pattern_match=$(match_known_pattern "$error_message")

    if [[ -n "$pattern_match" ]]; then
        echo "✅ Known pattern matched: $pattern_match"
        # 既知の解決策を適用
        apply_known_solution "$error_file" "$pattern_match"
    else
        echo "🆕 New error pattern - Creating KB entry"
        # 新しいKBエントリー作成
        create_kb_entry "$error_file"
    fi
}

match_known_pattern() {
    local error_message="$1"

    # パターン1: CDK Bootstrap Required
    if echo "$error_message" | grep -q "SSM parameter.*cdk-bootstrap.*not found"; then
        echo "cdk-bootstrap-required"
        return 0
    fi

    # パターン2: Wrong Directory
    if echo "$error_message" | grep -q "Cannot find asset\|No such file or directory"; then
        echo "wrong-directory"
        return 0
    fi

    # パターン3: Permission Denied
    if echo "$error_message" | grep -q "permission denied\|EACCES"; then
        echo "permission-denied"
        return 0
    fi

    # パターン4: Parse Error (Shell)
    if echo "$error_message" | grep -q "parse error"; then
        echo "shell-parse-error"
        return 0
    fi

    return 1
}

apply_known_solution() {
    local error_file="$1"
    local pattern="$2"

    local solution_file="${KB_DB}/verified/${pattern}.json"

    if [[ -f "$solution_file" ]]; then
        local auto_fix=$(jq -r '.solution.auto_fix' "$solution_file")

        if [[ "$auto_fix" == "true" ]]; then
            echo "🤖 Attempting auto-fix..."
            execute_auto_fix "$solution_file"
        else
            echo "⚠️  Manual fix required"
            display_solution "$solution_file")
        fi

        # ステータス更新
        jq '.status = "analyzed" | .related_kb = ["'"$pattern"'"]' "$error_file" > "$error_file.tmp"
        mv "$error_file.tmp" "$error_file"
    fi
}

execute_auto_fix() {
    local solution_file="$1"

    # 修正コマンド取得
    local fix_commands=$(jq -r '.solution.steps[]' "$solution_file")

    echo "$fix_commands" | while read -r command; do
        echo "  Executing: $command"
        eval "$command" || echo "  ⚠️  Failed: $command"
    done
}

display_solution() {
    local solution_file="$1"

    echo "==============================================="
    echo "💡 Solution Found"
    echo "==============================================="
    jq -r '.solution.fix_steps[]' "$solution_file" | while read -r step; do
        echo "  - $step"
    done
    echo "==============================================="
}

create_kb_entry() {
    local error_file="$1"
    local kb_id="kb-$(date +%Y%m%d%H%M%S)"

    local error_message=$(jq -r '.error_details.message' "$error_file")
    local category=$(jq -r '.category' "$error_file")

    cat > "${KB_DB}/new/${kb_id}.json" <<EOF
{
  "kb_id": "$kb_id",
  "title": "New Error Pattern",
  "category": "$category",
  "problem": {
    "description": "$error_message",
    "occurrences": 1,
    "first_seen": "$(date -Iseconds)"
  },
  "solution": {
    "root_cause": "To be analyzed",
    "fix_steps": [],
    "auto_fix": false
  },
  "status": "pending_analysis",
  "source_error": "$(jq -r '.error_id' "$error_file")"
}
EOF

    echo "📚 KB entry created: $kb_id"
    echo "   Requires AI analysis or manual input"
}

# ===================================================================
# メイン実行
# ===================================================================

main() {
    echo "================================"
    echo "🧠 Miyabi Error Collector"
    echo "================================"

    # 全ログファイルをスキャン
    echo ""
    echo "🔍 Scanning logs..."

    local logs_dir="${PROJECT_ROOT}/.claude/logs"

    # Deployment errors
    for log in "$logs_dir"/cdk-*.log; do
        [[ -f "$log" ]] && detect_errors_from_log "$log" "deployment"
    done

    # Agent errors
    for log in "$logs_dir"/*-agent-*.log; do
        [[ -f "$log" ]] && detect_errors_from_log "$log" "agent"
    done

    # Build errors
    for log in "$logs_dir"/build-*.log; do
        [[ -f "$log" ]] && detect_errors_from_log "$log" "build"
    done

    # 新規エラーを分析
    echo ""
    echo "📊 Analyzing new errors..."

    for error_file in "$ERROR_DB"/*/*.json; do
        if [[ -f "$error_file" ]]; then
            local status=$(jq -r '.status' "$error_file")
            if [[ "$status" == "new" ]]; then
                analyze_error "$error_file"
            fi
        fi
    done

    # サマリー表示
    echo ""
    echo "================================"
    echo "📈 Error Learning Summary"
    echo "================================"

    local total_errors=$(find "$ERROR_DB" -name "*.json" | wc -l | xargs)
    local new_errors=$(find "$ERROR_DB" -name "*.json" -exec jq -r 'select(.status=="new") | .error_id' {} \; | wc -l | xargs)
    local analyzed=$(find "$ERROR_DB" -name "*.json" -exec jq -r 'select(.status=="analyzed") | .error_id' {} \; | wc -l | xargs)

    echo "Total Errors:    $total_errors"
    echo "New:             $new_errors"
    echo "Analyzed:        $analyzed"
    echo ""
    echo "✅ Error collection complete"
}

# 実行
main "$@"
