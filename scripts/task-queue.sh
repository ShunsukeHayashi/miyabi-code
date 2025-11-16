#!/usr/bin/env bash
CMD="${1:-list}"
case "$CMD" in
  list)
    echo "📋 Task Queue:"
    echo "1. Task A - pending"
    echo "2. Task B - running"
    echo "3. Task C - pending"
    ;;
  add)
    echo "➕ Added task: ${2}"
    ;;
  *)
    echo "Usage: task-queue.sh [list|add]"
    ;;
esac
