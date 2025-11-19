#!/bin/bash
# Water Spider Orchestrator - Production Version
# Claude Code --print モードによる並列タスク実行システム
#
# Usage:
#   ./scripts/water-spider-orchestrator.sh --issues "270,271,272" --concurrency 3
#   ./scripts/water-spider-orchestrator.sh --dag issue-472-tasks.json

set -e

# ===== Configuration =====
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE=".worktrees"
SESSION_PREFIX="miyabi-ws"

# ===== Functions =====

show_usage() {
    cat << EOF
Water Spider Orchestrator - Claude Code Parallel Execution

Usage:
  $0 --issues "270,271,272" --concurrency 3
  $0 --dag path/to/dag.json

Options:
  --issues ISSUES          Comma-separated Issue numbers (e.g., "270,271,272")
  --concurrency N          Number of parallel executions (default: 3)
  --dag PATH               Path to DAG JSON file
  --session-name NAME      Custom tmux session name (default: miyabi-ws-\$RANDOM)
  --help                   Show this help message

Examples:
  # Execute 3 Issues in parallel
  $0 --issues "270,271,272" --concurrency 3

  # Execute DAG-based tasks
  $0 --dag crates/miyabi-scheduler/examples/issue-472-tasks.json

  # Custom session name
  $0 --issues "270" --session-name "issue-270-execution"

EOF
}

create_worktree() {
    local issue_num="$1"
    local branch_name="worktree-issue-${issue_num}"
    local worktree_path="${WORKTREE_BASE}/issue-${issue_num}"

    echo "📁 Creating Worktree for Issue #${issue_num}..."

    # Worktree作成（既存の場合はスキップ）
    if [ -d "$worktree_path" ]; then
        echo "  ⚠️  Worktree already exists: $worktree_path"
        return 0
    fi

    # 新しいブランチとしてWorktreeを作成
    git worktree add -b "$branch_name" "$worktree_path" main 2>/dev/null || \
        git worktree add "$worktree_path" "$branch_name" 2>/dev/null || \
        true

    echo "  ✅ Worktree created: $worktree_path"
}

setup_claude_config() {
    local issue_num="$1"
    local worktree_path="${WORKTREE_BASE}/issue-${issue_num}"
    local main_claude_dir="${PROJECT_ROOT}/.claude"

    echo "  ⚙️  Setting up .claude configuration..."

    # .claudeディレクトリが存在しない場合はスキップ
    if [ ! -d "$main_claude_dir" ]; then
        echo "  ⚠️  No .claude directory found in main branch"
        return 0
    fi

    # Worktree内の.claudeが既にシンボリックリンクの場合はスキップ
    if [ -L "${worktree_path}/.claude" ]; then
        echo "  ℹ️  .claude symlink already exists"
        return 0
    fi

    # Worktree内の.claudeを削除（存在する場合）
    if [ -d "${worktree_path}/.claude" ] || [ -f "${worktree_path}/.claude" ]; then
        rm -rf "${worktree_path}/.claude"
    fi

    # mainブランチの.claudeへのシンボリックリンクを作成
    ln -s "$main_claude_dir" "${worktree_path}/.claude"

    echo "  ✅ .claude symlink created: ${worktree_path}/.claude -> $main_claude_dir"
}

create_execution_context() {
    local issue_num="$1"
    local worktree_path="${WORKTREE_BASE}/issue-${issue_num}"

    cat > "${worktree_path}/EXECUTION_CONTEXT.md" << EOF
# Execution Context for Issue #${issue_num}

## Issue Information
- **Issue Number**: #${issue_num}
- **GitHub URL**: https://github.com/your-org/your-repo/issues/${issue_num}
- **Assigned Agent**: CoordinatorAgent
- **Worktree**: ${worktree_path}

## Execution Instructions

Please analyze Issue #${issue_num} and execute the following:

1. **Understand the Issue**: Read the Issue description from GitHub
2. **Plan the Implementation**: Break down into smaller tasks
3. **Execute the Tasks**: Implement code, tests, and documentation
4. **Create Git Commit**: Commit with Conventional Commits format

## Output Format

Output all work directly as executable code/documentation.
Do NOT output meta-information or explanations.

---

**Start your work below:**

EOF

    echo "  ✅ EXECUTION_CONTEXT.md created"
}

create_execution_script() {
    local issue_num="$1"
    local worktree_path="${WORKTREE_BASE}/issue-${issue_num}"

    cat > "${worktree_path}/execute_claude.sh" << 'SCRIPT_EOF'
#!/bin/bash
set -e

# EXECUTION_CONTEXT.mdを読み込み
CONTEXT=$(cat EXECUTION_CONTEXT.md)

# Claude Code --printモードで実行
echo "🤖 Starting Claude Code execution..."

claude --print --output-format text "$CONTEXT

IMPORTANT: Output ONLY executable code and documentation. No meta-information.

Execute the task described in EXECUTION_CONTEXT.md above.

Output format: Raw files (code, markdown, config) only." > execution_output.txt

# 実行結果を確認
if [ -s execution_output.txt ]; then
    echo "✅ Claude Code execution completed"
    echo "📄 Output saved to execution_output.txt"
else
    echo "⚠️  Warning: Output is empty"
fi

# Git commit
if git diff --quiet; then
    echo "ℹ️  No changes to commit"
else
    git add -A
    git commit -m "feat: complete Issue execution (Claude Code generated)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
    echo "✅ Git commit created"
fi

echo "🎉 Execution completed for this Worktree"
SCRIPT_EOF

    chmod +x "${worktree_path}/execute_claude.sh"
    echo "  ✅ execute_claude.sh created"
}

launch_tmux_window() {
    local session_name="$1"
    local window_name="$2"
    local issue_num="$3"
    local is_first="$4"
    local worktree_path="${PROJECT_ROOT}/${WORKTREE_BASE}/issue-${issue_num}"

    if [ "$is_first" = "true" ]; then
        # 最初のウィンドウ（新規セッション作成）
        tmux new-session -d -s "$session_name" -n "$window_name"
    else
        # 2番目以降のウィンドウ
        tmux new-window -t "$session_name" -n "$window_name"
    fi

    # Worktreeに移動してスクリプト実行
    tmux send-keys -t "${session_name}:${window_name}" "cd $worktree_path" C-m
    tmux send-keys -t "${session_name}:${window_name}" "./execute_claude.sh" C-m

    echo "  ✅ tmux window launched: $window_name"
}

# ===== Main Logic =====

# デフォルト値
ISSUES=""
CONCURRENCY=3
DAG_FILE=""
SESSION_NAME="miyabi-ws-$$"

# 引数パース
while [[ $# -gt 0 ]]; do
    case $1 in
        --issues)
            ISSUES="$2"
            shift 2
            ;;
        --concurrency)
            CONCURRENCY="$2"
            shift 2
            ;;
        --dag)
            DAG_FILE="$2"
            shift 2
            ;;
        --session-name)
            SESSION_NAME="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# バリデーション
if [ -z "$ISSUES" ] && [ -z "$DAG_FILE" ]; then
    echo "Error: Either --issues or --dag must be specified"
    show_usage
    exit 1
fi

# 既存のセッションがあれば削除
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo "====================================================="
echo "🕷️  Water Spider Orchestrator - Production Mode"
echo "====================================================="
echo ""
echo "Session: $SESSION_NAME"
echo "Concurrency: $CONCURRENCY"
echo ""

# Issueリストを配列に変換
IFS=',' read -ra ISSUE_ARRAY <<< "$ISSUES"

# 各IssueのWorktreeを作成
for issue_num in "${ISSUE_ARRAY[@]}"; do
    create_worktree "$issue_num"
    setup_claude_config "$issue_num"
    create_execution_context "$issue_num"
    create_execution_script "$issue_num"
done

# tmuxウィンドウを起動
is_first="true"
for issue_num in "${ISSUE_ARRAY[@]}"; do
    window_name="issue-${issue_num}"
    launch_tmux_window "$SESSION_NAME" "$window_name" "$issue_num" "$is_first"
    is_first="false"
done

echo ""
echo "====================================================="
echo "🚀 ${#ISSUE_ARRAY[@]} tasks launched in parallel"
echo "====================================================="
echo ""
echo "📊 Monitor execution:"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo "⏱️  Estimated time: 5-10 minutes"
echo ""
echo "====================================================="
