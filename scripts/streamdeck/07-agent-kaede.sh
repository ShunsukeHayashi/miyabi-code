#!/bin/bash
# Stream Deck: Agent Kaede
# Send message to Kaede agent pane

MESSAGE="${1:-Kaedeエージェント、進捗状況を教えてください}"

PANE_ID=$(tmux list-panes -a -F '#{pane_id} #{pane_title}' | grep -i kaede | awk '{print $1}' | head -1)

if [ -z "$PANE_ID" ]; then
  osascript -e 'display notification "Kaedeエージェントが見つかりません" with title "❌ Stream Deck"'
  exit 1
fi

tmux send-keys -t "$PANE_ID" "$MESSAGE" && sleep 0.5 && tmux send-keys -t "$PANE_ID" Enter

osascript -e 'display notification "メッセージ送信: Kaede" with title "🍁 Stream Deck"'
