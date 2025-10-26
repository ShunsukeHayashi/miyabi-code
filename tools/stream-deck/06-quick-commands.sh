#!/bin/bash
# Stream Deck Shortcut: Quick Commands
# Usage: よく使う定型コマンドをClaude Codeに送信
# Note: セッションが停止していても自動的に再起動します

COMMAND="${1:-next}"

case "$COMMAND" in
    "next"|"n")
        MESSAGE="Next"
        ;;
    "continue"|"c")
        MESSAGE="Continue"
        ;;
    "fix"|"f")
        MESSAGE="Fix build errors"
        ;;
    "test"|"t")
        MESSAGE="Run tests and fix any failures"
        ;;
    "commit"|"co")
        MESSAGE="Create a commit with all changes"
        ;;
    "pr"|"p")
        MESSAGE="Create a pull request"
        ;;
    "infinity"|"i")
        MESSAGE="/miyabi-infinity"
        ;;
    "voice"|"v")
        MESSAGE="/voicevox"
        ;;
    "status"|"s")
        MESSAGE="Show project status and suggest next steps"
        ;;
    "help"|"h")
        MESSAGE="What tasks are available? Show me a list."
        ;;
    *)
        MESSAGE="$COMMAND"
        ;;
esac

# Send to Claude Code
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"
