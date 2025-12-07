#!/bin/bash
# ============================================================
# Miyabi OSS - Claude Code Agent Launcher
# ============================================================
# 新機能: --agent / --agents / --append-system-prompt を活用
# ============================================================

set -e

PROJECT_DIR="${MIYABI_ROOT:-$HOME/Dev/01-miyabi/_core/miyabi-private}"
SESSION="miyabi-oss"

# ============================================================
# Agent Definitions (JSON format for --agents flag)
# ============================================================
AGENTS_JSON='{
  "shikiroon": {
    "description": "Conductor agent. Orchestrates other agents, manages task distribution, and monitors progress.",
    "prompt": "You are しきるん (Shikiroon), the Conductor agent for Miyabi.\n\nYour responsibilities:\n1. Receive tasks and break them into subtasks\n2. Assign subtasks to appropriate worker agents (CodeGen, Review, PR, Deploy)\n3. Monitor progress via tmux pane outputs\n4. Aggregate results and report completion\n\nCommunication Protocol:\n- Use PUSH pattern: Workers report to you, you do NOT poll workers\n- Message format: tmux send-keys -t %N \"message\" && sleep 0.5 && tmux send-keys -t %N Enter\n\nNever write code directly. Delegate to specialized agents.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "opus"
  },
  "kaede": {
    "description": "CodeGen agent. Writes Rust code following Miyabi conventions.",
    "prompt": "You are カエデ (Kaede), a CodeGen agent specialized in Rust development.\n\nYour responsibilities:\n1. Implement features following Miyabi coding standards\n2. Write idiomatic Rust with proper error handling\n3. Create unit tests for new functionality\n4. Report completion to Conductor via PUSH\n\nKey patterns:\n- Use MiyabiError for error handling\n- Implement BaseAgent trait for new agents\n- Use async/await with tokio\n- Follow .claude/RUST_CHEATSHEET.md conventions\n\nAfter completing a task, PUSH status to Conductor.",
    "tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    "model": "sonnet"
  },
  "sakura": {
    "description": "Review agent. Reviews code for quality, security, and best practices.",
    "prompt": "You are サクラ (Sakura), a code review specialist.\n\nYour responsibilities:\n1. Review code changes for bugs and security issues\n2. Check adherence to Miyabi coding standards\n3. Verify test coverage and quality\n4. Provide actionable feedback\n\nReview checklist:\n- Error handling: No unwrap() in production code\n- Memory safety: Check for potential leaks\n- Concurrency: Verify async correctness\n- Documentation: Ensure public APIs are documented\n\nAfter review, PUSH results to Conductor with APPROVE/REJECT status.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "tsubaki": {
    "description": "PR agent. Creates and manages GitHub pull requests.",
    "prompt": "You are ツバキ (Tsubaki), the PR management agent.\n\nYour responsibilities:\n1. Create well-structured pull requests\n2. Write clear PR descriptions with context\n3. Link related issues\n4. Respond to review comments\n\nPR format:\n- Title: [TYPE] Brief description\n- Body: What/Why/How with bullet points\n- Labels: feature, bugfix, docs, etc.\n\nAfter PR creation, PUSH the PR URL to Conductor.",
    "tools": ["Read", "Bash", "Glob", "Grep"],
    "model": "sonnet"
  },
  "botan": {
    "description": "Deploy agent. Handles build, test, and deployment tasks.",
    "prompt": "You are ボタン (Botan), the deployment specialist.\n\nYour responsibilities:\n1. Run cargo build and cargo test\n2. Execute clippy for linting\n3. Manage Docker builds if needed\n4. Deploy to staging/production\n\nDeploy checklist:\n- All tests pass\n- No clippy warnings\n- Documentation updated\n- CHANGELOG updated\n\nAfter deployment, PUSH status to Conductor with deployment URL.",
    "tools": ["Read", "Bash", "Glob"],
    "model": "sonnet"
  }
}'

# ============================================================
# Launch Functions
# ============================================================

launch_conductor() {
  echo "🎭 Launching Conductor (しきるん)..."
  tmux send-keys -t "$SESSION:conductor" \
    "cd $PROJECT_DIR && claude --agent shikiroon --agents '$AGENTS_JSON' --append-system-prompt 'You are the main conductor. Pane map: Conductor=%0, CodeGen1=%1, CodeGen2=%2, CodeGen3=%3, Review=%4, PR=%5, Deploy=%6'" \
    Enter
}

launch_codegen() {
  local pane_num=$1
  local pane_id=$2
  echo "🍁 Launching CodeGen #$pane_num (カエデ) at $pane_id..."
  tmux send-keys -t "$SESSION:codegen-$pane_num" \
    "cd $PROJECT_DIR && claude --agent kaede --agents '$AGENTS_JSON' --append-system-prompt 'You are CodeGen agent #$pane_num. Your pane ID is $pane_id. Report to Conductor at %0.'" \
    Enter
}

launch_review() {
  echo "🌸 Launching Review (サクラ)..."
  tmux send-keys -t "$SESSION:review" \
    "cd $PROJECT_DIR && claude --agent sakura --agents '$AGENTS_JSON' --append-system-prompt 'Your pane ID is %4. Report to Conductor at %0.'" \
    Enter
}

launch_pr() {
  echo "🌺 Launching PR (ツバキ)..."
  tmux send-keys -t "$SESSION:pr" \
    "cd $PROJECT_DIR && claude --agent tsubaki --agents '$AGENTS_JSON' --append-system-prompt 'Your pane ID is %5. Report to Conductor at %0.'" \
    Enter
}

launch_deploy() {
  echo "🌹 Launching Deploy (ボタン)..."
  tmux send-keys -t "$SESSION:deploy" \
    "cd $PROJECT_DIR && claude --agent botan --agents '$AGENTS_JSON' --append-system-prompt 'Your pane ID is %6. Report to Conductor at %0.'" \
    Enter
}

# ============================================================
# Main
# ============================================================

echo "============================================================"
echo "🚀 Miyabi OSS - Claude Code Agent Launcher"
echo "============================================================"
echo ""
echo "Using new Claude Code features:"
echo "  --agent: Main agent specification"
echo "  --agents: Dynamic subagent definitions"
echo "  --append-system-prompt: Additional instructions"
echo ""

# Check if session exists
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "❌ Session '$SESSION' not found. Run init-miyabi-oss.sh first."
  exit 1
fi

echo "📋 Pane Mapping:"
cat ~/.miyabi/pane_map.txt
echo ""

echo "Select agents to launch:"
echo "  1) Conductor only"
echo "  2) All agents"
echo "  3) Custom selection"
echo ""
read -p "Choice [1-3]: " choice

case $choice in
  1)
    launch_conductor
    ;;
  2)
    launch_conductor
    sleep 2
    launch_codegen 1 %1
    launch_codegen 2 %2
    launch_codegen 3 %3
    launch_review
    launch_pr
    launch_deploy
    ;;
  3)
    echo "Select agents (space-separated): conductor codegen1 codegen2 codegen3 review pr deploy"
    read -p "Agents: " agents
    for agent in $agents; do
      case $agent in
        conductor) launch_conductor ;;
        codegen1) launch_codegen 1 %1 ;;
        codegen2) launch_codegen 2 %2 ;;
        codegen3) launch_codegen 3 %3 ;;
        review) launch_review ;;
        pr) launch_pr ;;
        deploy) launch_deploy ;;
      esac
      sleep 1
    done
    ;;
esac

echo ""
echo "============================================================"
echo "✅ Agent launch complete!"
echo "============================================================"
echo ""
echo "Attach to session: tmux attach -t $SESSION"
echo ""
