#!/usr/bin/env python3
"""
ローカルVOICEVOX音声テスト
Discord不要、ローカル再生のみ
"""

import requests
import tempfile
import subprocess
import sys
from pathlib import Path

# 設定
VOICEVOX_URL = "http://localhost:50021"
SPEAKER_ID = 1  # ずんだもん
TEXT = "こんにちは、ほのかです！音声テスト実行中！"

print("🎤 ローカルVOICEVOX音声テスト開始...")
print(f"📝 テキスト: {TEXT}")
print(f"🎵 スピーカーID: {SPEAKER_ID}")
print()

try:
    # ステップ1: オーディオクエリ生成
    print("🔄 VOICEVOX APIへリクエスト中...")
    audio_query_response = requests.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": TEXT, "speaker": SPEAKER_ID},
        timeout=10
    )
    audio_query_response.raise_for_status()
    audio_query = audio_query_response.json()
    print(f"✅ オーディオクエリ生成完了 ({len(audio_query_response.content)} bytes)")

    # ステップ2: 音声合成
    print("🔄 音声合成中...")
    synthesis_response = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": SPEAKER_ID},
        json=audio_query,
        timeout=30
    )
    synthesis_response.raise_for_status()
    print(f"✅ 音声合成完了 ({len(synthesis_response.content)} bytes)")

    # ステップ3: 一時ファイルに保存
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
        temp_file.write(synthesis_response.content)
        temp_path = temp_file.name

    print(f"💾 音声ファイル保存: {temp_path}")

    # ステップ4: ローカル再生（macOS afplay）
    print()
    print("🔊 ローカル再生開始...")
    result = subprocess.run(['afplay', temp_path], check=True)

    print("✅ 再生完了！")

    # クリーンアップ
    Path(temp_path).unlink(missing_ok=True)
    print("🧹 一時ファイル削除完了")

    print()
    print("🎉 テスト成功！VOICEVOXからローカル音声出力が動作しています。")
    print()
    print("✅ 確認完了:")
    print("   - VOICEVOX API: 正常動作")
    print("   - 音声合成: 正常動作")
    print("   - ローカル再生: 正常動作")

except requests.exceptions.RequestException as e:
    print(f"❌ VOICEVOX APIエラー: {e}")
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print(f"❌ 再生エラー: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ エラー: {e}")
    sys.exit(1)
