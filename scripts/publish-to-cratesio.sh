#!/bin/bash
set -e

# Miyabi crates.io Publishing Script
# Usage: ./scripts/publish-to-cratesio.sh [crate-name] [--dry-run]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Publishing order (dependency-based)
PUBLISH_ORDER=(
    # Phase 1: Foundation
    "miyabi-types"
    "miyabi-core"
    
    # Phase 2: Core Services
    "miyabi-llm"
    "miyabi-github"
    "miyabi-worktree"
    
    # Phase 3: Knowledge & Agent Core
    "miyabi-knowledge"
    "miyabi-agent-core"
    
    # Phase 4: Specialized Agents
    "miyabi-agent-coordinator"
    "miyabi-agent-codegen"
    "miyabi-agent-review"
    "miyabi-agent-workflow"
    "miyabi-agent-business"
    "miyabi-agent-integrations"
    "miyabi-agent-issue"
    
    # Phase 5: Aggregation
    "miyabi-agents"
    
    # Phase 6: Orchestration & CLI
    "miyabi-orchestrator"
    "miyabi-modes"
    "miyabi-cli"
    
    # Phase 7: Specialized Services
    "miyabi-webhook"
    "miyabi-mcp-server"
    "miyabi-discord-mcp-server"
    "miyabi-web-api"
    "miyabi-a2a"
    "miyabi-benchmark"
    "miyabi-session-manager"
    "miyabi-claudable"
    
    # Phase 8: E2E Tests
    "miyabi-e2e-tests"
    "miyabi-agent-swml"
)

check_credentials() {
    echo -e "${BLUE}Checking crates.io credentials...${NC}"
    if [ ! -f ~/.cargo/credentials.toml ] && [ ! -f ~/.cargo/credentials ]; then
        echo -e "${RED}❌ No crates.io credentials found${NC}"
        echo -e "${YELLOW}Please run: cargo login${NC}"
        echo -e "${YELLOW}Get your token from: https://crates.io/me${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Credentials found${NC}"
}

check_crate() {
    local crate=$1
    local crate_path="$PROJECT_ROOT/crates/$crate"
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📦 Checking: $crate${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ ! -d "$crate_path" ]; then
        echo -e "${RED}❌ Crate directory not found: $crate_path${NC}"
        return 1
    fi
    
    # Check Cargo.toml
    if [ ! -f "$crate_path/Cargo.toml" ]; then
        echo -e "${RED}❌ Cargo.toml not found${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Cargo.toml exists${NC}"
    
    # Check README
    if [ ! -f "$crate_path/README.md" ]; then
        echo -e "${YELLOW}⚠️  README.md not found (recommended)${NC}"
    else
        echo -e "${GREEN}✅ README.md exists${NC}"
    fi
    
    # Check license
    local license=$(grep -E "^license\s*=" "$crate_path/Cargo.toml" || echo "")
    if [ -z "$license" ]; then
        echo -e "${YELLOW}⚠️  License not specified in Cargo.toml${NC}"
    else
        echo -e "${GREEN}✅ License: $license${NC}"
    fi
    
    # Check if already published
    local version=$(grep -E "^version\s*=" "$crate_path/Cargo.toml" | head -1 | sed -E 's/.*"(.*)".*/\1/')
    echo -e "${BLUE}📌 Version: $version${NC}"
    
    local published=$(cargo search "$crate" --limit 1 2>/dev/null | grep "^$crate " || echo "")
    if [ -n "$published" ]; then
        echo -e "${YELLOW}⚠️  Already published on crates.io:${NC}"
        echo -e "${YELLOW}   $published${NC}"
    else
        echo -e "${GREEN}✅ Not yet published - ready for first release${NC}"
    fi
    
    return 0
}

publish_crate() {
    local crate=$1
    local dry_run=$2
    local crate_path="$PROJECT_ROOT/crates/$crate"
    
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🚀 Publishing: $crate${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$crate_path"
    
    # Build and test
    echo -e "${BLUE}🔨 Building...${NC}"
    cargo build --release
    
    echo -e "${BLUE}🧪 Testing...${NC}"
    cargo test
    
    echo -e "${BLUE}📋 Checking package...${NC}"
    cargo package --allow-dirty
    
    if [ "$dry_run" = "true" ]; then
        echo -e "${YELLOW}🏃 Dry run - skipping actual publish${NC}"
        cargo publish --dry-run --allow-dirty
    else
        echo -e "${GREEN}📤 Publishing to crates.io...${NC}"
        cargo publish --allow-dirty
        
        echo -e "${GREEN}✅ Published $crate successfully!${NC}"
        echo -e "${BLUE}Waiting 30 seconds for crates.io to index...${NC}"
        sleep 30
    fi
    
    cd "$PROJECT_ROOT"
}

publish_all() {
    local dry_run=$1
    
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Miyabi Crates Publishing Pipeline${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}Total crates: ${#PUBLISH_ORDER[@]}${NC}"
    
    if [ "$dry_run" = "true" ]; then
        echo -e "${YELLOW}Mode: DRY RUN${NC}\n"
    else
        echo -e "${GREEN}Mode: LIVE PUBLISH${NC}\n"
    fi
    
    local success_count=0
    local fail_count=0
    local failed_crates=()
    
    for crate in "${PUBLISH_ORDER[@]}"; do
        if check_crate "$crate"; then
            if publish_crate "$crate" "$dry_run"; then
                ((success_count++))
            else
                echo -e "${RED}❌ Failed to publish: $crate${NC}"
                ((fail_count++))
                failed_crates+=("$crate")
            fi
        else
            echo -e "${RED}❌ Pre-check failed: $crate${NC}"
            ((fail_count++))
            failed_crates+=("$crate")
        fi
    done
    
    echo -e "\n${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Publishing Summary${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Success: $success_count${NC}"
    echo -e "${RED}❌ Failed: $fail_count${NC}"
    
    if [ ${#failed_crates[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed crates:${NC}"
        for crate in "${failed_crates[@]}"; do
            echo -e "${RED}  - $crate${NC}"
        done
        exit 1
    fi
    
    echo -e "\n${GREEN}🎉 All crates published successfully!${NC}"
}

# Main
main() {
    check_credentials
    
    if [ $# -eq 0 ]; then
        echo "Usage: $0 [all|crate-name] [--dry-run]"
        echo ""
        echo "Examples:"
        echo "  $0 all                    # Publish all crates (LIVE)"
        echo "  $0 all --dry-run          # Dry run all crates"
        echo "  $0 miyabi-types           # Publish single crate"
        echo "  $0 miyabi-types --dry-run # Dry run single crate"
        exit 1
    fi
    
    local target=$1
    local dry_run=false
    
    if [ "$2" = "--dry-run" ]; then
        dry_run=true
    fi
    
    if [ "$target" = "all" ]; then
        publish_all "$dry_run"
    else
        check_crate "$target"
        publish_crate "$target" "$dry_run"
    fi
}

main "$@"
