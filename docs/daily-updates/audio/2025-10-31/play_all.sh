#!/bin/bash

# Play all audio segments in sequence

echo "▶️  Playing Miyabi Daily Report 2025-10-31 - Yukkuri Commentary"
echo "================================================================"
echo ""
echo "Duration: ~8-10 minutes"
echo "Characters: 霊夢 (Reimu) & 魔理沙 (Marisa)"
echo ""
echo "Press Ctrl+C to stop"
echo ""
sleep 2

# Play all WAV files in order
for i in {01..47}; do
    file=$(ls ${i}_*.wav 2>/dev/null | head -1)
    if [ -f "$file" ]; then
        char=$(echo "$file" | grep -o "reimu\|marisa")
        if [ "$char" = "reimu" ]; then
            emoji="🔴"
        else
            emoji="🔵"
        fi
        echo "$emoji [${i}/47] Playing: $file"
        afplay "$file"
        sleep 0.2
    fi
done

echo ""
echo "✅ Playback complete!"
echo ""
echo "📊 Total audio files: $(ls -1 *.wav 2>/dev/null | wc -l)"
echo "💾 Total size: $(du -sh *.wav 2>/dev/null | tail -1 | awk '{print $1}')"
