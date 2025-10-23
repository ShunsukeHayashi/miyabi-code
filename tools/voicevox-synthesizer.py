#!/usr/bin/env python3
"""
VOICEVOX APIを使って台本を音声化するスクリプト

Usage:
    python voicevox-synthesizer.py

Input:
    - voicevox_requests.json (台本生成スクリプトの出力)

Output:
    - audio/{speaker_id}_{index}.wav (音声ファイル)
"""

import json
import requests
import time
from pathlib import Path
from urllib.parse import quote


class VoicevoxSynthesizer:
    """VOICEVOX音声合成器"""

    def __init__(self, base_url: str = "http://127.0.0.1:50021"):
        self.base_url = base_url
        self.output_dir = Path("audio")
        self.output_dir.mkdir(exist_ok=True)

    def synthesize_all(self, requests_file: str = "voicevox_requests.json"):
        """全ての台本を音声合成"""

        # リクエストファイル読み込み
        with open(requests_file, "r", encoding="utf-8") as f:
            requests_data = json.load(f)

        print(f"🎤 {len(requests_data)}件の音声合成を開始します")
        print("=" * 60)

        audio_files = []

        for i, req in enumerate(requests_data):
            speaker_id = req["speaker_id"]
            text = req["text"]

            print(f"\n[{i+1}/{len(requests_data)}] Speaker {speaker_id}: {text[:30]}...")

            # 音声合成
            try:
                audio_file = self.synthesize_text(text, speaker_id, index=i)
                audio_files.append(audio_file)
                print(f"   ✅ 保存: {audio_file}")
            except Exception as e:
                print(f"   ❌ エラー: {e}")
                continue

            # API負荷軽減のため少し待機
            time.sleep(0.5)

        print("\n" + "=" * 60)
        print(f"✅ 完了！{len(audio_files)}件の音声ファイルを生成しました")
        print(f"📁 出力ディレクトリ: {self.output_dir.absolute()}")

        return audio_files

    def synthesize_text(self, text: str, speaker_id: int, index: int = 0) -> str:
        """テキストを音声合成してファイル保存"""

        # Step 1: audio_query取得
        query_url = f"{self.base_url}/audio_query"
        query_params = {
            "speaker": speaker_id,
            "text": text
        }

        response = requests.post(query_url, params=query_params)
        response.raise_for_status()
        audio_query = response.json()

        # Step 2: synthesis実行
        synthesis_url = f"{self.base_url}/synthesis"
        synthesis_params = {
            "speaker": speaker_id
        }

        response = requests.post(
            synthesis_url,
            params=synthesis_params,
            json=audio_query
        )
        response.raise_for_status()

        # Step 3: 音声ファイル保存
        output_file = self.output_dir / f"speaker{speaker_id}_{index:03d}.wav"
        with open(output_file, "wb") as f:
            f.write(response.content)

        return str(output_file)

    def check_voicevox_status(self) -> bool:
        """VOICEVOX Engineの起動状態を確認"""
        try:
            response = requests.get(f"{self.base_url}/version", timeout=5)
            version = response.json()
            print(f"✅ VOICEVOX Engine: バージョン {version}")
            return True
        except Exception as e:
            print(f"❌ VOICEVOX Engineに接続できません: {e}")
            print("   エンジンが起動しているか確認してください")
            return False


def main():
    """メイン処理"""
    print("🎤 VOICEVOX音声合成")
    print("=" * 60)

    synthesizer = VoicevoxSynthesizer()

    # VOICEVOX Engine状態確認
    print("🔍 VOICEVOX Engine接続確認...")
    if not synthesizer.check_voicevox_status():
        print("\n⚠️  エンジンを起動してから再実行してください")
        return

    # 音声合成実行
    print("\n🎬 音声合成開始...")
    audio_files = synthesizer.synthesize_all()

    print("\n📝 次のステップ:")
    print("1. audio/ ディレクトリで生成された音声を確認")
    print("2. 動画編集ソフト（YMM、Premiere Pro等）で動画作成")
    print("3. YouTube等にアップロード")


if __name__ == "__main__":
    main()
