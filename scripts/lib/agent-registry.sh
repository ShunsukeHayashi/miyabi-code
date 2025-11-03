#!/bin/bash
# Miyabi Orchestra - Agent Registry Library
# Purpose: Dynamic agent-to-pane mapping (eliminates hardcoded pane IDs)

set -euo pipefail

# Agent名からPane IDを動的に取得
# Usage: get_agent_pane "カエデ"
# Returns: %2 (or empty if not found)
get_agent_pane() {
    local agent_name="$1"

    # tmuxのすべてのペインをリストして、pane_titleでagent名を検索
    # Format: #{pane_id} #{pane_title}
    local pane_id=$(tmux list-panes -a -F "#{pane_id} #{pane_title}" 2>/dev/null | \
        grep -i "$agent_name" | \
        awk '{print $1}' | \
        head -1)

    echo "$pane_id"
}

# Pane IDからAgent名を取得（逆引き）
# Usage: get_pane_agent "%2"
# Returns: カエデ (or empty if not found)
get_pane_agent() {
    local pane_id="$1"

    local agent_name=$(tmux list-panes -a -F "#{pane_id} #{pane_title}" 2>/dev/null | \
        grep "^${pane_id}" | \
        awk '{print $2}' | \
        head -1)

    echo "$agent_name"
}

# すべてのAgent（カエデ、サクラ、ツバキ、ボタン、Codex-*）のPane IDを取得
# Usage: get_all_agent_panes
# Returns: associative array AGENT_PANES with agent_name -> pane_id mapping
get_all_agent_panes() {
    # Known agent names
    local known_agents=(
        "カンナ"
        "カエデ"
        "サクラ"
        "ツバキ"
        "ボタン"
        "Codex-1"
        "Codex-2"
        "Codex-3"
        "Codex-4"
    )

    # Build associative array
    declare -gA AGENT_PANES

    for agent in "${known_agents[@]}"; do
        local pane_id=$(get_agent_pane "$agent")
        if [ ! -z "$pane_id" ]; then
            AGENT_PANES["$agent"]="$pane_id"
        fi
    done
}

# Pane IDが存在するか確認
# Usage: pane_exists "%2"
# Returns: 0 if exists, 1 if not
pane_exists() {
    local pane_id="$1"

    if tmux list-panes -F '#{pane_id}' 2>/dev/null | grep -q "^${pane_id}$"; then
        return 0
    else
        return 1
    fi
}

# Agent名でペインが存在するか確認
# Usage: agent_pane_exists "カエデ"
# Returns: 0 if exists, 1 if not
agent_pane_exists() {
    local agent_name="$1"
    local pane_id=$(get_agent_pane "$agent_name")

    if [ -z "$pane_id" ]; then
        return 1
    fi

    pane_exists "$pane_id"
}

# Agent登録状況を表示（デバッグ用）
# Usage: debug_agent_registry
debug_agent_registry() {
    echo "=== Agent Registry Debug ==="
    echo ""

    get_all_agent_panes

    for agent in "${!AGENT_PANES[@]}"; do
        local pane_id="${AGENT_PANES[$agent]}"
        printf "%-15s -> %s\n" "$agent" "$pane_id"
    done

    echo ""
    echo "Total agents registered: ${#AGENT_PANES[@]}"
}

# Export functions for use in other scripts
export -f get_agent_pane
export -f get_pane_agent
export -f get_all_agent_panes
export -f pane_exists
export -f agent_pane_exists
export -f debug_agent_registry
