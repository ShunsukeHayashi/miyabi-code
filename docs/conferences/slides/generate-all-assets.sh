#!/bin/bash

###############################################################################
# Miyabi Presentation - Complete Asset Generation Script
# T2I + Image Edit → HTML Integration
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header() {
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

###############################################################################
# Main Execution
###############################################################################

main() {
    clear
    print_header "Miyabi Presentation Asset Generation"

    echo "このスクリプトは以下を実行します:"
    echo "  1. プロフィール画像の編集（Image Edit）"
    echo "  2. 8枚の画像生成（Text-to-Image）"
    echo "  3. HTMLへの統合"
    echo "  4. プレゼンテーションプレビュー"
    echo ""

    # APIキー確認
    if [ -z "$BYTEPLUS_API_KEY" ]; then
        print_error "BYTEPLUS_API_KEY environment variable not set"
        echo ""
        print_info "Set it using:"
        echo "  export BYTEPLUS_API_KEY=your_api_key"
        exit 1
    fi
    print_success "API key configured"

    # Node.js確認
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found"
        exit 1
    fi
    print_success "Node.js $(node --version) detected"
    echo ""

    # Step 1: プロフィール画像編集
    print_header "Step 1: Profile Image Edit"

    if [ -f "$SCRIPT_DIR/source-profile.jpg" ]; then
        print_info "Source image found: source-profile.jpg"
        print_info "Editing with Image-to-Image API..."

        if node "$SCRIPT_DIR/edit-profile-image.js"; then
            print_success "Profile image edited successfully"
        else
            print_warning "Profile image edit failed, will use placeholder"
        fi
    else
        print_warning "Source image not found: source-profile.jpg"
        print_info "Please save uploaded image as: $SCRIPT_DIR/source-profile.jpg"
        print_info "Skipping profile image edit..."
    fi
    echo ""

    # Step 2: T2I画像生成（残り8枚）
    print_header "Step 2: Generate Remaining Images (T2I)"

    print_info "Generating 8 images (excluding profile photo)..."
    print_info "This will take approximately 20-30 seconds..."
    echo ""

    if node "$SCRIPT_DIR/generate-images.js"; then
        print_success "All images generated successfully"
    else
        print_error "Image generation failed"
        exit 1
    fi
    echo ""

    # Step 3: HTML統合
    print_header "Step 3: Update HTML"

    if node "$SCRIPT_DIR/update-html.js"; then
        print_success "HTML updated with images"
    else
        print_error "HTML update failed"
        exit 1
    fi
    echo ""

    # Step 4: プレビュー
    print_header "Step 4: Preview Presentation"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$SCRIPT_DIR/index.html"
        print_success "Opened presentation in browser"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$SCRIPT_DIR/index.html"
        print_success "Opened presentation in browser"
    else
        print_info "Please open index.html manually"
    fi

    # Summary
    print_header "Summary"

    echo -e "${GREEN}🎉 Asset Generation Complete!${NC}"
    echo ""
    echo "Generated files:"
    if [ -f "$SCRIPT_DIR/images/profile-professional.png" ]; then
        echo "  ✅ images/profile-professional.png (Profile photo)"
    else
        echo "  ⚠️  images/profile-professional.png (Not generated - source missing)"
    fi
    echo "  ✅ images/agent-icons-background.png"
    echo "  ✅ images/github-contributions.png"
    echo "  ✅ images/tool-comparison-arrow.png"
    echo "  ✅ images/ai-levels-pyramid.png"
    echo "  ✅ images/github-os-architecture.png"
    echo "  ✅ images/coding-agents-flowchart.png"
    echo "  ✅ images/rust-performance-comparison.png"
    echo "  ✅ images/github-qr-code.png"
    echo ""
    echo "Updated files:"
    echo "  ✅ index.html (with image references)"
    echo "  💾 index.html.backup (backup created)"
    echo ""
    print_info "Location: $SCRIPT_DIR"
}

main "$@"
