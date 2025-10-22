#!/bin/bash
# シンプルVOICEVOX音声実況コマンド
# 使い方: ./say.sh "読み上げたいメッセージ"

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "使い方: ./say.sh \"読み上げたいメッセージ\""
    exit 1
fi

MESSAGE="$*"

# 設定
VOICEVOX_URL="http://localhost:50021"
SPEAKER_ID=1  # ずんだもん

echo "🎤 読み上げ: ${MESSAGE}"

# Pythonで音声生成・再生
python3 - <<EOF
import requests
import tempfile
import subprocess
import sys
from pathlib import Path

VOICEVOX_URL = "${VOICEVOX_URL}"
SPEAKER_ID = ${SPEAKER_ID}
TEXT = """${MESSAGE}"""

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

    print("✅ 再生完了", file=sys.stderr)

except Exception as e:
    print(f"❌ エラー: {e}", file=sys.stderr)
    sys.exit(1)
EOF
