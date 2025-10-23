#!/usr/bin/env python3
"""
Water Spider Orchestrator - ずんだもん解説音声生成
"""

import requests
import json
import time
import os
from pathlib import Path

# VOICEVOX Engine URL
VOICEVOX_URL = "http://localhost:50021"

# ずんだもんのキャラクターID
ZUNDAMON_SPEAKER_ID = 3

# 出力ディレクトリ
OUTPUT_DIR = Path("./output/water-spider")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def synthesize_speech(text, speaker_id, output_path):
    """音声合成を実行"""

    # 音声クエリ作成
    query_response = requests.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": text, "speaker": speaker_id}
    )

    if query_response.status_code != 200:
        print(f"❌ Error: audio_query failed - {query_response.status_code}")
        return False

    query_data = query_response.json()

    # 音声合成
    synthesis_response = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": speaker_id},
        json=query_data
    )

    if synthesis_response.status_code != 200:
        print(f"❌ Error: synthesis failed - {synthesis_response.status_code}")
        return False

    # WAV保存
    with open(output_path, "wb") as f:
        f.write(synthesis_response.content)

    return True

def main():
    print("=" * 60)
    print("🎤 Water Spider Orchestrator - ずんだもん解説音声生成")
    print("=" * 60)
    print()

    # 台本読み込み
    script_path = Path("./water-spider-narration.txt")

    if not script_path.exists():
        print(f"❌ Error: {script_path} が見つかりません")
        return 1

    with open(script_path, "r", encoding="utf-8") as f:
        script = f.read()

    # セクション分割（## で分割）
    sections = []
    current_section = []

    for line in script.split("\n"):
        if line.startswith("## "):
            if current_section:
                sections.append("\n".join(current_section))
            current_section = [line.replace("## ", "")]
        elif line.strip() and not line.startswith("#"):
            current_section.append(line)

    if current_section:
        sections.append("\n".join(current_section))

    print(f"📝 台本を {len(sections)} セクションに分割しました")
    print()

    # VOICEVOX Engine接続確認
    try:
        response = requests.get(f"{VOICEVOX_URL}/version")
        version = response.text.strip('"')
        print(f"✅ VOICEVOX Engine: バージョン {version}")
        print()
    except Exception as e:
        print(f"❌ Error: VOICEVOX Engineに接続できません - {e}")
        return 1

    # 音声合成開始
    print("🎬 音声合成開始...")
    print(f"🎤 {len(sections)}件の音声合成を開始します")
    print("=" * 60)
    print()

    success_count = 0

    for i, section in enumerate(sections):
        # テキストを簡略化（長すぎる場合は分割）
        lines = section.split("\n")
        title = lines[0] if lines else f"Section {i+1}"
        text = section.strip()

        # 長さチェック（140文字ごとに分割）
        max_length = 140
        if len(text) > max_length:
            # 文単位で分割
            sentences = text.replace("。", "。\n").replace("！", "！\n").replace("？", "？\n").split("\n")
            chunks = []
            current_chunk = ""

            for sentence in sentences:
                if len(current_chunk) + len(sentence) > max_length and current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = sentence
                else:
                    current_chunk += sentence

            if current_chunk:
                chunks.append(current_chunk)

            # 各チャンクを合成
            for j, chunk in enumerate(chunks):
                output_path = OUTPUT_DIR / f"zundamon_{i:03d}_{j:03d}.wav"

                print(f"[{i+1}-{j+1}/{len(sections)}] {title} (Part {j+1}/{len(chunks)})")
                print(f"   テキスト: {chunk[:50]}..." if len(chunk) > 50 else f"   テキスト: {chunk}")

                if synthesize_speech(chunk, ZUNDAMON_SPEAKER_ID, output_path):
                    print(f"   ✅ 保存: {output_path}")
                    success_count += 1
                else:
                    print(f"   ❌ 失敗")

                print()
                time.sleep(0.5)  # API負荷軽減
        else:
            output_path = OUTPUT_DIR / f"zundamon_{i:03d}.wav"

            print(f"[{i+1}/{len(sections)}] {title}")
            print(f"   テキスト: {text[:50]}..." if len(text) > 50 else f"   テキスト: {text}")

            if synthesize_speech(text, ZUNDAMON_SPEAKER_ID, output_path):
                print(f"   ✅ 保存: {output_path}")
                success_count += 1
            else:
                print(f"   ❌ 失敗")

            print()
            time.sleep(0.5)

    print("=" * 60)
    print(f"✅ 完了！{success_count}件の音声ファイルを生成しました")
    print(f"📁 出力ディレクトリ: {OUTPUT_DIR.absolute()}")
    print()
    print("📝 次のステップ:")
    print("1. 音声を確認: afplay output/water-spider/zundamon_000.wav")
    print("2. 全音声を結合: ffmpeg -i 'concat:...'")
    print("3. 動画作成: ffmpeg -i audio.wav -i image.png -c:v libx264 -c:a aac output.mp4")
    print("=" * 60)

    return 0

if __name__ == "__main__":
    exit(main())
