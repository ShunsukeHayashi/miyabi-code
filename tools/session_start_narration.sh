#!/bin/bash
#
# Session Start Context-Aware Narration
#
# This script generates intelligent VOICEVOX narration based on:
# - Current git branch
# - Recent commits
# - Staged/unstaged changes
# - Current work context
#

set -e

VOICEVOX_ENQUEUE="${VOICEVOX_ENQUEUE:-tools/voicevox_enqueue.sh}"
SPEAKER="${VOICEVOX_SPEAKER:-3}"
SPEED="${VOICEVOX_SPEED:-1.0}"

# Helper: Generate narration based on context
generate_narration() {
    local branch=""
    local last_commit=""
    local staged_count=0
    local unstaged_count=0
    local untracked_count=0

    # Get current branch
    if branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null); then
        # Get last commit message
        last_commit=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "")

        # Get file counts
        staged_count=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
        unstaged_count=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
        untracked_count=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
    fi

    # Build contextual narration
    local narration="セッション開始なのだ！"

    # Add branch info
    if [ -n "$branch" ]; then
        # Parse branch name for context
        if [[ "$branch" == feat/* ]]; then
            local feature_name=$(echo "$branch" | sed 's/feat\///' | sed 's/-/ /g')
            narration+="現在は機能「${feature_name}」の開発中なのだ。"
        elif [[ "$branch" == fix/* ]]; then
            local fix_name=$(echo "$branch" | sed 's/fix\///' | sed 's/-/ /g')
            narration+="現在は「${fix_name}」の修正作業中なのだ。"
        elif [[ "$branch" == refactor/* ]]; then
            local refactor_name=$(echo "$branch" | sed 's/refactor\///' | sed 's/-/ /g')
            narration+="現在は「${refactor_name}」のリファクタリング中なのだ。"
        elif [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
            narration+="メインブランチで作業中なのだ。"
        else
            narration+="ブランチ「${branch}」で作業中なのだ。"
        fi
    fi

    # Add work status
    if [ "$staged_count" -gt 0 ] || [ "$unstaged_count" -gt 0 ]; then
        if [ "$staged_count" -gt 0 ]; then
            narration+="ステージング済みの変更が${staged_count}ファイルあるのだ。"
        fi
        if [ "$unstaged_count" -gt 0 ]; then
            narration+="未ステージの変更が${unstaged_count}ファイルあるのだ。"
        fi
        narration+="コミットする準備を進めるといいのだ！"
    elif [ "$untracked_count" -gt 0 ]; then
        narration+="新しいファイルが${untracked_count}個追加されているのだ。まずはこれらをレビューするのがいいのだ！"
    else
        # No changes - check last commit
        if [ -n "$last_commit" ]; then
            # Extract issue number if present
            if [[ "$last_commit" =~ \#([0-9]+) ]]; then
                local issue_num="${BASH_REMATCH[1]}"
                narration+="最後のコミットはIssue #${issue_num}の作業だったのだ。続きから作業を始めるのだ！"
            else
                # Get first 50 chars of commit message
                local commit_summary=$(echo "$last_commit" | cut -c1-50)
                narration+="最後のコミットは「${commit_summary}」だったのだ。次のタスクを確認するのがいいのだ！"
            fi
        else
            narration+="まっさらな状態なのだ。新しい作業を始めるにはちょうどいいタイミングなのだ！"
        fi
    fi

    echo "$narration"
}

# Generate and enqueue narration
NARRATION=$(generate_narration)
"$VOICEVOX_ENQUEUE" "$NARRATION" "$SPEAKER" "$SPEED"
