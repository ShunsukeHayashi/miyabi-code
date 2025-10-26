#!/bin/bash
# Generate all 32 Stream Deck icons for optimized layout
# Uses Bytepluses Ark API for image generation

API_KEY="fdc9e681-e525-4122-9ed1-2d896f2cb11c"
ICON_DIR="$(dirname "$0")/icons"
mkdir -p "$ICON_DIR"

generate_icon() {
    local number="$1"
    local name="$2"
    local emoji="$3"
    local color="$4"
    local description="$5"

    echo "[$number/32] $name..."

    # Create prompt with emoji, color, and description
    prompt="Clean minimal icon for $description. Style: flat design, modern UI, solid $color background gradient, large ${emoji} emoji centered (48px), white text label '$name' below emoji (12pt), 72x72px, professional, rounded corners"

    response=$(curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{\"model\":\"seedream-4-0-250828\",\"prompt\":\"$prompt\",\"size\":\"1K\",\"watermark\":false}")

    url=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['url'])" 2>/dev/null)

    if [ -n "$url" ]; then
        curl -s -o "$ICON_DIR/$(printf '%02d' $number)-${name}.jpeg" "$url" && echo "   ✅ Saved"
    else
        echo "   ❌ Failed: $response"
    fi
    sleep 2
}

echo "🎨 Generating 32 Stream Deck icons (Optimized Layout)"
echo ""

# === ROW 1: Basic Navigation & Control (Blue) ===
echo "📘 Row 1: Navigation & Control"
generate_icon 1 "next" "▶️" "blue" "navigation next button"
generate_icon 2 "continue" "⏩" "blue" "continue workflow button"
generate_icon 3 "fix" "🔧" "orange" "fix build errors and test"
generate_icon 4 "help" "❓" "yellow" "help and assistance"
generate_icon 5 "verify" "✅" "green" "system verification check"
generate_icon 6 "test" "🧪" "green" "run tests"
generate_icon 7 "review" "📊" "purple" "code review analysis"
generate_icon 8 "clippy" "📎" "purple" "rust clippy linter"

# === ROW 2: Git & Development Workflow (Cyan) ===
echo ""
echo "📗 Row 2: Git Workflow"
generate_icon 9 "status" "📋" "cyan" "git status check"
generate_icon 10 "diff" "🔍" "cyan" "git diff changes"
generate_icon 11 "add" "➕" "cyan" "git add files"
generate_icon 12 "commit" "📝" "green" "git commit changes"
generate_icon 13 "pr" "🚀" "green" "create pull request"
generate_icon 14 "push" "⬆️" "blue" "git push to remote"
generate_icon 15 "pull" "⬇️" "blue" "git pull from remote"
generate_icon 16 "merge" "🔀" "purple" "git merge branches"

# === ROW 3: Agent Execution & Automation (Red/Orange) ===
echo ""
echo "📕 Row 3: Agents & Automation"
generate_icon 17 "issue" "➕📋" "yellow" "create new github issue"
generate_icon 18 "agent" "🤖" "red" "run autonomous agent"
generate_icon 19 "infinity" "♾️" "red" "infinity sprint mode"
generate_icon 20 "auto" "🔄" "red" "full automation mode"
generate_icon 21 "todos" "☑️" "yellow" "convert todos to issues"
generate_icon 22 "security" "🔒" "orange" "security vulnerability scan"
generate_icon 23 "deploy" "🚀" "green" "deploy to production"
generate_icon 24 "docs" "📚" "blue" "generate documentation"

# === ROW 4: Voice & Notifications (Pink/Purple) ===
echo ""
echo "📙 Row 4: Voice & Notifications"
generate_icon 25 "voice" "🔊" "pink" "voice notification system"
generate_icon 26 "zundamon" "🎤" "pink" "zundamon reading mode"
generate_icon 27 "narrate" "🗣️" "pink" "narrate progress audio"
generate_icon 28 "watch" "👁️" "purple" "watch sprint monitor"
generate_icon 29 "daily" "📊" "blue" "daily update report"
generate_icon 30 "session" "🔔" "orange" "session end notification"
generate_icon 31 "lp" "🌐" "green" "landing page generator"
generate_icon 32 "build" "🏗️" "orange" "build entire project"

echo ""
echo "✅ All 32 icons generated!"
echo "📁 Location: $ICON_DIR"
ls -1 "$ICON_DIR"/*.jpeg 2>/dev/null | wc -l | xargs echo "Generated icons:"
echo ""
echo "🎨 Preview icons:"
echo "   open $ICON_DIR"
