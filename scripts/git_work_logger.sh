#!/bin/bash
# ============================================
# Miyabi Git Work Logger
# 作業宣言・完了ログ自動収集
# ============================================

# ログファイルパス
LOG_DIR="$HOME/Dev/01-miyabi/_core/miyabi-private/.ai/logs"
WORK_LOG="$LOG_DIR/git-work-log.md"
DAILY_LOG="$LOG_DIR/daily-$(date +%Y-%m-%d).md"

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# タイムスタンプ取得
get_timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# 現在のブランチ取得
get_current_branch() {
    git branch --show-current 2>/dev/null || echo "unknown"
}

# 作業宣言ログ (git checkout時)
log_work_start() {
    local branch="$1"
    local timestamp=$(get_timestamp)
    local entry="## 🚀 作業開始: $branch

**時刻**: $timestamp
**ブランチ**: $branch
**作業者**: $(git config user.name)

---
"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"

    # 通知 (オプション)
    osascript -e "display notification \"作業開始: $branch\" with title \"Miyabi Git Logger\"" 2>/dev/null || true
}

# コミットログ
log_commit() {
    local message="$1"
    local timestamp=$(get_timestamp)
    local branch=$(get_current_branch)
    local commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    local entry="### ✅ コミット完了

**時刻**: $timestamp
**ブランチ**: $branch
**コミット**: $commit_hash
**メッセージ**: $message

"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"
}

# プッシュログ
log_push() {
    local timestamp=$(get_timestamp)
    local branch=$(get_current_branch)
    local remote=$(git remote get-url origin 2>/dev/null || echo "unknown")

    local entry="### 📤 プッシュ完了

**時刻**: $timestamp
**ブランチ**: $branch
**リモート**: $remote

"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"

    # 通知
    osascript -e "display notification \"プッシュ完了: $branch\" with title \"Miyabi Git Logger\"" 2>/dev/null || true
}

# マージログ
log_merge() {
    local source_branch="$1"
    local timestamp=$(get_timestamp)
    local target_branch=$(get_current_branch)

    local entry="### 🔀 マージ完了

**時刻**: $timestamp
**マージ元**: $source_branch
**マージ先**: $target_branch

"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"
}

# PR作成ログ
log_pr_create() {
    local pr_title="$1"
    local timestamp=$(get_timestamp)
    local branch=$(get_current_branch)

    local entry="### 🔃 PR作成

**時刻**: $timestamp
**ブランチ**: $branch
**タイトル**: $pr_title

"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"
}

# 作業完了宣言
log_work_complete() {
    local summary="$1"
    local timestamp=$(get_timestamp)
    local branch=$(get_current_branch)

    # 今日のコミット数
    local commit_count=$(git log --oneline --since="00:00" | wc -l | tr -d ' ')

    local entry="## 🎉 作業完了: $branch

**時刻**: $timestamp
**ブランチ**: $branch
**本日のコミット数**: $commit_count
**サマリー**: $summary

---
"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"

    # 通知
    osascript -e "display notification \"作業完了: $branch\" with title \"Miyabi Git Logger\"" 2>/dev/null || true
}

# 日次サマリー生成
generate_daily_summary() {
    local timestamp=$(get_timestamp)
    local today=$(date +%Y-%m-%d)

    # 今日のコミット一覧
    local commits=$(git log --oneline --since="00:00" --format="- %h %s")
    local commit_count=$(echo "$commits" | wc -l | tr -d ' ')

    local entry="# 📊 日次サマリー: $today

**生成時刻**: $timestamp
**総コミット数**: $commit_count

## コミット一覧

$commits

---
"
    echo "$entry" >> "$DAILY_LOG"
    echo "$entry"
}

# Worktree作成ログ (Miyabi Protocol準拠)
log_worktree_create() {
    local issue_number="$1"
    local timestamp=$(get_timestamp)
    local worktree_path=".worktrees/issue-$issue_number"
    local branch_name="worktree/issue-$issue_number"

    local entry="## 🌳 Worktree作成: Issue #$issue_number

**時刻**: $timestamp
**パス**: $worktree_path
**ブランチ**: $branch_name
**作業者**: $(git config user.name)

### コマンド
\`\`\`bash
git worktree add $worktree_path -b $branch_name
\`\`\`

---
"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"

    # 通知
    osascript -e "display notification \"Worktree作成: Issue #$issue_number\" with title \"Miyabi Worktree\"" 2>/dev/null || true
}

# Worktree削除ログ
log_worktree_remove() {
    local issue_number="$1"
    local timestamp=$(get_timestamp)

    local entry="### 🗑️ Worktree削除: Issue #$issue_number

**時刻**: $timestamp
**パス**: .worktrees/issue-$issue_number

"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"
}

# Worktreeマージログ
log_worktree_merge() {
    local issue_number="$1"
    local timestamp=$(get_timestamp)
    local branch_name="worktree/issue-$issue_number"

    local entry="### 🔀 Worktreeマージ: Issue #$issue_number

**時刻**: $timestamp
**ブランチ**: $branch_name → main
**コミット**: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')

"
    echo "$entry" >> "$WORK_LOG"
    echo "$entry" >> "$DAILY_LOG"

    # 通知
    osascript -e "display notification \"Worktreeマージ完了: Issue #$issue_number\" with title \"Miyabi Worktree\"" 2>/dev/null || true
}

# ツール呼び出し検出用
detect_git_operation() {
    local tool_name="$1"
    local tool_input="$2"

    case "$tool_name" in
        "Bash")
            # Worktree操作を検出 (Miyabi Protocol)
            if echo "$tool_input" | grep -q "git worktree add"; then
                local issue_num=$(echo "$tool_input" | grep -oE "issue-([0-9]+)" | head -1 | sed 's/issue-//')
                if [ -n "$issue_num" ]; then
                    log_worktree_create "$issue_num"
                fi
            elif echo "$tool_input" | grep -q "git worktree remove"; then
                local issue_num=$(echo "$tool_input" | grep -oE "issue-([0-9]+)" | head -1 | sed 's/issue-//')
                if [ -n "$issue_num" ]; then
                    log_worktree_remove "$issue_num"
                fi
            # gitコマンドを検出
            elif echo "$tool_input" | grep -q "git checkout"; then
                local branch=$(echo "$tool_input" | grep -oE "git checkout[[:space:]]+(-b[[:space:]]+)?([^[:space:]]+)" | awk '{print $NF}')
                log_work_start "$branch"
            elif echo "$tool_input" | grep -q "git commit"; then
                local message=$(echo "$tool_input" | grep -oE '\-m[[:space:]]+"[^"]+"' | sed 's/-m[[:space:]]*"//' | sed 's/"$//')
                log_commit "$message"
            elif echo "$tool_input" | grep -q "git push"; then
                log_push
            elif echo "$tool_input" | grep -q "git merge worktree/issue"; then
                local issue_num=$(echo "$tool_input" | grep -oE "issue-([0-9]+)" | head -1 | sed 's/issue-//')
                if [ -n "$issue_num" ]; then
                    log_worktree_merge "$issue_num"
                fi
            elif echo "$tool_input" | grep -q "git merge"; then
                local source=$(echo "$tool_input" | grep -oE "git merge[[:space:]]+([^[:space:]]+)" | awk '{print $3}')
                log_merge "$source"
            elif echo "$tool_input" | grep -q "gh pr create"; then
                local title=$(echo "$tool_input" | grep -oE '\-\-title[[:space:]]+"[^"]+"' | sed 's/--title[[:space:]]*"//' | sed 's/"$//')
                log_pr_create "$title"
            fi
            ;;
    esac
}

# メイン処理
case "$1" in
    "start")
        log_work_start "$2"
        ;;
    "commit")
        log_commit "$2"
        ;;
    "push")
        log_push
        ;;
    "merge")
        log_merge "$2"
        ;;
    "pr")
        log_pr_create "$2"
        ;;
    "complete")
        log_work_complete "$2"
        ;;
    "summary")
        generate_daily_summary
        ;;
    "detect")
        detect_git_operation "$2" "$3"
        ;;
    "worktree-create")
        log_worktree_create "$2"
        ;;
    "worktree-remove")
        log_worktree_remove "$2"
        ;;
    "worktree-merge")
        log_worktree_merge "$2"
        ;;
    *)
        echo "Usage: $0 {start|commit|push|merge|pr|complete|summary|detect}"
        echo "       $0 {worktree-create|worktree-remove|worktree-merge} <issue_number>"
        exit 1
        ;;
esac
