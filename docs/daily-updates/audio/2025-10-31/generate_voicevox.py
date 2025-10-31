#!/usr/bin/env python3
"""
VOICEVOX Audio Generation Script
Generates WAV files from voicevox-script.json
"""

import json
import requests
import time
from pathlib import Path
import sys

VOICEVOX_API = "http://localhost:50021"
SCRIPT_FILE = "voicevox-script.json"

def check_engine():
    """Check if VOICEVOX Engine is running"""
    try:
        response = requests.get(VOICEVOX_API, timeout=2)
        return response.status_code == 200
    except:
        return False

def generate_audio(text: str, speaker_id: int, output_file: str, speed: float = 1.1):
    """Generate audio using VOICEVOX Engine API"""

    try:
        # Step 1: Generate audio query
        query_params = {"text": text, "speaker": speaker_id}
        response = requests.post(f"{VOICEVOX_API}/audio_query", params=query_params, timeout=10)

        if response.status_code != 200:
            print(f"❌ Error generating query for: {text[:20]}...")
            return False

        audio_query = response.json()

        # Step 2: Modify speed
        audio_query["speedScale"] = speed

        # Step 3: Synthesize audio
        synthesis_params = {"speaker": speaker_id}
        response = requests.post(
            f"{VOICEVOX_API}/synthesis",
            params=synthesis_params,
            json=audio_query,
            timeout=30
        )

        if response.status_code != 200:
            print(f"❌ Error synthesizing: {text[:20]}...")
            return False

        # Step 4: Save WAV file
        with open(output_file, "wb") as f:
            f.write(response.content)

        print(f"✅ Generated: {output_file}")
        return True

    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    # Check if VOICEVOX Engine is running
    if not check_engine():
        print("❌ VOICEVOX Engine is not running!")
        print("Please start VOICEVOX Engine at http://localhost:50021")
        sys.exit(1)

    print("✅ VOICEVOX Engine detected")

    # Load script
    script_path = Path(SCRIPT_FILE)
    if not script_path.exists():
        print(f"❌ Script file not found: {SCRIPT_FILE}")
        sys.exit(1)

    with open(script_path, "r", encoding="utf-8") as f:
        script_data = json.load(f)

    print(f"📋 Loaded {len(script_data['script'])} dialogue segments")

    # Generate audio for each line
    success_count = 0
    for i, line in enumerate(script_data["script"], 1):
        print(f"\n[{i}/{len(script_data['script'])}] {line['character']}: {line['text'][:30]}...")

        if generate_audio(
            text=line["text"],
            speaker_id=line["speaker_id"],
            output_file=line["output_file"],
            speed=1.1
        ):
            success_count += 1

        time.sleep(0.5)  # Rate limiting

    print(f"\n✅ Complete! Generated {success_count}/{len(script_data['script'])} audio files")

if __name__ == "__main__":
    main()
