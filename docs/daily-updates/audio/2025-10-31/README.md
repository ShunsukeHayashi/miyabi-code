# VOICEVOX Audio Generation Instructions

## 📋 Overview

This directory contains the script and instructions for generating audio narration for the daily report 2025-10-31 using VOICEVOX.

**Total segments**: 47
**Estimated duration**: 8-10 minutes
**Characters**: 霊夢 (Reimu) & 魔理沙 (Marisa)

---

## 🎙️ VOICEVOX Settings

### Character Configuration

| Character | VOICEVOX Speaker | Speaker ID | Voice Characteristics |
|-----------|-----------------|------------|---------------------|
| **霊夢 (Reimu)** | 四国めたん (ノーマル) | 2 | Bright, energetic, slightly airheaded |
| **魔理沙 (Marisa)** | 春日部つむぎ (ノーマル) | 8 | Calm, uses "だぜ" and masculine speech |

### Audio Parameters

```json
{
  "speed": 1.1,
  "pitch": 0,
  "intonation": 1.0,
  "volume": 1.0
}
```

---

## 🚀 Generation Methods

### Method 1: Using VOICEVOX GUI (Recommended for initial setup)

1. **Open VOICEVOX Application**
   ```bash
   open /Applications/VOICEVOX.app
   ```

2. **For each line in `voicevox-script.json`**:
   - Select the appropriate speaker (ID 2 for Reimu, ID 8 for Marisa)
   - Paste the text from the `text` field
   - Adjust speed to 1.1x
   - Click "Generate" (音声合成)
   - Export as WAV with the filename from `output_file` field

3. **Save all files** to this directory

---

### Method 2: Using VOICEVOX Engine API (Automated)

**Prerequisites**:
- VOICEVOX Engine running on `http://localhost:50021`
- `curl` or HTTP client

**Start VOICEVOX Engine**:
```bash
# macOS
/Applications/VOICEVOX.app/Contents/MacOS/VOICEVOX --enable-cors

# Or use Docker
docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

**Generate audio using curl**:
```bash
#!/bin/bash

# Read JSON script
SCRIPT_FILE="voicevox-script.json"

# Function to generate audio
generate_audio() {
    local text="$1"
    local speaker_id="$2"
    local output_file="$3"
    local speed=1.1

    # Step 1: Generate audio query
    QUERY=$(curl -s -X POST "http://localhost:50021/audio_query?text=${text}&speaker=${speaker_id}")

    # Step 2: Modify speed
    QUERY=$(echo "$QUERY" | jq ".speedScale = ${speed}")

    # Step 3: Synthesize audio
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$QUERY" \
        "http://localhost:50021/synthesis?speaker=${speaker_id}" \
        -o "${output_file}"

    echo "✅ Generated: ${output_file}"
}

# Loop through script lines
jq -r '.script[] | "\(.text)|\(.speaker_id)|\(.output_file)"' "$SCRIPT_FILE" | while IFS='|' read -r text speaker_id output_file; do
    generate_audio "$text" "$speaker_id" "$output_file"
    sleep 0.5  # Rate limiting
done
```

**Save this as** `generate_audio.sh` and run:
```bash
chmod +x generate_audio.sh
./generate_audio.sh
```

---

### Method 3: Using Python Script

**Install dependencies**:
```bash
pip install requests
```

**Python script** (`generate_voicevox.py`):
```python
import json
import requests
import time
from pathlib import Path

VOICEVOX_API = "http://localhost:50021"
SCRIPT_FILE = "voicevox-script.json"

def generate_audio(text: str, speaker_id: int, output_file: str, speed: float = 1.1):
    """Generate audio using VOICEVOX Engine API"""

    # Step 1: Generate audio query
    query_params = {"text": text, "speaker": speaker_id}
    response = requests.post(f"{VOICEVOX_API}/audio_query", params=query_params)
    audio_query = response.json()

    # Step 2: Modify speed
    audio_query["speedScale"] = speed

    # Step 3: Synthesize audio
    synthesis_params = {"speaker": speaker_id}
    response = requests.post(
        f"{VOICEVOX_API}/synthesis",
        params=synthesis_params,
        json=audio_query
    )

    # Step 4: Save WAV file
    with open(output_file, "wb") as f:
        f.write(response.content)

    print(f"✅ Generated: {output_file}")

def main():
    # Load script
    with open(SCRIPT_FILE, "r", encoding="utf-8") as f:
        script_data = json.load(f)

    # Generate audio for each line
    for line in script_data["script"]:
        generate_audio(
            text=line["text"],
            speaker_id=line["speaker_id"],
            output_file=line["output_file"],
            speed=1.1
        )
        time.sleep(0.5)  # Rate limiting

if __name__ == "__main__":
    main()
```

**Run**:
```bash
python generate_voicevox.py
```

---

## 📁 Expected Output

After generation, this directory should contain 47 WAV files:

```
audio/2025-10-31/
├── README.md (this file)
├── voicevox-script.json
├── 01_reimu_opening.wav
├── 02_marisa_opening.wav
├── 03_reimu_announcement.wav
├── ...
└── 47_reimu_subscribe.wav
```

---

## 🎬 Video Editing Integration

### For ゆっくりムービーメーカー (YMM4)

1. **Import audio files** in sequence
2. **Add character sprites**:
   - Reimu: Use 霊夢 sprite
   - Marisa: Use 魔理沙 sprite
3. **Auto-generate subtitles** from audio
4. **Add background images** from `docs/daily-updates/images/2025-10-31/`
5. **Insert BGM** (low volume, non-intrusive)
6. **Add SE** (sound effects) at key moments

### Timeline Structure

```
[0:00-0:30]   OP           + BGM (upbeat)
[0:30-1:30]   Statistics   + SE (typing sounds)
[1:30-3:30]   Issue #624   + Background image
[3:30-5:00]   Tech Stack   + Diagram animation
[5:00-6:30]   Roadmap      + Roadmap image
[6:30-7:30]   Architecture + Architecture diagram
[7:30-8:00]   Cleanup      + SE (clean sweep)
[8:00-8:30]   ED           + BGM (outro)
```

---

## 🔧 Troubleshooting

### VOICEVOX Engine not responding

```bash
# Check if engine is running
curl http://localhost:50021/

# If not running, start it
/Applications/VOICEVOX.app/Contents/MacOS/VOICEVOX --enable-cors
```

### Japanese text encoding issues

Ensure all files are saved with UTF-8 encoding:
```bash
file -I voicevox-script.json
# Should show: charset=utf-8
```

### Audio quality issues

Adjust parameters in the script:
```json
{
  "speed": 1.0,        // Slower = clearer
  "pitch": 0,          // Standard pitch
  "intonation": 1.2,   // More expressive
  "volume": 1.5        // Louder
}
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total lines | 47 |
| Reimu lines | 24 |
| Marisa lines | 23 |
| Estimated duration | 8-10 minutes |
| Average line length | 30-50 characters |

---

## ✅ Quality Checklist

Before finalizing:

- [ ] All 47 audio files generated successfully
- [ ] Audio files are clear and understandable
- [ ] Speed (1.1x) sounds natural
- [ ] Character voices match personality
- [ ] No clipping or distortion
- [ ] File sizes are reasonable (~50-200KB per file)
- [ ] Filenames match JSON specification

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

Co-Authored-By: かきこちゃん (NoteAgent) <noreply@anthropic.com>
