#!/bin/bash

# Generate ALL 47 audio segments from JSON script

SCRIPT_JSON="voicevox-script.json"

generate_voice() {
    local text="$1"
    local speaker_id="$2"
    local output="$3"

    # URL encode (handle special characters)
    encoded=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$text")

    # Generate query
    curl -s -X POST "http://localhost:50021/audio_query?text=${encoded}&speaker=${speaker_id}" > temp_query.json

    # Modify speed to 1.1x
    python3 -c "import json, sys; d=json.load(open('temp_query.json')); d['speedScale']=1.1; json.dump(d, sys.stdout)" > temp_query_fast.json

    # Synthesize
    curl -s -X POST "http://localhost:50021/synthesis?speaker=${speaker_id}" \
        -H "Content-Type: application/json" \
        -d @temp_query_fast.json \
        -o "${output}" 2>/dev/null

    rm temp_query.json temp_query_fast.json 2>/dev/null
}

echo "🎙️  Generating ALL 47 audio segments for Miyabi Daily Report 2025-10-31"
echo "========================================================================="
echo ""

# Parse JSON and generate all audio
total=$(jq '.script | length' "$SCRIPT_JSON")
echo "Total segments: $total"
echo ""

counter=0
jq -r '.script[] | "\(.index)|\(.speaker_id)|\(.text)|\(.output_file)|\(.character)"' "$SCRIPT_JSON" | while IFS='|' read -r index speaker_id text output_file character; do
    counter=$((counter + 1))
    printf "[%2d/%2d] %-10s: %s\n" "$counter" "$total" "$character" "${text:0:40}..."

    generate_voice "$text" "$speaker_id" "$output_file"

    # Check if file was created successfully
    if [ -f "$output_file" ] && [ $(wc -c < "$output_file") -gt 10000 ]; then
        size=$(ls -lh "$output_file" | awk '{print $5}')
        echo "        ✅ $output_file ($size)"
    else
        echo "        ❌ Failed: $output_file"
    fi

    # Rate limiting
    sleep 0.3
    echo ""
done

echo "========================================================================="
echo "✅ Generation complete!"
echo ""
echo "📊 Summary:"
wav_count=$(ls -1 *.wav 2>/dev/null | wc -l)
total_size=$(du -sh *.wav 2>/dev/null | tail -1 | awk '{print $1}')
echo "   WAV files: $wav_count"
echo "   Total size: $total_size"
echo ""
echo "▶️  To play all in sequence: ./play_all.sh"
