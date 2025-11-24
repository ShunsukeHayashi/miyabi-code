#!/bin/bash
# ============================================
# Claude Code Session Search Tool
# セッション検索・パス指定ツール
# ============================================

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CLAUDE_PROJECTS="$HOME/.claude/projects"

# ヘルプ表示
show_help() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   🔍 Claude Session Search Tool                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "使い方:"
    echo "  $0 [options] [search-term]"
    echo ""
    echo "オプション:"
    echo "  -l, --list       全セッション一覧"
    echo "  -p, --project    プロジェクト指定 (パス検索)"
    echo "  -r, --resume     セッション再開"
    echo "  -s, --sync       リモートからセッション同期"
    echo "  -h, --help       ヘルプ表示"
    echo ""
    echo "例:"
    echo "  $0 --list                    # 全セッション表示"
    echo "  $0 --project miyabi          # miyabiプロジェクトのセッション"
    echo "  $0 --resume abc123           # セッションID指定で再開"
    echo "  $0 priority                  # 'priority'を含むセッション検索"
}

# プロジェクト一覧
list_projects() {
    echo -e "${GREEN}📁 利用可能なプロジェクト:${NC}"
    echo ""
    for dir in "$CLAUDE_PROJECTS"/*/; do
        if [ -d "$dir" ]; then
            project_name=$(basename "$dir")
            session_count=$(ls -1 "$dir"*.jsonl 2>/dev/null | wc -l | tr -d ' ')
            # デコード
            decoded=$(echo "$project_name" | sed 's/-/\//g')
            echo -e "  ${BLUE}$decoded${NC} ($session_count sessions)"
        fi
    done
}

# セッション一覧
list_sessions() {
    local project_filter="$1"

    echo -e "${GREEN}📋 セッション一覧:${NC}"
    echo ""

    for dir in "$CLAUDE_PROJECTS"/*/; do
        if [ -d "$dir" ]; then
            project_name=$(basename "$dir")

            # プロジェクトフィルタ
            if [ -n "$project_filter" ]; then
                if ! echo "$project_name" | grep -qi "$project_filter"; then
                    continue
                fi
            fi

            decoded=$(echo "$project_name" | sed 's/-/\//g')
            echo -e "${CYAN}$decoded${NC}"

            for session in "$dir"*.jsonl; do
                if [ -f "$session" ]; then
                    session_id=$(basename "$session" .jsonl)
                    modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$session" 2>/dev/null || stat -c "%y" "$session" 2>/dev/null | cut -d'.' -f1)
                    size=$(du -h "$session" | cut -f1)

                    # 最初のメッセージを取得
                    first_msg=$(head -1 "$session" 2>/dev/null | jq -r '.message.content[0].text // .content // "No content"' 2>/dev/null | head -c 50)

                    echo -e "  ${YELLOW}$session_id${NC}"
                    echo -e "    📅 $modified | 📦 $size"
                    if [ -n "$first_msg" ] && [ "$first_msg" != "No content" ]; then
                        echo -e "    📝 ${first_msg}..."
                    fi
                fi
            done
            echo ""
        fi
    done
}

# セッション検索
search_sessions() {
    local term="$1"

    echo -e "${GREEN}🔍 検索: '$term'${NC}"
    echo ""

    for session in "$CLAUDE_PROJECTS"/*/*.jsonl; do
        if [ -f "$session" ]; then
            if grep -l "$term" "$session" >/dev/null 2>&1; then
                session_id=$(basename "$session" .jsonl)
                project_dir=$(dirname "$session")
                project_name=$(basename "$project_dir")
                decoded=$(echo "$project_name" | sed 's/-/\//g')

                echo -e "${CYAN}$decoded${NC}"
                echo -e "  ${YELLOW}$session_id${NC}"

                # マッチした行数
                match_count=$(grep -c "$term" "$session" 2>/dev/null || echo 0)
                echo -e "    マッチ: $match_count 件"
                echo ""
            fi
        fi
    done
}

# セッション再開
resume_session() {
    local session_id="$1"

    if [ -z "$session_id" ]; then
        echo -e "${YELLOW}セッションIDを指定してください${NC}"
        echo ""
        echo "使用可能なセッション:"
        list_sessions
        return 1
    fi

    # セッションファイルを検索
    session_file=$(find "$CLAUDE_PROJECTS" -name "${session_id}.jsonl" -type f 2>/dev/null | head -1)

    if [ -z "$session_file" ]; then
        echo -e "${RED}❌ セッションが見つかりません: $session_id${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ セッション再開: $session_id${NC}"
    exec claude --resume "$session_id"
}

# リモート同期
sync_from_remote() {
    local remote="$1"
    local session_id="$2"

    echo -e "${CYAN}🔄 リモートからセッション同期...${NC}"

    if [ -z "$remote" ]; then
        echo "リモートを指定してください (例: mugen, majin)"
        return 1
    fi

    # リモートのセッションディレクトリを取得
    remote_dir=$(ssh "$remote" "ls -d ~/.claude/projects/*miyabi* 2>/dev/null | head -1")

    if [ -z "$remote_dir" ]; then
        echo -e "${RED}❌ リモートにセッションが見つかりません${NC}"
        return 1
    fi

    # ローカルディレクトリ作成
    local_project_dir="$CLAUDE_PROJECTS/$(basename "$remote_dir")"
    mkdir -p "$local_project_dir"

    if [ -n "$session_id" ]; then
        # 特定のセッションのみ同期
        scp "$remote:$remote_dir/${session_id}.jsonl" "$local_project_dir/"
        echo -e "${GREEN}✅ セッション同期完了: $session_id${NC}"
    else
        # 最新のセッションを同期
        latest=$(ssh "$remote" "ls -t $remote_dir/*.jsonl | head -1")
        scp "$remote:$latest" "$local_project_dir/"
        echo -e "${GREEN}✅ 最新セッション同期完了${NC}"
    fi
}

# メイン処理
main() {
    case "$1" in
        -l|--list)
            list_sessions "$2"
            ;;
        -p|--project)
            if [ -z "$2" ]; then
                list_projects
            else
                list_sessions "$2"
            fi
            ;;
        -r|--resume)
            resume_session "$2"
            ;;
        -s|--sync)
            sync_from_remote "$2" "$3"
            ;;
        -h|--help)
            show_help
            ;;
        "")
            show_help
            ;;
        *)
            search_sessions "$1"
            ;;
    esac
}

main "$@"
