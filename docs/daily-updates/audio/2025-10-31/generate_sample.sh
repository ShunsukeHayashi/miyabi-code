#!/bin/bash

# Generate first 3 audio samples using curl

generate_audio() {
    local text="$1"
    local speaker_id="$2"
    local output_file="$3"
    local speed=1.1

    echo "🎙️  Generating: $output_file"

    # Step 1: Generate audio query
    QUERY=$(curl -s -X POST "http://localhost:50021/audio_query" \
        --data-urlencode "text=${text}" \
        --data-urlencode "speaker=${speaker_id}")

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

# Generate first 3 lines
generate_audio "はいはーい！霊夢だよー！今日もMiyabiプロジェクトの開発進捗を報告していくわよー！" 2 "01_reimu_opening.wav"
generate_audio "おう魔理沙だぜ！今日は何があったんだ？" 8 "02_marisa_opening.wav"
generate_audio "今日はね、なんと！Issue 624のElectron App完全仕様がついに完成したのよ！" 2 "03_reimu_announcement.wav"

echo ""
echo "✅ Sample generation complete!"
echo "📁 Files: $(ls -1 *.wav 2>/dev/null | wc -l) WAV files"
ls -lh *.wav 2>/dev/null
