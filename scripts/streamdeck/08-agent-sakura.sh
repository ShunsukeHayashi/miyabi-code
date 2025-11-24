#!/bin/bash
# Stream Deck: Agent Sakura
# Send message to Sakura agent pane

MESSAGE="${1:-Sakuraエージェント、タスクの確認をお願いします}"

PANE_ID=$(tmux list-panes -a -F '#{pane_id} #{pane_title}' | grep -i sakura | awk '{print $1}' | head -1)

if [ -z "$PANE_ID" ]; then
  osascript -e 'display notification "Sakuraエージェントが見つかりません" with title "❌ Stream Deck"'
  exit 1
fi

tmux send-keys -t "$PANE_ID" "$MESSAGE" && sleep 0.5 && tmux send-keys -t "$PANE_ID" Enter

osascript -e 'display notification "メッセージ送信: Sakura" with title "🌺 Stream Deck"'
