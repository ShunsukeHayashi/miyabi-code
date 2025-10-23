#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ズンダモンによるデモナレーション音声合成
"""

import requests
import json
import wave
import sys

VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKER_ID = 3  # ずんだもん

def synthesize_audio(text: str, output_file: str):
    """テキストを音声合成してWAVファイルに保存"""

    # 1. 音声クエリ生成
    print(f"🎤 音声クエリ生成中: {text[:30]}...")
    query_response = requests.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": text, "speaker": SPEAKER_ID}
    )
    query_response.raise_for_status()
    audio_query = query_response.json()

    # 2. 音声合成
    print(f"🎵 音声合成中...")
    synth_response = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": SPEAKER_ID},
        json=audio_query
    )
    synth_response.raise_for_status()

    # 3. WAVファイルに保存
    with open(output_file, "wb") as f:
        f.write(synth_response.content)

    print(f"✅ 音声ファイル保存: {output_file}")
    return output_file

if __name__ == "__main__":
    # ナレーション台本を読み込み
    with open("demo-narration.txt", "r", encoding="utf-8") as f:
        narration = f.read()

    # 1つの長い音声として合成
    output = "demo-narration.wav"
    synthesize_audio(narration, output)

    print("\n✅ ズンダモンナレーション完成！")
    print(f"📁 ファイル: {output}")
    print("\n再生コマンド:")
    print(f"  afplay {output}")
