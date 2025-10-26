#!/bin/bash
# Generate sample Stream Deck icons (first 4 icons)

API_KEY="fdc9e681-e525-4122-9ed1-2d896f2cb11c"
ICON_DIR="$(dirname "$0")/icons"
mkdir -p "$ICON_DIR"

echo "🎨 Generating sample Stream Deck icons..."

# Icon 1: Next
echo "Generating 01-next..."
curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Minimalist icon: blue right arrow, play button style, clean geometric design, flat design, simple shapes, technology theme, vibrant blue color, white background, modern UI style, high quality, sharp details",
    "size": "1K",
    "watermark": false
}' | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//' | xargs -I {} curl -s -o "$ICON_DIR/01-next.jpeg" "{}"
echo "✅ 01-next saved"
sleep 2

# Icon 2: Continue
echo "Generating 02-continue..."
curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Minimalist icon: double right arrows, fast forward symbol, clean geometric design, flat design, cyan color, white background, modern UI style, high quality, sharp details",
    "size": "1K",
    "watermark": false
}' | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//' | xargs -I {} curl -s -o "$ICON_DIR/02-continue.jpeg" "{}"
echo "✅ 02-continue saved"
sleep 2

# Icon 3: Fix
echo "Generating 03-fix..."
curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Minimalist icon: orange wrench tool, repair symbol, clean geometric design, flat design, bright orange, white background, modern UI style, high quality, sharp details",
    "size": "1K",
    "watermark": false
}' | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//' | xargs -I {} curl -s -o "$ICON_DIR/03-fix.jpeg" "{}"
echo "✅ 03-fix saved"
sleep 2

# Icon 4: Help
echo "Generating 04-help..."
curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Minimalist icon: purple question mark, help symbol, clean geometric design, flat design, vibrant purple, white background, modern UI style, high quality, sharp details",
    "size": "1K",
    "watermark": false
}' | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//' | xargs -I {} curl -s -o "$ICON_DIR/04-help.jpeg" "{}"
echo "✅ 04-help saved"

echo ""
echo "✅ Sample icons generated!"
echo "📁 Location: $ICON_DIR"
ls -lh "$ICON_DIR"/*.jpeg
