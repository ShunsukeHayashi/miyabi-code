#!/bin/bash
# ============================================
# VOICEVOX ナレーター - Claude Code アクション解説
# 各ツール実行後に、やさしく解説を読み上げ
# ============================================

# VOICEVOX設定
VOICEVOX_HOST="${VOICEVOX_HOST:-localhost}"
VOICEVOX_PORT="${VOICEVOX_PORT:-50021}"
SPEAKER_ID="${VOICEVOX_SPEAKER:-1}"  # ずんだもん

# 読み上げモード確認 (デフォルトON)
NARRATE_MODE="${MIYABI_NARRATE_MODE:-on}"

# 無効なら終了
if [ "$NARRATE_MODE" != "on" ]; then
    exit 0
fi

# 引数取得
TOOL_NAME="$1"
TOOL_INPUT="$2"
TOOL_OUTPUT="$3"

# ツール名を日本語に変換
get_tool_name_jp() {
    case "$1" in
        "Read") echo "ファイル読み込み" ;;
        "Write") echo "ファイル書き込み" ;;
        "Edit") echo "ファイル編集" ;;
        "Bash") echo "コマンド実行" ;;
        "Grep") echo "検索" ;;
        "Glob") echo "ファイル探索" ;;
        "Task") echo "エージェント起動" ;;
        "WebFetch") echo "ウェブ取得" ;;
        "WebSearch") echo "ウェブ検索" ;;
        "TodoWrite") echo "タスク更新" ;;
        *) echo "$1" ;;
    esac
}

# 解説テキスト生成
generate_narration() {
    local tool="$1"
    local input="$2"
    local output="$3"

    case "$tool" in
        "Read")
            # ファイルパスを抽出
            local file=$(echo "$input" | jq -r '.file_path // empty' 2>/dev/null | xargs basename 2>/dev/null)
            if [ -n "$file" ]; then
                echo "ファイル${file}を読み込みました"
            else
                echo "ファイルを読み込みました"
            fi
            ;;
        "Write")
            local file=$(echo "$input" | jq -r '.file_path // empty' 2>/dev/null | xargs basename 2>/dev/null)
            if [ -n "$file" ]; then
                echo "ファイル${file}を作成しました"
            else
                echo "ファイルを作成しました"
            fi
            ;;
        "Edit")
            local file=$(echo "$input" | jq -r '.file_path // empty' 2>/dev/null | xargs basename 2>/dev/null)
            if [ -n "$file" ]; then
                echo "ファイル${file}を編集しました"
            else
                echo "ファイルを編集しました"
            fi
            ;;
        "Bash")
            # コマンドを抽出
            local cmd=$(echo "$input" | jq -r '.command // empty' 2>/dev/null | cut -c1-30)
            if echo "$cmd" | grep -q "git"; then
                echo "ギットコマンドを実行しました"
            elif echo "$cmd" | grep -q "cargo"; then
                echo "カーゴコマンドを実行しました"
            elif echo "$cmd" | grep -q "npm\|yarn"; then
                echo "ノードコマンドを実行しました"
            else
                echo "コマンドを実行しました"
            fi
            ;;
        "Grep")
            local pattern=$(echo "$input" | jq -r '.pattern // empty' 2>/dev/null)
            if [ -n "$pattern" ]; then
                echo "パターン${pattern}を検索しました"
            else
                echo "コード検索を実行しました"
            fi
            ;;
        "Glob")
            echo "ファイルパターン検索を実行しました"
            ;;
        "Task")
            local agent=$(echo "$input" | jq -r '.subagent_type // empty' 2>/dev/null)
            if [ -n "$agent" ]; then
                echo "${agent}エージェントを起動しました"
            else
                echo "サブエージェントを起動しました"
            fi
            ;;
        "WebFetch")
            echo "ウェブページを取得しました"
            ;;
        "WebSearch")
            local query=$(echo "$input" | jq -r '.query // empty' 2>/dev/null)
            if [ -n "$query" ]; then
                echo "${query}を検索しました"
            else
                echo "ウェブ検索を実行しました"
            fi
            ;;
        "TodoWrite")
            local count=$(echo "$input" | jq -r '.todos | length // 0' 2>/dev/null)
            if [ "$count" -gt 0 ]; then
                echo "タスクリストを${count}件に更新しました"
            else
                echo "タスクリストを更新しました"
            fi
            ;;
        *)
            echo "$(get_tool_name_jp "$tool")が完了しました"
            ;;
    esac
}

# VOICEVOXで読み上げ
speak_with_voicevox() {
    local text="$1"

    # VOICEVOX Engine確認
    if ! curl -s "http://${VOICEVOX_HOST}:${VOICEVOX_PORT}/version" > /dev/null 2>&1; then
        # VOICEVOXが起動していない場合はmacOS sayを使用
        if command -v say &> /dev/null; then
            say -v "Kyoko" "$text" &
        fi
        return
    fi

    # 音声合成クエリ作成
    local query=$(curl -s -X POST \
        "http://${VOICEVOX_HOST}:${VOICEVOX_PORT}/audio_query?text=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$text'))")&speaker=${SPEAKER_ID}" \
        -H "Content-Type: application/json")

    if [ -z "$query" ]; then
        return
    fi

    # 音声合成
    curl -s -X POST \
        "http://${VOICEVOX_HOST}:${VOICEVOX_PORT}/synthesis?speaker=${SPEAKER_ID}" \
        -H "Content-Type: application/json" \
        -d "$query" \
        -o /tmp/voicevox_output.wav

    # 再生
    if [ -f /tmp/voicevox_output.wav ]; then
        if command -v afplay &> /dev/null; then
            afplay /tmp/voicevox_output.wav &
        elif command -v aplay &> /dev/null; then
            aplay /tmp/voicevox_output.wav &
        fi
    fi
}

# メイン処理
main() {
    # 解説テキスト生成
    local narration=$(generate_narration "$TOOL_NAME" "$TOOL_INPUT" "$TOOL_OUTPUT")

    # 読み上げ
    speak_with_voicevox "$narration" &
}

main "$@"
