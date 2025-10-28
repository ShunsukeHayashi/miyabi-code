#!/usr/bin/env bash
# ==============================================================================
# /codex - Codex X バックグラウンド実行
# ==============================================================================
# Version: 1.0.0
# Purpose: Run Codex X (GPT-5 Codex / o3) in background
# ==============================================================================

set -euo pipefail

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 設定
CODEX_SESSION_DIR="${CODEX_SESSION_DIR:-/tmp/codex-sessions}"
CODEX_LOG_DIR="${CODEX_LOG_DIR:-.ai/logs/codex}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5-codex}"
CODEX_SANDBOX="${CODEX_SANDBOX:-workspace-write}"
CODEX_APPROVAL="${CODEX_APPROVAL:-on-failure}"

# ディレクトリ作成
mkdir -p "$CODEX_SESSION_DIR" "$CODEX_LOG_DIR"

# 使用方法表示
usage() {
    cat <<EOF
${BOLD}Codex X - バックグラウンド実行${NC}

${CYAN}Usage:${NC}
  /codex <instruction>              Execute Codex X in background
  /codex --model <model> <inst>     Specify model (o3, gpt-5-codex)
  /codex --sandbox <mode> <inst>    Specify sandbox mode
  /codex sessions                   List active Codex X sessions
  /codex status <session-id>        Show session status
  /codex result <session-id>        Show full output
  /codex kill <session-id>          Kill session

${CYAN}Examples:${NC}
  /codex "Refactor miyabi-orchestrator to use async/await"
  /codex --model o3 "Optimize database queries"
  /codex --sandbox read-only "Analyze security vulnerabilities"

${CYAN}Sandbox Modes:${NC}
  read-only             - 読み取り専用（安全）
  workspace-write       - ワークスペース書き込み可能（デフォルト）
  danger-full-access    - フルアクセス（危険）

${CYAN}Models:${NC}
  gpt-5-codex          - GPT-5 Codex（デフォルト）
  o3                   - o3モデル（高品質、遅い）
EOF
}

# セッションID生成
generate_session_id() {
    echo "codex-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 3)"
}

# Codex X実行
exec_codex() {
    local instruction="$*"

    if [[ -z "$instruction" ]]; then
        echo -e "${RED}❌ Error: Instruction required${NC}"
        echo ""
        usage
        exit 1
    fi

    local session_id
    session_id=$(generate_session_id)

    local log_file="$CODEX_LOG_DIR/${session_id}.log"
    local status_file="$CODEX_SESSION_DIR/${session_id}.status"
    local pid_file="$CODEX_SESSION_DIR/${session_id}.pid"

    echo -e "${CYAN}🚀 Starting Codex X in background${NC}"
    echo -e "${PURPLE}📝 Session ID:${NC} ${BOLD}$session_id${NC}"
    echo -e "${BLUE}📄 Instruction:${NC} $instruction"
    echo -e "${YELLOW}🤖 Model:${NC} $CODEX_MODEL"
    echo -e "${YELLOW}🔒 Sandbox:${NC} $CODEX_SANDBOX"
    echo -e "${YELLOW}📋 Log file:${NC} $log_file"
    echo ""

    # ステータス初期化
    cat > "$status_file" <<EOF
{
  "session_id": "$session_id",
  "instruction": "$instruction",
  "model": "$CODEX_MODEL",
  "sandbox": "$CODEX_SANDBOX",
  "status": "running",
  "start_time": "$(date -Iseconds)",
  "end_time": null,
  "exit_code": null
}
EOF

    # Codex X実行（バックグラウンド）
    (
        local start_time
        start_time=$(date +%s)

        # ログヘッダー
        {
            echo "=== Codex X Session Log ==="
            echo "Session ID: $session_id"
            echo "Model: $CODEX_MODEL"
            echo "Sandbox: $CODEX_SANDBOX"
            echo "Started at: $(date)"
            echo "Instruction: $instruction"
            echo "================================="
            echo ""
        } > "$log_file"

        # Codex X実行
        codex exec \
            --model "$CODEX_MODEL" \
            --sandbox "$CODEX_SANDBOX" \
            --ask-for-approval "$CODEX_APPROVAL" \
            "$instruction" >> "$log_file" 2>&1

        local exit_code=$?
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))

        # ログフッター
        {
            echo ""
            echo "================================="
            echo "Session ended at: $(date)"
            echo "Exit code: $exit_code"
            echo "Duration: ${duration}s"
        } >> "$log_file"

        # ステータス更新
        if command -v jq &> /dev/null; then
            jq --arg status "$([ $exit_code -eq 0 ] && echo 'completed' || echo 'failed')" \
               --arg end_time "$(date -Iseconds)" \
               --argjson exit_code "$exit_code" \
               --argjson duration "$duration" \
               '.status = $status | .end_time = $end_time | .exit_code = $exit_code | .duration = $duration' \
               "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
        fi

        # PIDファイル削除
        rm -f "$pid_file"

        # 完了通知（macOS Notification）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if [ $exit_code -eq 0 ]; then
                osascript -e "display notification \"Codex X session completed successfully\" with title \"Codex X\" sound name \"Glass\""
            else
                osascript -e "display notification \"Codex X session failed (exit code: $exit_code)\" with title \"Codex X\" sound name \"Basso\""
            fi
        fi

        # VOICEVOX通知
        if command -v curl &> /dev/null && curl -s http://localhost:50021/version &> /dev/null; then
            if [ $exit_code -eq 0 ]; then
                local text="Codex Xのタスクが完了したのだ！"
            else
                local text="Codex Xのタスクが失敗したのだ！"
            fi

            local audio_query
            audio_query=$(curl -s -X POST \
                "http://localhost:50021/audio_query?text=${text}&speaker=3" \
                -H "Content-Type: application/json")

            if [[ -n "$audio_query" ]]; then
                local audio_file="/tmp/codex-notify.wav"
                curl -s -X POST \
                    "http://localhost:50021/synthesis?speaker=3" \
                    -H "Content-Type: application/json" \
                    -d "$audio_query" \
                    -o "$audio_file"

                afplay "$audio_file" 2>/dev/null && rm -f "$audio_file"
            fi
        fi

    ) &

    # PID保存
    local pid=$!
    echo "$pid" > "$pid_file"

    # 最新セッション記録
    echo "$session_id" > "$CODEX_SESSION_DIR/latest"

    echo -e "${GREEN}✅ Codex X started in background (PID: $pid)${NC}"
    echo ""
    echo -e "${CYAN}💡 Monitor progress:${NC}"
    echo -e "   tail -f $log_file"
    echo ""
    echo -e "${CYAN}🔍 Check status:${NC}"
    echo -e "   /codex status $session_id"
    echo -e "   ps -p $pid"
    echo ""
    echo -e "${YELLOW}💬 I can continue working on other tasks while Codex X runs.${NC}"
    echo ""
}

# セッション一覧
list_sessions() {
    echo -e "${CYAN}📋 Active Codex X sessions:${NC}"
    echo ""

    local found=0
    for status_file in "$CODEX_SESSION_DIR"/*.status; do
        if [[ ! -f "$status_file" ]]; then
            continue
        fi

        found=1
        local session_id
        session_id=$(basename "$status_file" .status)

        if command -v jq &> /dev/null; then
            local status
            status=$(jq -r '.status' "$status_file")
            local instruction
            instruction=$(jq -r '.instruction' "$status_file")
            local model
            model=$(jq -r '.model' "$status_file")
            local start_time
            start_time=$(jq -r '.start_time' "$status_file")

            if [[ "$status" == "running" ]]; then
                echo -e "  ${GREEN}▶${NC} ${BOLD}$session_id${NC}"
                echo -e "     Status: ${YELLOW}Running${NC}"
            elif [[ "$status" == "completed" ]]; then
                echo -e "  ${BLUE}✓${NC} ${BOLD}$session_id${NC}"
                echo -e "     Status: ${GREEN}Completed${NC}"
            else
                echo -e "  ${RED}✗${NC} ${BOLD}$session_id${NC}"
                echo -e "     Status: ${RED}Failed${NC}"
            fi

            echo -e "     Model: $model"
            echo -e "     Instruction: $(echo $instruction | head -c 60)..."
            echo -e "     Started: $start_time"
            echo ""
        fi
    done

    if [[ $found -eq 0 ]]; then
        echo -e "  ${YELLOW}No sessions found${NC}"
        echo ""
    fi
}

# ステータス表示
show_status() {
    local session_id="$1"
    local status_file="$CODEX_SESSION_DIR/${session_id}.status"
    local log_file="$CODEX_LOG_DIR/${session_id}.log"

    if [[ ! -f "$status_file" ]]; then
        echo -e "${RED}❌ Session not found: $session_id${NC}"
        exit 1
    fi

    echo -e "${CYAN}📊 Status for $session_id:${NC}"
    echo ""

    if command -v jq &> /dev/null; then
        jq -r 'to_entries[] | "  \(.key): \(.value)"' "$status_file"
    else
        cat "$status_file"
    fi

    echo ""
    echo -e "${CYAN}📝 Last 20 lines of log:${NC}"
    echo ""

    if [[ -f "$log_file" ]]; then
        tail -20 "$log_file"
    else
        echo -e "${YELLOW}  Log file not found${NC}"
    fi
}

# 結果表示
show_result() {
    local session_id="$1"
    local log_file="$CODEX_LOG_DIR/${session_id}.log"

    if [[ ! -f "$log_file" ]]; then
        echo -e "${RED}❌ Log file not found: $session_id${NC}"
        exit 1
    fi

    echo -e "${CYAN}📄 Full output for $session_id:${NC}"
    echo ""
    cat "$log_file"
}

# セッション停止
kill_session() {
    local session_id="$1"
    local pid_file="$CODEX_SESSION_DIR/${session_id}.pid"
    local status_file="$CODEX_SESSION_DIR/${session_id}.status"

    if [[ ! -f "$pid_file" ]]; then
        echo -e "${YELLOW}⚠️  Session not running or already stopped: $session_id${NC}"
        return
    fi

    local pid
    pid=$(cat "$pid_file")

    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null
        echo -e "${GREEN}🛑 Killed session $session_id (PID: $pid)${NC}"

        # ステータス更新
        if [[ -f "$status_file" ]] && command -v jq &> /dev/null; then
            jq '.status = "killed" | .end_time = "'$(date -Iseconds)'"' \
               "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
        fi
    else
        echo -e "${YELLOW}⚠️  Process already stopped (PID: $pid)${NC}"
    fi

    rm -f "$pid_file"
}

# メイン処理
main() {
    # 引数解析
    local model_override=""
    local sandbox_override=""
    local command=""
    local args=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --model)
                model_override="$2"
                shift 2
                ;;
            --sandbox)
                sandbox_override="$2"
                shift 2
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            sessions|status|result|kill)
                command="$1"
                shift
                break
                ;;
            *)
                args+=("$1")
                shift
                ;;
        esac
    done

    # モデル・サンドボックスオーバーライド
    [[ -n "$model_override" ]] && CODEX_MODEL="$model_override"
    [[ -n "$sandbox_override" ]] && CODEX_SANDBOX="$sandbox_override"

    # コマンド実行
    if [[ -n "$command" ]]; then
        case "$command" in
            sessions)
                list_sessions
                ;;
            status)
                if [[ $# -eq 0 ]]; then
                    echo -e "${RED}❌ Error: Session ID required${NC}"
                    exit 1
                fi
                show_status "$1"
                ;;
            result)
                if [[ $# -eq 0 ]]; then
                    echo -e "${RED}❌ Error: Session ID required${NC}"
                    exit 1
                fi
                show_result "$1"
                ;;
            kill)
                if [[ $# -eq 0 ]]; then
                    echo -e "${RED}❌ Error: Session ID required${NC}"
                    exit 1
                fi
                kill_session "$1"
                ;;
        esac
    elif [[ ${#args[@]} -gt 0 ]]; then
        exec_codex "${args[@]}"
    else
        usage
        exit 1
    fi
}

main "$@"
