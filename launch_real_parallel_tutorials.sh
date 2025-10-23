#!/bin/bash
# Water Spider Orchestrator - REAL Parallel Tutorial Generation
# Issue #472: 10個のチュートリアルを並列作成（Claude Code自動実行版）

set -e

# tmuxセッション名
SESSION_NAME="miyabi-tutorials-real"

# 既存のセッションがあれば削除
tmux kill-session -t $SESSION_NAME 2>/dev/null || true

echo "====================================================="
echo "🕷️  Water Spider Orchestrator - REAL Parallel Execution"
echo "====================================================="
echo ""
echo "✅ Claude Code --print モードで自動実行"
echo ""

# Worktreeを作成（新しいブランチとして）
git worktree add -b worktree-tutorial-02 .worktrees/tutorial-02 main 2>/dev/null || git worktree add .worktrees/tutorial-02 worktree-tutorial-02 2>/dev/null || true
git worktree add -b worktree-tutorial-03 .worktrees/tutorial-03 main 2>/dev/null || git worktree add .worktrees/tutorial-03 worktree-tutorial-03 2>/dev/null || true
git worktree add -b worktree-tutorial-04 .worktrees/tutorial-04 main 2>/dev/null || git worktree add .worktrees/tutorial-04 worktree-tutorial-04 2>/dev/null || true

# 新しいtmuxセッションを作成
tmux new-session -d -s $SESSION_NAME -n "tutorial-02"

# tutorial-02用のウィンドウ
tmux send-keys -t $SESSION_NAME:tutorial-02 "cd /Users/shunsuke/Dev/miyabi-private/.worktrees/tutorial-02" C-m
tmux send-keys -t $SESSION_NAME:tutorial-02 "cat > execute_tutorial.sh << 'SCRIPT'
#!/bin/bash
set -e

# EXECUTION_CONTEXT.mdを読み込んでClaude Codeに渡す
CONTEXT=\$(cat EXECUTION_CONTEXT.md)

# Claude Code --printモードで実行
claude --print --output-format text \"\$CONTEXT

Please create a complete Tutorial 02: Creating Your First Agent.

Requirements:
- Comprehensive BaseAgent trait explanation
- Step-by-step Rust implementation
- Code examples with tests
- Troubleshooting section
- At least 200 lines of content

Output the complete tutorial markdown directly.\" > docs/tutorials/02-creating-your-first-agent.md

# 生成されたファイルをコミット
git add docs/tutorials/02-creating-your-first-agent.md
git commit -m 'docs(tutorial): add Tutorial 02 - Creating Your First Agent (Claude Code generated)'

echo 'Tutorial 02 completed with Claude Code'
SCRIPT
" C-m
tmux send-keys -t $SESSION_NAME:tutorial-02 "chmod +x execute_tutorial.sh && ./execute_tutorial.sh" C-m

# tutorial-03用のウィンドウ
tmux new-window -t $SESSION_NAME -n "tutorial-03"
tmux send-keys -t $SESSION_NAME:tutorial-03 "cd /Users/shunsuke/Dev/miyabi-private/.worktrees/tutorial-03" C-m
tmux send-keys -t $SESSION_NAME:tutorial-03 "cat > execute_tutorial.sh << 'SCRIPT'
#!/bin/bash
set -e

CONTEXT=\$(cat EXECUTION_CONTEXT.md)

claude --print --output-format text \"\$CONTEXT

Please create a complete Tutorial 03: Worktree Parallel Execution.

Requirements:
- Detailed Worktree explanation
- Parallel execution patterns
- Real-world examples with Issue #472
- Git commands reference
- At least 200 lines of content

Output the complete tutorial markdown directly.\" > docs/tutorials/03-worktree-parallel-execution.md

git add docs/tutorials/03-worktree-parallel-execution.md
git commit -m 'docs(tutorial): add Tutorial 03 - Worktree Parallel Execution (Claude Code generated)'

echo 'Tutorial 03 completed with Claude Code'
SCRIPT
" C-m
tmux send-keys -t $SESSION_NAME:tutorial-03 "chmod +x execute_tutorial.sh && ./execute_tutorial.sh" C-m

# tutorial-04用のウィンドウ
tmux new-window -t $SESSION_NAME -n "tutorial-04"
tmux send-keys -t $SESSION_NAME:tutorial-04 "cd /Users/shunsuke/Dev/miyabi-private/.worktrees/tutorial-04" C-m
tmux send-keys -t $SESSION_NAME:tutorial-04 "cat > execute_tutorial.sh << 'SCRIPT'
#!/bin/bash
set -e

CONTEXT=\$(cat EXECUTION_CONTEXT.md)

claude --print --output-format text \"\$CONTEXT

Please create a complete Tutorial 04: Integration with GitHub.

Requirements:
- GitHub API integration guide
- octocrab usage examples
- Issue/PR manipulation
- Authentication setup
- At least 200 lines of content

Output the complete tutorial markdown directly.\" > docs/tutorials/04-integration-with-github.md

git add docs/tutorials/04-integration-with-github.md
git commit -m 'docs(tutorial): add Tutorial 04 - Integration with GitHub (Claude Code generated)'

echo 'Tutorial 04 completed with Claude Code'
SCRIPT
" C-m
tmux send-keys -t $SESSION_NAME:tutorial-04 "chmod +x execute_tutorial.sh && ./execute_tutorial.sh" C-m

echo ""
echo "====================================================="
echo "🚀 3つのClaude Code --printプロセスが起動しました"
echo "====================================================="
echo ""
echo "📊 実行状況の確認:"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo "⏱️  予想実行時間: 約5-10分（並列実行）"
echo ""
echo "====================================================="
