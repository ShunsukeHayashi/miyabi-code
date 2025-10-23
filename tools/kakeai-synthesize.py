#!/usr/bin/env python3
"""
Water Spider Orchestrator - 霊夢×魔理沙 掛け合い音声生成
"""

import requests
import json
import time
import os
from pathlib import Path
import re

# VOICEVOX Engine URL
VOICEVOX_URL = "http://localhost:50021"

# キャラクターID
REIMU_SPEAKER_ID = 0   # 霊夢
MARISA_SPEAKER_ID = 10  # 魔理沙

# 出力ディレクトリ
OUTPUT_DIR = Path("./output/water-spider-kakeai")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def synthesize_speech(text, speaker_id, output_path):
    """音声合成を実行"""
    try:
        # 音声クエリ作成
        query_response = requests.post(
            f"{VOICEVOX_URL}/audio_query",
            params={"text": text, "speaker": speaker_id},
            timeout=10
        )

        if query_response.status_code != 200:
            print(f"❌ Error: audio_query failed - {query_response.status_code}")
            return False

        query_data = query_response.json()

        # 音声合成
        synthesis_response = requests.post(
            f"{VOICEVOX_URL}/synthesis",
            params={"speaker": speaker_id},
            json=query_data,
            timeout=30
        )

        if synthesis_response.status_code != 200:
            print(f"❌ Error: synthesis failed - {synthesis_response.status_code}")
            return False

        # WAV保存
        with open(output_path, "wb") as f:
            f.write(synthesis_response.content)

        return True
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def parse_dialogue(script_path):
    """台本をパースして発話リストを作成"""
    with open(script_path, "r", encoding="utf-8") as f:
        content = f.read()

    dialogues = []

    # 【霊夢】または【魔理沙】で分割
    pattern = r'【(霊夢|魔理沙)】(.+?)(?=【|$)'
    matches = re.findall(pattern, content, re.DOTALL)

    for speaker, text in matches:
        text = text.strip()
        if text and not text.startswith("#"):
            speaker_id = REIMU_SPEAKER_ID if speaker == "霊夢" else MARISA_SPEAKER_ID
            dialogues.append({
                "speaker": speaker,
                "speaker_id": speaker_id,
                "text": text
            })

    return dialogues

def main():
    print("=" * 60)
    print("🎤 Water Spider - 霊夢×魔理沙 掛け合い音声生成")
    print("=" * 60)
    print()

    # 台本読み込み
    script_path = Path("./water-spider-kakeai.txt")

    if not script_path.exists():
        print(f"❌ Error: {script_path} が見つかりません")
        return 1

    # VOICEVOX Engine接続確認
    try:
        response = requests.get(f"{VOICEVOX_URL}/version", timeout=5)
        version = response.text.strip('"')
        print(f"✅ VOICEVOX Engine: バージョン {version}")
        print()
    except Exception as e:
        print(f"❌ Error: VOICEVOX Engineに接続できません - {e}")
        return 1

    # 台本パース
    print("📝 台本をパース中...")
    dialogues = parse_dialogue(script_path)
    print(f"✅ {len(dialogues)}件の発話を検出しました")
    print()

    # 音声合成開始
    print("🎬 音声合成開始...")
    print(f"🎤 {len(dialogues)}件の音声合成を開始します")
    print("=" * 60)
    print()

    success_count = 0

    for i, dialogue in enumerate(dialogues):
        speaker = dialogue["speaker"]
        speaker_id = dialogue["speaker_id"]
        text = dialogue["text"]

        # 長い発話は分割（140文字ごと）
        max_length = 140
        if len(text) > max_length:
            # 句読点で分割
            sentences = re.split(r'([。！？])', text)
            chunks = []
            current_chunk = ""

            for j in range(0, len(sentences), 2):
                sentence = sentences[j] + (sentences[j+1] if j+1 < len(sentences) else "")

                if len(current_chunk) + len(sentence) > max_length and current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = sentence
                else:
                    current_chunk += sentence

            if current_chunk:
                chunks.append(current_chunk)

            # 各チャンクを合成
            for j, chunk in enumerate(chunks):
                output_path = OUTPUT_DIR / f"dialogue_{i:03d}_{j:03d}_{speaker}.wav"

                print(f"[{i+1}-{j+1}/{len(dialogues)}] {speaker}: {chunk[:40]}..." if len(chunk) > 40 else f"[{i+1}-{j+1}/{len(dialogues)}] {speaker}: {chunk}")

                if synthesize_speech(chunk, speaker_id, output_path):
                    print(f"   ✅ 保存: {output_path.name}")
                    success_count += 1
                else:
                    print(f"   ❌ 失敗")

                print()
                time.sleep(0.3)  # API負荷軽減
        else:
            output_path = OUTPUT_DIR / f"dialogue_{i:03d}_{speaker}.wav"

            print(f"[{i+1}/{len(dialogues)}] {speaker}: {text[:40]}..." if len(text) > 40 else f"[{i+1}/{len(dialogues)}] {speaker}: {text}")

            if synthesize_speech(text, speaker_id, output_path):
                print(f"   ✅ 保存: {output_path.name}")
                success_count += 1
            else:
                print(f"   ❌ 失敗")

            print()
            time.sleep(0.3)

    print("=" * 60)
    print(f"✅ 完了！{success_count}件の音声ファイルを生成しました")
    print(f"📁 出力ディレクトリ: {OUTPUT_DIR.absolute()}")
    print()
    print("📝 次のステップ:")
    print(f"1. 音声を確認: afplay {OUTPUT_DIR}/dialogue_000_霊夢.wav")
    print("2. 全音声を順番に再生: for f in output/water-spider-kakeai/*.wav; do afplay \"$f\"; done")
    print("3. 音声を結合: ffmpeg -f concat -i filelist.txt -c copy output.wav")
    print("=" * 60)

    return 0

if __name__ == "__main__":
    exit(main())
