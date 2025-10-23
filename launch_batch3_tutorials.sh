#!/bin/bash
# Batch 3: Tutorials 07, 09, 10 (final batch)
set -e

SESSION="tut-batch3-$$"
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "🚀 Launching Batch 3: Tutorials 07, 09, 10..."

# Tutorial 07: Custom Agent Development
cat > .worktrees/tutorial-07/execute.sh << 'T07'
#!/bin/bash
claude --print --output-format text "
# Tutorial 07: Custom Agent Development

Create custom agent development tutorial (200+ lines):
- BaseAgent trait implementation
- Agent lifecycle (pre-execute, execute, post-execute)
- Error handling and escalation
- Agent configuration
- Testing custom agents
- Integration with Coordinator
- Real-world example: Creating NotificationAgent

IMPORTANT: Output ONLY raw Markdown. No meta-information.
Start with: # Tutorial 07: Custom Agent Development
" > docs/tutorials/07-custom-agent-development.md

git add docs/tutorials/07-custom-agent-development.md
git commit -m 'docs(tutorial): add Tutorial 07 - Custom Agent Development'
echo "✅ Tutorial 07 done"
T07

# Tutorial 09: Troubleshooting
cat > .worktrees/tutorial-09/execute.sh << 'T09'
#!/bin/bash
claude --print --output-format text "
# Tutorial 09: Troubleshooting

Create troubleshooting guide (200+ lines):
- Common compilation errors
- Runtime panics and how to debug
- Git worktree issues
- Agent execution failures
- GitHub API rate limits
- Performance bottlenecks
- Log analysis techniques
- Recovery procedures

IMPORTANT: Output ONLY raw Markdown. No meta-information.
Start with: # Tutorial 09: Troubleshooting Guide
" > docs/tutorials/09-troubleshooting.md

git add docs/tutorials/09-troubleshooting.md
git commit -m 'docs(tutorial): add Tutorial 09 - Troubleshooting'
echo "✅ Tutorial 09 done"
T09

# Tutorial 10: Advanced Topics
cat > .worktrees/tutorial-10/execute.sh << 'T10'
#!/bin/bash
claude --print --output-format text "
# Tutorial 10: Advanced Topics

Create advanced topics tutorial (200+ lines):
- Parallel execution patterns
- DAG-based task decomposition
- Knowledge management (vector DB, RAG)
- MCP integration
- LLM provider abstraction
- Advanced error handling
- Performance profiling
- Extending the framework

IMPORTANT: Output ONLY raw Markdown. No meta-information.
Start with: # Tutorial 10: Advanced Topics
" > docs/tutorials/10-advanced-topics.md

git add docs/tutorials/10-advanced-topics.md
git commit -m 'docs(tutorial): add Tutorial 10 - Advanced Topics'
echo "✅ Tutorial 10 done"
T10

chmod +x .worktrees/tutorial-*/execute.sh

# Launch in tmux
tmux new-session -d -s "$SESSION" -n "t07"
tmux send-keys -t "$SESSION:t07" "cd .worktrees/tutorial-07 && bash execute.sh 2>&1" C-m

tmux new-window -t "$SESSION" -n "t09"
tmux send-keys -t "$SESSION:t09" "cd .worktrees/tutorial-09 && bash execute.sh 2>&1" C-m

tmux new-window -t "$SESSION" -n "t10"
tmux send-keys -t "$SESSION:t10" "cd .worktrees/tutorial-10 && bash execute.sh 2>&1" C-m

echo "✅ Batch 3 launched (3 tutorials)"
echo "Monitor: tmux attach -t $SESSION"
