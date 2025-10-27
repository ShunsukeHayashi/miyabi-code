#!/usr/bin/env bash
# ==============================================================================
# Infinity Sprint ログ監視 + VOICEVOX音声通知
# ==============================================================================
# 実行: bash .shunsuke/watch-sprint.sh
# 停止: pkill -f "watch-sprint.sh"
# ==============================================================================

set -euo pipefail

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# VOICEVOX設定
VOICEVOX_HOST="${VOICEVOX_HOST:-http://localhost:50021}"
SPEAKER_ID="${VOICEVOX_SPEAKER:-3}"  # 3=ずんだもん
VOICE_QUEUE_DIR="/tmp/miyabi-voicevox-queue"

# VOICEVOX音声再生関数
voicevox_speak() {
    local text="$1"
    local speaker="${2:-$SPEAKER_ID}"
    local speed="${3:-1.0}"

    echo -e "${PURPLE}🎤 [VoiceVox]${NC} $text"

    # 音声クエリ取得
    local audio_query
    audio_query=$(curl -s -X POST \
        "${VOICEVOX_HOST}/audio_query?text=${text}&speaker=${speaker}" \
        -H "Content-Type: application/json")

    if [[ -z "$audio_query" ]]; then
        echo -e "${RED}❌ 音声クエリ取得失敗${NC}"
        return 1
    fi

    # 速度調整
    audio_query=$(echo "$audio_query" | jq ".speedScale = $speed")

    # 音声合成
    local audio_file="/tmp/miyabi-voicevox-$$.wav"
    curl -s -X POST \
        "${VOICEVOX_HOST}/synthesis?speaker=${speaker}" \
        -H "Content-Type: application/json" \
        -d "$audio_query" \
        -o "$audio_file"

    # 再生
    if [[ -f "$audio_file" ]]; then
        afplay "$audio_file" 2>/dev/null || \
        play "$audio_file" 2>/dev/null || \
        aplay "$audio_file" 2>/dev/null || \
        echo -e "${YELLOW}⚠️  音声ファイル再生コマンドが見つかりません${NC}"

        rm -f "$audio_file"
    fi
}

# VOICEVOX Engine接続確認
echo -e "${CYAN}🔊 VOICEVOX Engine接続確認中...${NC}"
if ! curl -s "${VOICEVOX_HOST}/version" > /dev/null; then
    echo -e "${RED}❌ VOICEVOX Engineに接続できません${NC}"
    echo -e "${YELLOW}💡 VOICEVOX Engineを起動してください:${NC}"
    echo "   docker run -d --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest"
    exit 1
fi

VOICEVOX_VERSION=$(curl -s "${VOICEVOX_HOST}/version")
echo -e "${GREEN}✅ VOICEVOX Engine v${VOICEVOX_VERSION} 接続確認${NC}"
echo ""

# 最新のログファイルを取得
LOG_FILE=$(ls -t .ai/logs/infinity-sprint-*.md 2>/dev/null | head -n 1 || echo "")

if [[ -z "$LOG_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Infinity Sprintログファイルが見つかりません${NC}"
    echo -e "${CYAN}💡 Infinity Modeを起動してください:${NC}"
    echo "   miyabi infinity"
    echo ""
    echo -e "${BLUE}📊 ログファイルが作成されるまで待機中...${NC}"

    # ログファイルが作成されるまで待機
    while [[ -z "$LOG_FILE" ]]; do
        sleep 2
        LOG_FILE=$(ls -t .ai/logs/infinity-sprint-*.md 2>/dev/null | head -n 1 || echo "")
    done

    echo -e "${GREEN}✅ ログファイル検出: $LOG_FILE${NC}"
    voicevox_speak "ログファイルを見つけたのだ！監視を開始するのだ！" "$SPEAKER_ID" 1.2
fi

echo -e "${GREEN}📊 監視開始: $LOG_FILE${NC}"
echo -e "${PURPLE}🔊 VoiceVox音声通知: 有効${NC}"
echo -e "${CYAN}👤 話者: $(curl -s ${VOICEVOX_HOST}/speakers | jq -r ".[] | select(.styles[0].id == $SPEAKER_ID) | .name")${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 初回メッセージ
voicevox_speak "Infinity Sprintの監視を開始するのだ！" "$SPEAKER_ID" 1.2

# ログファイルを監視
tail -f "$LOG_FILE" | while read -r line; do
    # Sprint N を検知
    if [[ "$line" =~ Sprint\ [0-9]+ ]]; then
        echo -e "${BLUE}🚀 $line${NC}"
        voicevox_speak "新しいスプリントが始まるのだ！頑張るのだ！" "$SPEAKER_ID" 1.2
    fi

    # Success を検知
    if [[ "$line" == *": Success"* ]] || [[ "$line" == *"✅"* ]]; then
        echo -e "${GREEN}✅ $line${NC}"
        voicevox_speak "やったのだ！タスクが成功したのだ！" "$SPEAKER_ID" 1.3
    fi

    # Failed を検知
    if [[ "$line" == *": Failed"* ]] || [[ "$line" == *"❌"* ]]; then
        echo -e "${RED}❌ $line${NC}"
        voicevox_speak "失敗したのだ！でも諦めないのだ！次頑張るのだ！" "$SPEAKER_ID" 1.0
    fi

    # All tasks completed を検知
    if [[ "$line" == *"All tasks completed"* ]] || [[ "$line" == *"全タスク完了"* ]]; then
        echo -e "${GREEN}🎉 $line${NC}"
        voicevox_speak "全部終わったのだ！お疲れ様なのだ！すごいのだ！" "$SPEAKER_ID" 1.4
    fi

    # Issue processed を検知
    if [[ "$line" =~ Issue\ #[0-9]+ ]]; then
        echo -e "${CYAN}📋 $line${NC}"
        if [[ "$line" == *"完了"* ]] || [[ "$line" == *"completed"* ]]; then
            voicevox_speak "Issueが1つ完了したのだ！" "$SPEAKER_ID" 1.2
        fi
    fi

    # Error を検知
    if [[ "$line" == *"Error"* ]] || [[ "$line" == *"エラー"* ]]; then
        echo -e "${RED}⚠️  $line${NC}"
        voicevox_speak "エラーが発生したのだ！確認するのだ！" "$SPEAKER_ID" 1.0
    fi
done
