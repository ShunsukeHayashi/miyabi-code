#!/bin/bash
# Launch remaining tutorials - Batch 1 (tutorial-01, 05, 06)
set -e

SESSION_NAME="miyabi-tutorials-batch1-$$"

# Tutorial definitions with requirements
declare -A TUTORIALS
TUTORIALS["01"]="Getting Started with Miyabi|Miyabiの基本的なセットアップとインストール手順"
TUTORIALS["05"]="Testing Strategies|Rustテスト戦略（unit, integration, doc tests）"
TUTORIALS["06"]="Performance Optimization|Rustパフォーマンス最適化テクニック"

# Kill existing session if exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo "======================================================"
echo "🚀 Launching Batch 1: Tutorials 01, 05, 06"
echo "======================================================"
echo ""

is_first="true"

for tutorial_num in 01 05 06; do
    IFS='|' read -r title description <<< "${TUTORIALS[$tutorial_num]}"
    worktree_path=".worktrees/tutorial-$tutorial_num"
    window_name="tutorial-$tutorial_num"

    echo "📝 Setting up Tutorial $tutorial_num: $title"

    # Create EXECUTION_CONTEXT.md
    cat > "$worktree_path/EXECUTION_CONTEXT.md" << EOF
# Execution Context for Tutorial $tutorial_num

## Tutorial Information
- **Tutorial ID**: tutorial-$tutorial_num
- **Title**: $title
- **Description**: $description
- **Worktree**: $worktree_path

## Execution Instructions

Please create a comprehensive tutorial for this topic.

### Requirements

1. **Minimum 200 lines** of Markdown content
2. **Code examples** with syntax highlighting
3. **Step-by-step instructions**
4. **Best practices section**
5. **Troubleshooting section**

### Output Format

IMPORTANT: Output ONLY the raw Markdown content.
Do NOT output explanations, summaries, or meta-information.

Start directly with the Markdown heading:
# Tutorial $tutorial_num: $title

Output format: Raw Markdown only (no preamble, no postamble).

---

**Start your work below:**
EOF

    # Create execution script
    cat > "$worktree_path/execute_tutorial.sh" << 'SCRIPT_EOF'
#!/bin/bash
set -e

CONTEXT=$(cat EXECUTION_CONTEXT.md)

echo "🤖 Starting Claude Code execution..."

claude --print --output-format text "$CONTEXT" > "docs/tutorials/$(echo $CONTEXT | grep 'Tutorial ID' | cut -d'-' -f2 | xargs)-$(echo $CONTEXT | grep 'Title:' | cut -d':' -f2 | tr -d ' ' | tr '[:upper:]' '[:lower:]' | head -c 20).md" 2>&1

# Extract tutorial number from EXECUTION_CONTEXT.md
TUTORIAL_NUM=$(grep 'Tutorial ID' EXECUTION_CONTEXT.md | sed 's/.*tutorial-//' | tr -d '[:space:]')
OUTPUT_FILE="docs/tutorials/${TUTORIAL_NUM}-*.md"

# Find the actual output file
ACTUAL_FILE=$(ls docs/tutorials/${TUTORIAL_NUM}-*.md 2>/dev/null | head -1)

if [ -n "$ACTUAL_FILE" ] && [ -s "$ACTUAL_FILE" ]; then
    echo "✅ Tutorial generated: $ACTUAL_FILE"
    git add "$ACTUAL_FILE"
    git commit -m "docs(tutorial): add Tutorial $TUTORIAL_NUM (Claude Code generated)"
    echo "✅ Git commit created"
else
    echo "⚠️  Warning: Output file not found or empty"
fi

echo "🎉 Execution completed for Tutorial $TUTORIAL_NUM"
SCRIPT_EOF

    chmod +x "$worktree_path/execute_tutorial.sh"

    # Launch tmux window
    if [ "$is_first" = "true" ]; then
        tmux new-session -d -s "$SESSION_NAME" -n "$window_name"
        is_first="false"
    else
        tmux new-window -t "$SESSION_NAME" -n "$window_name"
    fi

    tmux send-keys -t "${SESSION_NAME}:${window_name}" "cd $worktree_path" C-m
    tmux send-keys -t "${SESSION_NAME}:${window_name}" "bash execute_tutorial.sh 2>&1 | tee execution.log" C-m

    echo "  ✅ Launched in tmux: $window_name"
done

echo ""
echo "======================================================"
echo "🚀 Batch 1 launched: 3 tutorials in parallel"
echo "======================================================"
echo ""
echo "📊 Monitor execution:"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo "⏱️  Estimated time: 5-10 minutes"
echo ""
echo "======================================================"
