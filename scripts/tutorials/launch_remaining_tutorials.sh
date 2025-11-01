#!/bin/bash
# Launch remaining 7 tutorials using proven pattern
set -e

SESSION_NAME="miyabi-tutorials-remaining-$$"

# Kill existing session
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo "🚀 Launching 7 remaining tutorials..."

# Tutorial 01: Getting Started
git worktree add -b worktree-tutorial-01 .worktrees/tutorial-01 main 2>/dev/null || true

cat > .worktrees/tutorial-01/EXECUTION_CONTEXT.md << 'CTX01'
# Tutorial 01: Getting Started with Miyabi

Create a comprehensive Getting Started tutorial (200+ lines).
CTX01

cat > .worktrees/tutorial-01/execute_tutorial.sh << 'EXEC01'
#!/bin/bash
claude --print --output-format text "$(cat EXECUTION_CONTEXT.md)

IMPORTANT: Output ONLY raw Markdown. Start with: # Tutorial 01: Getting Started with Miyabi

Requirements: Installation, setup, first project, 200+ lines." > docs/tutorials/01-getting-started.md

git add docs/tutorials/01-getting-started.md
git commit -m 'docs(tutorial): add Tutorial 01 (Claude Code)'
echo "✅ Tutorial 01 completed"
EXEC01

chmod +x .worktrees/tutorial-01/execute_tutorial.sh

tmux new-session -d -s "$SESSION_NAME" -n "tut-01"
tmux send-keys -t "$SESSION_NAME:tut-01" "cd .worktrees/tutorial-01 && bash execute_tutorial.sh 2>&1" C-m

echo "✅ Tutorial 01 launched"
echo ""
echo "Monitor: tmux attach -t $SESSION_NAME"
