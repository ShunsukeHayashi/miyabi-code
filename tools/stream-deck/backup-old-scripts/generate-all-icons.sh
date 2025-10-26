#!/bin/bash
# Generate all 32 Stream Deck icons

API_KEY="fdc9e681-e525-4122-9ed1-2d896f2cb11c"
ICON_DIR="$(dirname "$0")/icons"
mkdir -p "$ICON_DIR"

generate_icon() {
    local id="$1"
    local name="$2"
    local prompt="$3"

    echo "[$id/32] $name..."
    response=$(curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{\"model\":\"seedream-4-0-250828\",\"prompt\":\"$prompt\",\"size\":\"1K\",\"watermark\":false}")
    url=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['url'])" 2>/dev/null)
    if [ -n "$url" ]; then
        curl -s -o "$ICON_DIR/$name.jpeg" "$url" && echo "   ✅ Saved"
    else
        echo "   ❌ Failed"
    fi
    sleep 2
}

echo "🎨 Generating all 32 Stream Deck icons..."
echo ""

# Row 1-4 already generated, starting from Row 2
generate_icon "05" "05-build" "Minimalist icon: construction crane, building blocks, clean geometric design, flat design, yellow-orange gradient, white background, modern UI style"
generate_icon "06" "06-test" "Minimalist icon: green checkmark in circle, test pass symbol, clean geometric design, flat design, bright green, white background, modern UI style"
generate_icon "07" "07-clippy" "Minimalist icon: paperclip with sparkles, code quality symbol, clean geometric design, flat design, blue-purple gradient, white background, modern UI style"
generate_icon "08" "08-format" "Minimalist icon: paint roller, code formatting symbol, clean geometric design, flat design, pink-magenta gradient, white background, modern UI style"

generate_icon "09" "09-git" "Minimalist icon: git branch diagram, version control tree, clean geometric design, flat design, orange color, white background, modern UI style"
generate_icon "10" "10-commit" "Minimalist icon: chat bubble with checkmark, commit message symbol, clean geometric design, flat design, green-blue gradient, white background, modern UI style"
generate_icon "11" "11-pr" "Minimalist icon: merge arrows, pull request symbol, clean geometric design, flat design, purple color, white background, modern UI style"
generate_icon "12" "12-push" "Minimalist icon: rocket launching upward, deployment symbol, clean geometric design, flat design, red-orange gradient, white background, modern UI style"

generate_icon "13" "13-coordinator" "Minimalist icon: target with bullseye, coordination symbol, clean geometric design, flat design, red-pink gradient, white background, modern UI style"
generate_icon "14" "14-codegen" "Minimalist icon: gear with code brackets, code generation symbol, clean geometric design, flat design, blue-cyan gradient, white background, modern UI style"
generate_icon "15" "15-review" "Minimalist icon: magnifying glass over document, code review symbol, clean geometric design, flat design, purple-blue gradient, white background, modern UI style"
generate_icon "16" "16-deploy" "Minimalist icon: ship sailing, deployment symbol, clean geometric design, flat design, navy blue color, white background, modern UI style"

generate_icon "17" "17-docs" "Minimalist icon: open book with bookmark, documentation symbol, clean geometric design, flat design, blue color, white background, modern UI style"
generate_icon "18" "18-analyze" "Minimalist icon: microscope, code analysis symbol, clean geometric design, flat design, teal-green gradient, white background, modern UI style"
generate_icon "19" "19-benchmark" "Minimalist icon: checkered racing flag, performance benchmark symbol, clean geometric design, flat design, black-white gradient, white background, modern UI style"
generate_icon "20" "20-profile" "Minimalist icon: lightning bolt with speedometer, performance profiling symbol, clean geometric design, flat design, yellow-orange gradient, white background, modern UI style"

generate_icon "21" "21-deploy-prod" "Minimalist icon: globe with upload arrow, production deployment symbol, clean geometric design, flat design, green-blue gradient, white background, modern UI style"
generate_icon "22" "22-rollback" "Minimalist icon: circular arrow pointing left, rollback symbol, clean geometric design, flat design, orange-red gradient, white background, modern UI style"
generate_icon "23" "23-logs" "Minimalist icon: document with lines, log file symbol, clean geometric design, flat design, gray-blue gradient, white background, modern UI style"
generate_icon "24" "24-monitor" "Minimalist icon: radar screen with signal waves, monitoring symbol, clean geometric design, flat design, green color, white background, modern UI style"

generate_icon "25" "25-clean" "Minimalist icon: broom sweeping, cleanup symbol, clean geometric design, flat design, blue-green gradient, white background, modern UI style"
generate_icon "26" "26-cache" "Minimalist icon: database with refresh arrow, cache management symbol, clean geometric design, flat design, purple color, white background, modern UI style"
generate_icon "27" "27-deps" "Minimalist icon: package box with arrows, dependency management symbol, clean geometric design, flat design, brown-orange gradient, white background, modern UI style"
generate_icon "28" "28-audit" "Minimalist icon: shield with lock, security audit symbol, clean geometric design, flat design, red color, white background, modern UI style"

generate_icon "29" "29-voice" "Minimalist icon: speaker with sound waves, voice notification symbol, clean geometric design, flat design, blue-purple gradient, white background, modern UI style"
generate_icon "30" "30-infinity" "Minimalist icon: infinity symbol with glow effect, continuous loop symbol, clean geometric design, flat design, rainbow gradient, white background, modern UI style"
generate_icon "31" "31-session" "Minimalist icon: circular refresh arrows, session management symbol, clean geometric design, flat design, cyan-blue gradient, white background, modern UI style"
generate_icon "32" "32-custom" "Minimalist icon: settings gear with star, customization symbol, clean geometric design, flat design, orange-yellow gradient, white background, modern UI style"

echo ""
echo "✅ All icons generated!"
echo "📁 Location: $ICON_DIR"
ls -lh "$ICON_DIR"/*.jpeg 2>/dev/null | wc -l | xargs echo "Generated icons:"
