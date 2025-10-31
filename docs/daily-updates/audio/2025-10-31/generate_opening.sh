#!/bin/bash

generate_voice() {
    local text="$1"
    local speaker_id="$2"
    local output="$3"
    
    # URL encode
    encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${text}'))")
    
    echo "🎙️  ${output}"
    
    # Generate query
    curl -s -X POST "http://localhost:50021/audio_query?text=${encoded}&speaker=${speaker_id}" > temp_query.json
    
    # Synthesize
    curl -s -X POST "http://localhost:50021/synthesis?speaker=${speaker_id}" \
        -H "Content-Type: application/json" \
        -d @temp_query.json \
        -o "${output}"
    
    echo "✅ $(ls -lh ${output} | awk '{print $5}')"
}

echo "=== Miyabi Daily Report 2025-10-31 - Opening ===" 
echo ""

# 霊夢 (Speaker ID: 2)
generate_voice "はいはーい！霊夢だよー！今日もMiyabiプロジェクトの開発進捗を報告していくわよー！" 2 "01_reimu_opening.wav"

sleep 0.3

# 魔理沙 (Speaker ID: 8)
generate_voice "おう魔理沙だぜ！今日は何があったんだ？" 8 "02_marisa_opening.wav"

sleep 0.3

# 霊夢
generate_voice "今日はね、なんと！Issue 624のElectron App完全仕様がついに完成したのよ！" 2 "03_reimu_announcement.wav"

sleep 0.3

# 魔理沙
generate_voice "おお！それはすげーじゃねーか！詳しく聞かせてくれよ！" 8 "04_marisa_reaction.wav"

echo ""
echo "✅ Generated 4 audio files"
echo ""
echo "▶️  Playing..."

# Play in sequence
afplay 01_reimu_opening.wav
sleep 0.2
afplay 02_marisa_opening.wav
sleep 0.2
afplay 03_reimu_announcement.wav
sleep 0.2
afplay 04_marisa_reaction.wav

echo ""
echo "🎉 Playback complete!"
