#!/bin/bash

# Miyabi Agent Character Images Generator
# Uses BytePlus Ark API (seedream-4-0-250828 model) to generate cute agent character images

set -e

# Check environment variable
if [ -z "$ARK_API_KEY" ]; then
    echo "Error: ARK_API_KEY environment variable is not set"
    echo "Please set it with: export ARK_API_KEY=your_api_key"
    exit 1
fi

# API configuration
API_URL="https://ark.ap-southeast.bytepluses.com/api/v3/images/generations"
MODEL="seedream-4-0-250828"
SIZE="2K"
OUTPUT_DIR="$(dirname "$0")/../public/agents"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Base prompt template
BASE_PROMPT="Cute cartoon character illustration, professional office worker, friendly and approachable, high quality anime style, clean simple background, chibi proportions, expressive eyes, bright colors, kawaii aesthetic, studio lighting, high detail render"

# Color themes
COLOR_THEME_RED="wearing red uniform or red accents"
COLOR_THEME_GREEN="wearing green uniform or green accents"
COLOR_THEME_BLUE="wearing blue uniform or blue accents"
COLOR_THEME_YELLOW="wearing yellow uniform or yellow accents"

# Function to generate image for one agent
generate_agent_image() {
    local agent_key="$1"
    local agent_name="$2"
    local role="$3"
    local visual_keywords="$4"
    local color_theme="$5"

    echo "=========================================="
    echo "Generating image for: $agent_name ($agent_key)"
    echo "Role: $role"
    echo "Color: $color_theme"
    echo "=========================================="

    # Construct full prompt
    local color_directive=""
    case "$color_theme" in
        "red")    color_directive="$COLOR_THEME_RED" ;;
        "green")  color_directive="$COLOR_THEME_GREEN" ;;
        "blue")   color_directive="$COLOR_THEME_BLUE" ;;
        "yellow") color_directive="$COLOR_THEME_YELLOW" ;;
    esac

    local full_prompt="$BASE_PROMPT, $color_directive, $role, holding or working with $visual_keywords, japanese mascot character style"

    # Call BytePlus Ark API
    local response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ARK_API_KEY" \
      -d "{
        \"model\": \"$MODEL\",
        \"prompt\": \"$full_prompt\",
        \"sequential_image_generation\": \"disabled\",
        \"response_format\": \"url\",
        \"size\": \"$SIZE\",
        \"stream\": false,
        \"watermark\": false
      }")

    # Extract image URL from response
    local image_url=$(echo "$response" | jq -r '.data[0].url // empty')

    if [ -z "$image_url" ]; then
        echo "❌ Failed to generate image for $agent_key"
        echo "API Response: $response"
        return 1
    fi

    echo "✅ Image URL: $image_url"

    # Download image
    local output_file="$OUTPUT_DIR/${agent_key}.png"
    curl -s -o "$output_file" "$image_url"

    echo "✅ Saved to: $output_file"
    echo ""

    # Rate limiting: wait 2 seconds between requests
    sleep 2
}

# Read agent data from JSON and generate images
jq -c '.[]' "$(dirname "$0")/agent-characters.json" | while read -r agent; do
    agent_key=$(echo "$agent" | jq -r '.key')
    agent_name=$(echo "$agent" | jq -r '.name_en')
    role=$(echo "$agent" | jq -r '.role_en')
    visual_keywords=$(echo "$agent" | jq -r '.visual_keywords')
    color_theme=$(echo "$agent" | jq -r '.color_theme')

    generate_agent_image "$agent_key" "$agent_name" "$role" "$visual_keywords" "$color_theme"
done

echo "=========================================="
echo "✅ All agent images generated successfully!"
echo "Output directory: $OUTPUT_DIR"
echo "=========================================="
