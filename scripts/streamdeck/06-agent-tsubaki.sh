#!/bin/bash
# Stream Deck: Agent Tsubaki
# Send message to Tsubaki agent pane

MESSAGE="${1:-Tsubakiエージェント、状況報告お願いします}"

# Find Tsubaki pane (assuming pane name or index)
PANE_ID=$(tmux list-panes -a -F '#{pane_id} #{pane_title}' | grep -i tsubaki | awk '{print $1}' | head -1)

if [ -z "$PANE_ID" ]; then
  osascript -e 'display notification "Tsubakiエージェントが見つかりません" with title "❌ Stream Deck"'
  exit 1
fi

tmux send-keys -t "$PANE_ID" "$MESSAGE" && sleep 0.5 && tmux send-keys -t "$PANE_ID" Enter

osascript -e 'display notification "メッセージ送信: Tsubaki" with title "🌸 Stream Deck"'
