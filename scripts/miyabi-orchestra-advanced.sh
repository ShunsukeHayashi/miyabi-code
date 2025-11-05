#!/usr/bin/env bash
# Miyabi Orchestra Advanced - 拡張オーケストレーション管理
# 機能: レイアウト調整、カラー設定、複数セッション、Agent複数起動、Codex統合

set -euo pipefail

VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIYABI_ROOT="$(dirname "$SCRIPT_DIR")"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
RESET='\033[0m'

# Agent情報データベース (bash 3.2 compatible - using functions instead of associative arrays)
get_agent_color() {
    local agent_type="$1"
    case "$agent_type" in
        orchestrator) echo "blue" ;;
        codegen) echo "green" ;;
        review) echo "yellow" ;;
        pr) echo "magenta" ;;
        deployment) echo "red" ;;
        issue) echo "cyan" ;;
        documentation) echo "white" ;;
        *) echo "white" ;;  # Default
    esac
}

get_agent_name() {
    local agent_type="$1"
    case "$agent_type" in
        orchestrator) echo "カエデ" ;;
        codegen) echo "サクラ" ;;
        review) echo "ツバキ" ;;
        pr) echo "ボタン" ;;
        deployment) echo "スミレ" ;;
        issue) echo "アサガオ" ;;
        documentation) echo "フジ" ;;
        *) echo "Agent" ;;  # Default
    esac
}

# 実行環境
get_exec_command() {
    local exec_env="$1"
    case "$exec_env" in
        codex|claude) echo "codex" ;;   # Codex CLI (legacy 'claude' alias)
        cursor) echo "cursor" ;;        # Cursor AI
        *) echo "codex" ;;              # Default to Codex
    esac
}

# 実行環境の存在確認
check_exec_env() {
    local exec_env="$1"
    case "$exec_env" in
        codex|claude|cursor) return 0 ;;
        *) return 1 ;;
    esac
}

#=============================================================================
# ヘルプ表示
#=============================================================================
show_help() {
    cat <<EOF
${CYAN}🎭 Miyabi Orchestra Advanced${RESET} v${VERSION}

${WHITE}Usage:${RESET}
  $0 [COMMAND] [OPTIONS]

${WHITE}Commands:${RESET}
  ${GREEN}layout${RESET} [PRESET]     Apply predefined layout
  ${GREEN}resize${RESET} PANE SIZE    Resize specific pane
  ${GREEN}colorize${RESET}            Apply color scheme to all panes
  ${GREEN}session${RESET} new NAME    Create new Orchestra session
  ${GREEN}agent${RESET} add TYPE      Add new agent to current session
  ${GREEN}agent${RESET} clone TYPE    Clone existing agent (multiple instances)
  ${GREEN}switch${RESET} PANE ENV     Switch pane execution environment
  ${GREEN}status${RESET}              Show current Orchestra status
  ${GREEN}dashboard${RESET}           Launch interactive dashboard

${WHITE}Layout Presets:${RESET}
  ${CYAN}grid-2x2${RESET}       4 panes in 2x2 grid
  ${CYAN}grid-2x3${RESET}       6 panes in 2x3 grid
  ${CYAN}main-side${RESET}      Main pane + 4 side panes
  ${CYAN}coding${RESET}         Optimized for coding (current default)
  ${CYAN}business${RESET}       Optimized for business agents
  ${CYAN}hybrid${RESET}         Mixed coding + business (7 panes)

${WHITE}Examples:${RESET}
  # Apply new layout
  $0 layout grid-2x3

  # Resize pane
  $0 resize %2 80x30

  # Add new agent
  $0 agent add codegen

  # Clone agent (create 2nd instance)
  $0 agent clone codegen

  # Switch to Codex
  $0 switch %3 codex

  # Colorize all panes
  $0 colorize

${WHITE}Interactive Mode:${RESET}
  $0 dashboard

EOF
}

#=============================================================================
# レイアウト管理
#=============================================================================
apply_layout() {
    local preset="${1:-coding}"
    local session="${2:-1}"

    echo -e "${CYAN}🎨 Applying layout: ${preset}${RESET}"

    case "$preset" in
        "grid-2x2")
            apply_grid_2x2 "$session"
            ;;
        "grid-2x3")
            apply_grid_2x3 "$session"
            ;;
        "main-side")
            apply_main_side "$session"
            ;;
        "coding")
            apply_coding_layout "$session"
            ;;
        "business")
            apply_business_layout "$session"
            ;;
        "hybrid")
            apply_hybrid_layout "$session"
            ;;
        *)
            echo -e "${RED}Unknown preset: ${preset}${RESET}"
            return 1
            ;;
    esac

    echo -e "${GREEN}✓ Layout applied successfully${RESET}"
}

apply_grid_2x2() {
    local session="$1"

    # Kill all panes except first
    tmux kill-pane -t "${session}:1.2" 2>/dev/null || true
    tmux kill-pane -t "${session}:1.3" 2>/dev/null || true
    tmux kill-pane -t "${session}:1.4" 2>/dev/null || true
    tmux kill-pane -t "${session}:1.5" 2>/dev/null || true

    # Create 2x2 grid
    tmux split-window -t "${session}:1" -h
    tmux split-window -t "${session}:1.1" -v
    tmux split-window -t "${session}:1.2" -v

    # Balance
    tmux select-layout -t "${session}:1" tiled
}

apply_grid_2x3() {
    local session="$1"

    # Create 2x3 grid (6 panes)
    apply_grid_2x2 "$session"

    # Add 2 more panes
    tmux split-window -t "${session}:1.4" -v
    tmux split-window -t "${session}:1.5" -v

    tmux select-layout -t "${session}:1" tiled
}

apply_main_side() {
    local session="$1"

    # Main pane (70%) + 4 side panes (30%)
    tmux split-window -t "${session}:1" -h -p 30
    tmux split-window -t "${session}:1.2" -v
    tmux split-window -t "${session}:1.3" -v
    tmux split-window -t "${session}:1.4" -v
}

apply_coding_layout() {
    local session="$1"

    # Current default (2x2 grid + full-width bottom)
    apply_grid_2x2 "$session"
    tmux split-window -t "${session}:1.4" -v -p 40
    tmux resize-pane -t "${session}:1.5" -x 100%
}

apply_business_layout() {
    local session="$1"

    # 3x2 grid for business agents
    apply_grid_2x3 "$session"
}

apply_hybrid_layout() {
    local session="$1"

    # 2x3 grid + full-width monitor
    apply_grid_2x3 "$session"
    tmux split-window -t "${session}:1.6" -v -p 30
    tmux resize-pane -t "${session}:1.7" -x 100%
}

#=============================================================================
# カラー設定
#=============================================================================
colorize_panes() {
    local session="${1:-1}"

    echo -e "${CYAN}🎨 Applying color scheme...${RESET}"

    # Get all panes
    local panes=$(tmux list-panes -t "${session}:1" -F '#{pane_id}')
    local index=1

    for pane in $panes; do
        local color=$(get_color_for_index "$index")
        set_pane_border_color "$pane" "$color"
        index=$((index + 1))
    done

    # Set status bar colors
    tmux set -t "$session" status-style "bg=black,fg=white"
    tmux set -t "$session" window-status-current-style "bg=blue,fg=white,bold"

    echo -e "${GREEN}✓ Color scheme applied${RESET}"
}

get_color_for_index() {
    local index="$1"
    local colors=("blue" "green" "yellow" "magenta" "red" "cyan" "white")
    local color_index=$(( (index - 1) % 7 ))
    echo "${colors[$color_index]}"
}

set_pane_border_color() {
    local pane="$1"
    local color="$2"

    tmux set -p -t "$pane" pane-border-style "fg=${color}"
    tmux set -p -t "$pane" pane-active-border-style "fg=${color},bold"
}

#=============================================================================
# Agent管理
#=============================================================================
add_agent() {
    local agent_type="$1"
    local session="${2:-1}"
    local exec_env="${3:-codex}"

    echo -e "${CYAN}🤖 Adding agent: ${agent_type}${RESET}"

    # Create new pane
    local new_pane=$(tmux split-window -t "${session}:1" -P -F '#{pane_id}')

    # Set color
    local color=$(get_agent_color "$agent_type")
    set_pane_border_color "$new_pane" "$color"

    # Start execution environment
    local cmd=$(get_exec_command "$exec_env")
    tmux send-keys -t "$new_pane" "cd '$MIYABI_ROOT' && $cmd" Enter

    sleep 1

    # Send role assignment
    local agent_name=$(get_agent_name "$agent_type")
    tmux send-keys -t "$new_pane" "あなたは「${agent_name}」- Miyabi ${agent_type}Agentです。準備完了したら [${agent_name}] 準備完了 と発言してください。" Enter

    echo -e "${GREEN}✓ Agent added: ${agent_name} (${new_pane})${RESET}"
    echo "$new_pane"
}

clone_agent() {
    local agent_type="$1"
    local session="${2:-1}"
    local exec_env="${3:-codex}"

    # Count existing instances
    local count=$(count_agent_instances "$agent_type" "$session")
    local instance_num=$((count + 1))

    echo -e "${CYAN}🔄 Cloning agent: ${agent_type} (instance #${instance_num})${RESET}"

    # Create new pane
    local new_pane=$(add_agent "$agent_type" "$session" "$exec_env")

    # Rename with instance number
    local agent_name=$(get_agent_name "$agent_type")
    local cloned_name="${agent_name}${instance_num}"

    sleep 1
    tmux send-keys -t "$new_pane" "/clear" Enter
    sleep 0.5
    tmux send-keys -t "$new_pane" "あなたは「${cloned_name}」- Miyabi ${agent_type}Agent (instance #${instance_num})です。準備完了したら [${cloned_name}] 準備完了 と発言してください。" Enter

    echo -e "${GREEN}✓ Agent cloned: ${cloned_name} (${new_pane})${RESET}"
}

count_agent_instances() {
    local agent_type="$1"
    local session="$2"

    # Count by checking pane history (simplified)
    # In real implementation, maintain a registry
    echo "0"
}

#=============================================================================
# セッション管理
#=============================================================================
create_session() {
    local session_name="$1"
    local layout="${2:-coding}"

    echo -e "${CYAN}🎭 Creating new Orchestra session: ${session_name}${RESET}"

    # Create new tmux session
    if tmux has-session -t "$session_name" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Session already exists: ${session_name}${RESET}"
        echo -e "   Use: tmux attach -t ${session_name}"
        return 1
    fi

    tmux new-session -d -s "$session_name" -c "$MIYABI_ROOT"

    # Apply layout
    apply_layout "$layout" "$session_name"

    # Colorize
    colorize_panes "$session_name"

    echo -e "${GREEN}✓ Session created: ${session_name}${RESET}"
    echo -e "   Attach with: ${CYAN}tmux attach -t ${session_name}${RESET}"
}

#=============================================================================
# 実行環境切り替え
#=============================================================================
switch_environment() {
    local pane="$1"
    local env="$2"

    if ! check_exec_env "$env"; then
        echo -e "${RED}Unknown environment: ${env}${RESET}"
        echo -e "Available: codex cursor (legacy alias: claude)"
        return 1
    fi

    echo -e "${CYAN}🔄 Switching ${pane} to ${env}${RESET}"

    # Kill current process
    tmux send-keys -t "$pane" C-c
    sleep 0.5

    # Start new environment
    local cmd=$(get_exec_command "$env")
    tmux send-keys -t "$pane" "$cmd" Enter

    echo -e "${GREEN}✓ Environment switched${RESET}"
}

#=============================================================================
# ステータス表示
#=============================================================================
show_status() {
    local session="${1:-1}"

    echo -e "${CYAN}🎭 Miyabi Orchestra Status${RESET}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""

    echo -e "${WHITE}Session:${RESET} $session"
    echo -e "${WHITE}Panes:${RESET} $(tmux list-panes -t "${session}:1" | wc -l)"
    echo ""

    echo -e "${WHITE}Pane Details:${RESET}"
    tmux list-panes -t "${session}:1" -F "  #{pane_index}. #{pane_id}: #{pane_width}x#{pane_height} - #{pane_current_command}"
    echo ""

    echo -e "${WHITE}Layout:${RESET}"
    echo "  $(tmux list-windows -t "$session" -F '#{window_layout}')"
    echo ""
}

#=============================================================================
# インタラクティブダッシュボード
#=============================================================================
launch_dashboard() {
    clear
    cat <<'EOF'
╔══════════════════════════════════════════════════════════════╗
║           🎭 Miyabi Orchestra Advanced Control              ║
║                    Interactive Dashboard                     ║
╚══════════════════════════════════════════════════════════════╝

EOF

    while true; do
        echo -e "${CYAN}Available Actions:${RESET}"
        echo "  1) Apply Layout"
        echo "  2) Colorize Panes"
        echo "  3) Add Agent"
        echo "  4) Clone Agent"
        echo "  5) Switch Environment"
        echo "  6) Create New Session"
        echo "  7) Show Status"
        echo "  8) Resize Pane"
        echo "  0) Exit"
        echo ""
        read -p "Select action: " choice

        case "$choice" in
            1)
                echo "Available layouts: grid-2x2, grid-2x3, main-side, coding, business, hybrid"
                read -p "Layout: " layout
                apply_layout "$layout"
                ;;
            2)
                colorize_panes
                ;;
            3)
                echo "Available types: orchestrator, codegen, review, pr, deployment, issue, documentation"
                read -p "Agent type: " agent_type
                add_agent "$agent_type"
                ;;
            4)
                echo "Available types: orchestrator, codegen, review, pr, deployment, issue, documentation"
                read -p "Agent type: " agent_type
                clone_agent "$agent_type"
                ;;
            5)
                read -p "Pane ID (e.g., %2): " pane
                echo "Available environments: codex, cursor (legacy alias: claude)"
                read -p "Environment: " env
                switch_environment "$pane" "$env"
                ;;
            6)
                read -p "Session name: " session_name
                read -p "Layout (default: coding): " layout
                layout="${layout:-coding}"
                create_session "$session_name" "$layout"
                ;;
            7)
                show_status
                ;;
            8)
                read -p "Pane ID (e.g., %2): " pane
                read -p "Size (WIDTHxHEIGHT or percentage): " size
                tmux resize-pane -t "$pane" -x "$size" 2>/dev/null || \
                tmux resize-pane -t "$pane" -y "$size" 2>/dev/null || \
                echo "Invalid size format"
                ;;
            0)
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo "Invalid choice"
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

#=============================================================================
# メイン処理
#=============================================================================
main() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi

    local command="$1"
    shift

    case "$command" in
        "layout")
            apply_layout "$@"
            ;;
        "resize")
            if [[ $# -lt 2 ]]; then
                echo "Usage: $0 resize PANE SIZE"
                exit 1
            fi
            tmux resize-pane -t "$1" -x "$2" 2>/dev/null || \
            tmux resize-pane -t "$1" -y "$2"
            ;;
        "colorize")
            colorize_panes "$@"
            ;;
        "session")
            if [[ "${1:-}" == "new" ]]; then
                shift
                create_session "$@"
            else
                echo "Usage: $0 session new NAME [LAYOUT]"
                exit 1
            fi
            ;;
        "agent")
            local subcommand="${1:-}"
            shift
            case "$subcommand" in
                "add")
                    add_agent "$@"
                    ;;
                "clone")
                    clone_agent "$@"
                    ;;
                *)
                    echo "Usage: $0 agent {add|clone} TYPE"
                    exit 1
                    ;;
            esac
            ;;
        "switch")
            switch_environment "$@"
            ;;
        "status")
            show_status "$@"
            ;;
        "dashboard")
            launch_dashboard
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run
main "$@"
