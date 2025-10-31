#!/bin/bash

TEXT="はいはーい！霊夢だよー！"
SPEAKER_ID=2

echo "Testing VOICEVOX API..."

# Step 1: Create audio query
echo "Step 1: Creating audio query..."
curl -s -X POST "http://localhost:50021/audio_query?text=${TEXT}&speaker=${SPEAKER_ID}" \
    -o query.json

echo "Query created. Content:"
cat query.json | jq '.' | head -20

# Step 2: Synthesize
echo ""
echo "Step 2: Synthesizing audio..."
curl -s -X POST "http://localhost:50021/synthesis?speaker=${SPEAKER_ID}" \
    -H "Content-Type: application/json" \
    -d @query.json \
    -o test.wav

echo "Done!"
file test.wav
ls -lh test.wav

# Play
echo "Playing..."
afplay test.wav
