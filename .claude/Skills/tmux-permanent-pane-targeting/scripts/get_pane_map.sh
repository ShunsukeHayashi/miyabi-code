#!/bin/bash
# get_pane_map.sh - Generate permanent pane ID mapping
# Usage: ./get_pane_map.sh [session_filter]

SESSION_FILTER="${1:-}"

echo "# Pane ID Mapping ($(date))"
echo "# Format: session:window.pane → %pane_id (command)"
echo ""

if [ -n "$SESSION_FILTER" ]; then
    tmux list-panes -t "$SESSION_FILTER" -a \
        -F "#{session_name}:#{window_index}.#{pane_index} → #{pane_id} (#{pane_current_command})"
else
    tmux list-panes -a \
        -F "#{session_name}:#{window_index}.#{pane_index} → #{pane_id} (#{pane_current_command})"
fi

echo ""
echo "# Quick lookup commands:"
echo "# tmux display-message -t %N -p 'Pane %N = #{pane_id} in #{session_name}:#{window_index}'"
