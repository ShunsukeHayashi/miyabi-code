#!/bin/bash
# Progress Collector - リアルタイム進捗収集システム
# 全バックグラウンドタスクの進捗を収集しWebUIに反映

set -e

PROJECT_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
PROGRESS_DB="${PROJECT_ROOT}/.claude/progress"
PROJECTS_DB="${PROJECT_ROOT}/.claude/projects"
LOGS_DIR="${PROJECT_ROOT}/.claude/logs"

# ディレクトリ作成
mkdir -p "$PROGRESS_DB"
mkdir -p "$PROJECTS_DB"

# ===================================================================
# プロジェクト検出
# ===================================================================

detect_projects() {
    echo "🔍 Detecting active projects..."

    # 既存プロジェクトをスキャン
    local projects=()

    # CDK infrastructure projects
    if [[ -d "${PROJECT_ROOT}/infrastructure/aws-cdk" ]]; then
        projects+=("miyabi-webui")
    fi

    # Mobile projects
    if [[ -d "${PROJECT_ROOT}/mobile" ]]; then
        projects+=("miyabi-mobile")
    fi

    # API projects
    if [[ -d "${PROJECT_ROOT}/api" ]]; then
        projects+=("miyabi-api")
    fi

    # 各プロジェクトのメタデータを作成
    for project in "${projects[@]}"; do
        local project_file="${PROJECTS_DB}/${project}.json"

        if [[ ! -f "$project_file" ]]; then
            cat > "$project_file" <<EOF
{
  "project_id": "$project",
  "project_name": "$(echo $project | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')",
  "status": "active",
  "created_at": "$(date -Iseconds)",
  "owner": "orchestrator",
  "tasks": [],
  "metrics": {
    "total_tasks": 0,
    "completed_tasks": 0,
    "failed_tasks": 0,
    "success_rate": 0.0
  }
}
EOF
            echo "  ✅ Created project: $project"
        fi
    done
}

# ===================================================================
# バックグラウンドタスク検出
# ===================================================================

detect_background_tasks() {
    echo "🔍 Detecting background tasks..."

    local tasks=()

    # ps コマンドでバックグラウンドプロセスを検出
    # CDK deploy
    if ps aux | grep -q "[c]dk deploy"; then
        tasks+=("cdk-deploy")
    fi

    # npm start (WebUI server)
    if ps aux | grep -q "[n]pm start"; then
        tasks+=("webui-server")
    fi

    # Agent executions
    if ps aux | grep -q "[u]iux-agent"; then
        tasks+=("uiux-agent")
    fi

    if ps aux | grep -q "[s]ecurity-agent"; then
        tasks+=("security-agent")
    fi

    # Issue batch creation
    if ps aux | grep -q "[b]atch-create-issues"; then
        tasks+=("batch-create-issues")
    fi

    echo "  Found ${#tasks[@]} background tasks"

    for task in "${tasks[@]}"; do
        echo "  - $task"
    done
}

# ===================================================================
# 進捗抽出
# ===================================================================

extract_progress_from_cdk_log() {
    local log_file="$1"

    if [[ ! -f "$log_file" ]]; then
        echo "0/0 (0%)"
        return
    fi

    # CloudFormation progress: "X/Y | CREATE_IN_PROGRESS"
    local progress_line=$(grep -o "[0-9]\+/[0-9]\+ |" "$log_file" | tail -1)

    if [[ -n "$progress_line" ]]; then
        local current=$(echo "$progress_line" | cut -d'/' -f1)
        local total=$(echo "$progress_line" | cut -d'/' -f2 | cut -d' ' -f1)
        local percentage=$((current * 100 / total))
        echo "${current}/${total} (${percentage}%)"
    else
        echo "0/0 (0%)"
    fi
}

extract_status_from_log() {
    local log_file="$1"

    if [[ ! -f "$log_file" ]]; then
        echo "pending"
        return
    fi

    # Check for completion
    if grep -q "CREATE_COMPLETE\|✅\|success" "$log_file"; then
        echo "completed"
    elif grep -q "FAILED\|ERROR\|❌" "$log_file"; then
        echo "failed"
    elif grep -q "IN_PROGRESS\|Running\|⏳" "$log_file"; then
        echo "running"
    else
        echo "pending"
    fi
}

extract_current_phase() {
    local log_file="$1"

    if [[ ! -f "$log_file" ]]; then
        echo "Unknown"
        return
    fi

    # Last significant line
    local phase=$(grep "CREATE_IN_PROGRESS\|Deploying\|Building" "$log_file" | tail -1 | awk '{print $6, $7, $8}')

    if [[ -n "$phase" ]]; then
        echo "$phase"
    else
        echo "Initializing"
    fi
}

# ===================================================================
# 進捗レコード作成
# ===================================================================

create_progress_record() {
    local task_type="$1"
    local log_file="$2"
    local project_id="$3"

    local task_id="task-${task_type}-$(date +%s)"
    local timestamp=$(date -Iseconds)

    # 進捗情報抽出
    local progress_info=$(extract_progress_from_cdk_log "$log_file")
    local status=$(extract_status_from_log "$log_file")
    local phase=$(extract_current_phase "$log_file")

    # 進捗パーセンテージを計算
    local current=$(echo "$progress_info" | cut -d'/' -f1)
    local total=$(echo "$progress_info" | cut -d'/' -f2 | cut -d' ' -f1)

    if [[ "$total" -gt 0 ]]; then
        local percentage=$((current * 100 / total))
    else
        local percentage=0
    fi

    # 進捗レコードJSON作成
    cat > "${PROGRESS_DB}/${task_id}.json" <<EOF
{
  "progress_id": "${task_id}",
  "task_id": "${task_id}",
  "task_type": "${task_type}",
  "status": "${status}",
  "progress": {
    "current": ${current},
    "total": ${total},
    "percentage": ${percentage}
  },
  "updated_at": "${timestamp}",
  "details": {
    "phase": "${phase}",
    "log_file": "${log_file}"
  },
  "metadata": {
    "project_id": "${project_id}",
    "agent": "orchestrator"
  }
}
EOF

    echo "  📝 Progress recorded: ${task_id} (${percentage}%)"
}

# ===================================================================
# 全進捗を収集
# ===================================================================

collect_all_progress() {
    echo "================================"
    echo "📊 Progress Collection Started"
    echo "================================"
    echo ""

    # プロジェクト検出
    detect_projects
    echo ""

    # バックグラウンドタスク検出
    detect_background_tasks
    echo ""

    # 各タスクの進捗を収集
    echo "📈 Collecting progress from logs..."

    # CDK Deploy
    for log in "$LOGS_DIR"/cdk-*.log; do
        if [[ -f "$log" ]]; then
            create_progress_record "cdk_deploy" "$log" "miyabi-webui"
        fi
    done

    # Agent executions
    for log in "$LOGS_DIR"/*-agent-*.log; do
        if [[ -f "$log" ]]; then
            local agent_type=$(basename "$log" | cut -d'-' -f1)
            create_progress_record "agent_execution" "$log" "miyabi-webui"
        fi
    done

    # WebUI server
    if ps aux | grep -q "[n]pm start"; then
        cat > "${PROGRESS_DB}/task-webui-server.json" <<EOF
{
  "progress_id": "task-webui-server",
  "task_id": "task-webui-server",
  "task_type": "webui_server",
  "status": "running",
  "progress": {
    "current": 1,
    "total": 1,
    "percentage": 100
  },
  "updated_at": "$(date -Iseconds)",
  "details": {
    "phase": "Server Running",
    "url": "http://localhost:3000"
  },
  "metadata": {
    "project_id": "miyabi-webui",
    "agent": "orchestrator"
  }
}
EOF
        echo "  📝 Progress recorded: task-webui-server (100%)"
    fi

    echo ""
    echo "================================"
    echo "✅ Progress Collection Complete"
    echo "================================"
}

# ===================================================================
# 集約レポート生成
# ===================================================================

generate_summary_report() {
    echo ""
    echo "📊 Progress Summary Report"
    echo "================================"

    local total_tasks=$(find "$PROGRESS_DB" -name "*.json" | wc -l | xargs)
    local completed_tasks=$(find "$PROGRESS_DB" -name "*.json" -exec jq -r 'select(.status=="completed") | .task_id' {} \; | wc -l | xargs)
    local running_tasks=$(find "$PROGRESS_DB" -name "*.json" -exec jq -r 'select(.status=="running") | .task_id' {} \; | wc -l | xargs)
    local failed_tasks=$(find "$PROGRESS_DB" -name "*.json" -exec jq -r 'select(.status=="failed") | .task_id' {} \; | wc -l | xargs)

    echo "Total Tasks:     $total_tasks"
    echo "Completed:       $completed_tasks"
    echo "Running:         $running_tasks"
    echo "Failed:          $failed_tasks"
    echo ""

    # プロジェクトごとの集計
    echo "📦 Projects:"
    for project_file in "$PROJECTS_DB"/*.json; do
        if [[ -f "$project_file" ]]; then
            local project_id=$(jq -r '.project_id' "$project_file")
            local project_name=$(jq -r '.project_name' "$project_file")
            echo "  - $project_name ($project_id)"
        fi
    done

    echo ""
    echo "✅ Report generated: $(date)"
}

# ===================================================================
# メイン実行
# ===================================================================

main() {
    collect_all_progress
    generate_summary_report

    # WebUI用の集約JSONを生成
    cat > "${PROJECT_ROOT}/web-ui/public/progress-data.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "projects": $(ls -1 "$PROJECTS_DB"/*.json | xargs cat | jq -s .),
  "tasks": $(ls -1 "$PROGRESS_DB"/*.json | xargs cat | jq -s . 2>/dev/null || echo "[]")
}
EOF

    echo "📁 WebUI data updated: web-ui/public/progress-data.json"
}

# 実行
main "$@"
