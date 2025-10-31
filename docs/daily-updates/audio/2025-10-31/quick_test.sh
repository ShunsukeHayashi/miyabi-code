#!/bin/bash

# Simple test with URL encoding
TEXT=$(python3 -c "import urllib.parse; print(urllib.parse.quote('はいはーい！霊夢だよー！'))")
SPEAKER_ID=2

echo "Creating audio query..."
curl -s -X POST "http://localhost:50021/audio_query?text=${TEXT}&speaker=${SPEAKER_ID}" > query.json

echo "Query size: $(wc -c < query.json) bytes"

if [ $(wc -c < query.json) -gt 200 ]; then
    echo "✅ Query looks good!"
    echo "Synthesizing..."
    curl -s -X POST "http://localhost:50021/synthesis?speaker=${SPEAKER_ID}" \
        -H "Content-Type: application/json" \
        -d @query.json \
        -o reimu_test.wav
    
    echo "File size: $(wc -c < reimu_test.wav) bytes"
    file reimu_test.wav
    
    if file reimu_test.wav | grep -q "RIFF"; then
        echo "✅ Valid WAV file!"
        echo "Playing..."
        afplay reimu_test.wav
    else
        echo "❌ Not a valid WAV file"
        head -c 200 reimu_test.wav
    fi
else
    echo "❌ Query failed"
    cat query.json
fi
