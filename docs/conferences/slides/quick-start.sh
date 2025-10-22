#!/bin/bash

###############################################################################
# Miyabi Presentation T2I Quick Start Script
# Automates the entire workflow from API test to presentation preview
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

###############################################################################
# Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        print_info "Install from: https://nodejs.org"
        exit 1
    fi

    NODE_VERSION=$(node --version)
    print_success "Node.js detected: $NODE_VERSION"
}

check_api_key() {
    if [ -z "$BYTEPLUS_API_KEY" ]; then
        print_error "BYTEPLUS_API_KEY environment variable not set"
        echo ""
        print_info "Set it using:"
        echo "  export BYTEPLUS_API_KEY=your_api_key_here"
        echo ""
        print_info "Or add to ~/.bashrc or ~/.zshrc:"
        echo "  echo 'export BYTEPLUS_API_KEY=your_api_key' >> ~/.bashrc"
        echo "  source ~/.bashrc"
        exit 1
    fi

    print_success "BYTEPLUS_API_KEY is set"
}

test_api() {
    print_header "Step 1: Testing API Connection"

    cd "$SCRIPT_DIR"

    if node test-api.js; then
        print_success "API test passed"
        return 0
    else
        print_error "API test failed"
        print_warning "Please check your API key and network connection"
        exit 1
    fi
}

generate_images() {
    print_header "Step 2: Generating Images (9 images)"

    cd "$SCRIPT_DIR"

    print_info "This will take approximately 20-30 seconds..."
    echo ""

    if node generate-images.js; then
        print_success "All images generated successfully"
        return 0
    else
        print_error "Image generation failed"
        print_warning "Check the error messages above"
        exit 1
    fi
}

update_html() {
    print_header "Step 3: Updating HTML"

    cd "$SCRIPT_DIR"

    if node update-html.js; then
        print_success "HTML updated successfully"
        return 0
    else
        print_error "HTML update failed"
        exit 1
    fi
}

open_presentation() {
    print_header "Step 4: Opening Presentation"

    cd "$SCRIPT_DIR"

    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open index.html
        print_success "Opened presentation in default browser (macOS)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open index.html
        print_success "Opened presentation in default browser (Linux)"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        start index.html
        print_success "Opened presentation in default browser (Windows)"
    else
        print_warning "Unknown OS. Please open index.html manually"
    fi
}

print_summary() {
    print_header "Summary"

    echo -e "${GREEN}🎉 Presentation Ready!${NC}"
    echo ""
    echo "Generated files:"
    echo "  📄 index.html (updated with images)"
    echo "  📁 images/ (9 AI-generated images)"
    echo "  💾 index.html.backup (backup)"
    echo ""
    echo "Next steps:"
    echo "  1. Review the presentation in your browser"
    echo "  2. Press '?' in the presentation for keyboard shortcuts"
    echo "  3. Press 'f' for fullscreen mode"
    echo "  4. Press 's' for speaker notes"
    echo ""
    print_info "Files location: $SCRIPT_DIR"
}

###############################################################################
# Main Script
###############################################################################

main() {
    clear

    print_header "Miyabi Presentation T2I Quick Start"

    echo "This script will:"
    echo "  1. Test API connection"
    echo "  2. Generate 9 AI images (20-30 seconds)"
    echo "  3. Update HTML with generated images"
    echo "  4. Open presentation in browser"
    echo ""

    # Check prerequisites
    print_info "Checking prerequisites..."
    check_node
    check_api_key
    echo ""

    # Confirm execution
    read -p "Continue? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cancelled by user"
        exit 0
    fi

    # Execute workflow
    test_api
    generate_images
    update_html
    open_presentation

    # Print summary
    print_summary
}

###############################################################################
# Script Options
###############################################################################

# Handle flags
case "${1:-}" in
    --help|-h)
        echo "Miyabi Presentation T2I Quick Start Script"
        echo ""
        echo "Usage:"
        echo "  ./quick-start.sh           Run full workflow"
        echo "  ./quick-start.sh --test    Test API only"
        echo "  ./quick-start.sh --gen     Generate images only"
        echo "  ./quick-start.sh --update  Update HTML only"
        echo "  ./quick-start.sh --open    Open presentation only"
        echo "  ./quick-start.sh --help    Show this help"
        echo ""
        echo "Prerequisites:"
        echo "  - Node.js v14+"
        echo "  - BYTEPLUS_API_KEY environment variable"
        echo ""
        exit 0
        ;;
    --test)
        print_header "API Test Only"
        check_node
        check_api_key
        test_api
        exit 0
        ;;
    --gen)
        print_header "Generate Images Only"
        check_node
        check_api_key
        test_api
        generate_images
        exit 0
        ;;
    --update)
        print_header "Update HTML Only"
        check_node
        update_html
        exit 0
        ;;
    --open)
        print_header "Open Presentation Only"
        open_presentation
        exit 0
        ;;
    "")
        # No flag, run full workflow
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
