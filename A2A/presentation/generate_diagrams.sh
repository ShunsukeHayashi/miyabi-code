#!/bin/bash
# A2A Presentation - PlantUML Diagram Generator
# Generates PNG images from PlantUML source files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIAGRAMS_DIR="$SCRIPT_DIR/diagrams"
OUTPUT_DIR="$SCRIPT_DIR/output/diagrams"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     A2A Presentation - PlantUML Diagram Generator         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PlantUML is installed
if ! command -v plantuml &> /dev/null; then
  echo -e "${RED}❌ Error: PlantUML not found${NC}"
  echo ""
  echo "Install PlantUML:"
  echo "  macOS:   brew install plantuml"
  echo "  Ubuntu:  sudo apt-get install plantuml"
  echo "  Manual:  Download from https://plantuml.com/download"
  echo ""
  exit 1
fi

PLANTUML_VERSION=$(plantuml -version 2>&1 | head -n 1)
echo -e "${GREEN}✅ PlantUML found: $PLANTUML_VERSION${NC}"
echo ""

# Find all .puml files
PUML_FILES=($(find "$DIAGRAMS_DIR" -name "*.puml" -type f | sort))

if [ ${#PUML_FILES[@]} -eq 0 ]; then
  echo -e "${YELLOW}⚠️  No .puml files found in $DIAGRAMS_DIR${NC}"
  exit 0
fi

echo -e "${BLUE}Found ${#PUML_FILES[@]} diagram(s) to generate${NC}"
echo ""

# Generate each diagram
SUCCESS_COUNT=0
FAIL_COUNT=0

for puml_file in "${PUML_FILES[@]}"; do
  filename=$(basename "$puml_file" .puml)
  output_file="$OUTPUT_DIR/${filename}.png"

  echo -e "${YELLOW}[Processing]${NC} $filename.puml"

  # Generate PNG with high resolution
  if plantuml -tpng -charset UTF-8 -o "$OUTPUT_DIR" "$puml_file" 2>&1 | grep -q "Error"; then
    echo -e "${RED}  ❌ Failed to generate${NC}"
    ((FAIL_COUNT++))
  else
    if [ -f "$output_file" ]; then
      filesize=$(du -h "$output_file" | cut -f1)
      echo -e "${GREEN}  ✅ Generated: ${filename}.png (${filesize})${NC}"
      ((SUCCESS_COUNT++))
    else
      echo -e "${RED}  ❌ Output file not found${NC}"
      ((FAIL_COUNT++))
    fi
  fi
  echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     Generation Summary                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Success: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Failed:  $FAIL_COUNT${NC}"
echo ""
echo -e "${BLUE}Output directory: $OUTPUT_DIR${NC}"
echo ""

# List generated files
if [ $SUCCESS_COUNT -gt 0 ]; then
  echo -e "${YELLOW}Generated files:${NC}"
  ls -lh "$OUTPUT_DIR"/*.png 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  echo ""
fi

# Export to high-res (2x) for Retina displays
echo -e "${BLUE}Generating 2x resolution versions...${NC}"

for png_file in "$OUTPUT_DIR"/*.png; do
  if [ -f "$png_file" ]; then
    filename=$(basename "$png_file" .png)
    output_2x="$OUTPUT_DIR/${filename}@2x.png"

    # Use ImageMagick to upscale (if available)
    if command -v convert &> /dev/null; then
      convert "$png_file" -resize 200% "$output_2x"
      echo -e "${GREEN}  ✅ Generated 2x: ${filename}@2x.png${NC}"
    else
      echo -e "${YELLOW}  ⚠️  ImageMagick not found, skipping 2x generation${NC}"
      break
    fi
  fi
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 Generation Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

exit 0
