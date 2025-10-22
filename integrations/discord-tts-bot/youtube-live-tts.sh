#!/bin/bash
# YouTube LIVE実況モード - VOICEVOX自動読み上げ
# Webhookメッセージを監視して自動的に音声再生

set -euo pipefail

# 設定
VOICEVOX_URL="http://localhost:50021"
SPEAKER_ID=1  # ずんだもん（かわいい声）
CHECK_INTERVAL=5  # 5秒ごとにチェック

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎬 YouTube LIVE 実況モード 起動！${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📢 VOICEVOX音声実況システム${NC}"
echo -e "${GREEN}✨ かわいい声で作業を実況します！${NC}"
echo ""
echo -e "${BLUE}🎤 スピーカー: ずんだもん (ID: ${SPEAKER_ID})${NC}"
echo -e "${BLUE}⏱️  チェック間隔: ${CHECK_INTERVAL}秒${NC}"
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# VOICEVOX起動確認
echo -e "${CYAN}🔍 VOICEVOX Engine 起動確認中...${NC}"
if curl -s "${VOICEVOX_URL}/speakers" > /dev/null; then
    echo -e "${GREEN}✅ VOICEVOX Engine 起動確認完了！${NC}"
else
    echo -e "${RED}❌ エラー: VOICEVOX Engineが起動していません${NC}"
    echo -e "${YELLOW}💡 VOICEVOXアプリを起動してください${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 YouTube LIVE実況モード 準備完了！${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📖 使い方:${NC}"
echo -e "${YELLOW}  1. 別のターミナルで作業通知を送信:${NC}"
echo -e "     ${GREEN}./scripts/discord-notify.sh \"作業メッセージ\"${NC}"
echo ""
echo -e "${YELLOW}  2. このスクリプトがWebhookメッセージを検出${NC}"
echo -e "${YELLOW}  3. 自動的にVOICEVOXで音声再生${NC}"
echo -e "${YELLOW}  4. YouTube LIVE配信にその音声が流れる${NC}"
echo ""
echo -e "${YELLOW}🛑 停止: Ctrl+C${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# TTS実行関数
play_tts() {
    local text="$1"

    echo -e "${CYAN}🎤 読み上げ開始: ${text:0:50}...${NC}"

    # Pythonスクリプトで音声生成・再生
    python3 - <<EOF
import requests
import tempfile
import subprocess
from pathlib import Path

VOICEVOX_URL = "${VOICEVOX_URL}"
SPEAKER_ID = ${SPEAKER_ID}
TEXT = "${text}"

try:
    # オーディオクエリ
    audio_query_response = requests.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": TEXT, "speaker": SPEAKER_ID},
        timeout=10
    )
    audio_query_response.raise_for_status()
    audio_query = audio_query_response.json()

    # 音声合成
    synthesis_response = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": SPEAKER_ID},
        json=audio_query,
        timeout=30
    )
    synthesis_response.raise_for_status()

    # 一時ファイルに保存
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
        temp_file.write(synthesis_response.content)
        temp_path = temp_file.name

    # ローカル再生
    subprocess.run(['afplay', temp_path], check=True, capture_output=True)

    # クリーンアップ
    Path(temp_path).unlink(missing_ok=True)

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    exit(1)
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 再生完了${NC}"
    else
        echo -e "${RED}❌ 再生エラー${NC}"
    fi
}

# メインループ - 手動トリガー待機モード
echo -e "${YELLOW}🎯 手動トリガーモード起動${NC}"
echo -e "${CYAN}メッセージを入力してEnterを押すと読み上げます:${NC}"
echo ""

while true; do
    # ユーザー入力待機
    read -p "📝 メッセージ: " MESSAGE

    if [ -z "$MESSAGE" ]; then
        continue
    fi

    # 特殊コマンド
    if [ "$MESSAGE" = "quit" ] || [ "$MESSAGE" = "exit" ]; then
        echo -e "${YELLOW}👋 YouTube LIVE実況モード終了${NC}"
        break
    fi

    # TTS実行
    echo ""
    play_tts "$MESSAGE"
    echo ""
done
