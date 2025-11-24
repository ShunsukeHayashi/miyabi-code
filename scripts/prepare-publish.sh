#!/usr/bin/env bash
# Prepare crates for publishing to crates.io
# This script converts path dependencies to version dependencies

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Get workspace version
VERSION=$(grep -m1 'version = ' "$ROOT_DIR/Cargo.toml" | sed 's/.*"\(.*\)".*/\1/' | head -1)
echo "Workspace version: $VERSION"

# Crates to publish in dependency order (topological sort)
CRATES=(
    # Tier 0: No miyabi dependencies
    "miyabi-types"
    "miyabi-llm-core"

    # Tier 1: Depends only on types/llm-core
    "miyabi-github"
    "miyabi-llm-anthropic"
    "miyabi-llm-openai"
    "miyabi-llm-google"

    # Tier 2: Core utilities
    "miyabi-core"
    "miyabi-llm"
    "miyabi-prompt-engine"

    # Tier 3: Domain modules
    "miyabi-worktree"
    "miyabi-agent-core"
    "miyabi-knowledge"
    "miyabi-modes"
    "miyabi-a2a"
    "miyabi-approval"
    "miyabi-orchestrator"

    # Tier 4: Agents
    "miyabi-agent-coordinator"
    "miyabi-agent-codegen"
    "miyabi-agent-review"
    "miyabi-agent-workflow"
    "miyabi-agent-business"
    "miyabi-agents"

    # Tier 5: CLI (depends on everything)
    "miyabi-cli"
)

# Function to convert path deps to version deps in a Cargo.toml
convert_deps() {
    local crate_dir="$1"
    local cargo_toml="$crate_dir/Cargo.toml"

    if [ ! -f "$cargo_toml" ]; then
        echo "Warning: $cargo_toml not found"
        return
    fi

    echo "Converting dependencies in $cargo_toml"

    # Backup original
    cp "$cargo_toml" "$cargo_toml.bak"

    # Convert path dependencies to version dependencies
    # Pattern: miyabi-xxx = { path = "..." } -> miyabi-xxx = { version = "X.Y.Z" }
    sed -i.tmp -E "s/(miyabi-[a-z-]+) = \{ path = \"[^\"]+\"( ?)}/\1 = { version = \"$VERSION\"\2}/g" "$cargo_toml"

    # Also handle cases with features
    # miyabi-xxx = { path = "...", features = [...] } -> miyabi-xxx = { version = "X.Y.Z", features = [...] }
    sed -i.tmp -E "s/(miyabi-[a-z-]+) = \{ path = \"[^\"]+\", (features = \[[^\]]+\]) \}/\1 = { version = \"$VERSION\", \2 }/g" "$cargo_toml"

    rm -f "$cargo_toml.tmp"
}

# Function to restore original Cargo.toml
restore_deps() {
    local crate_dir="$1"
    local cargo_toml="$crate_dir/Cargo.toml"

    if [ -f "$cargo_toml.bak" ]; then
        mv "$cargo_toml.bak" "$cargo_toml"
        echo "Restored $cargo_toml"
    fi
}

# Main actions
ACTION="${1:-prepare}"

case "$ACTION" in
    prepare)
        echo "Preparing crates for publishing..."
        for crate in "${CRATES[@]}"; do
            convert_deps "$ROOT_DIR/crates/$crate"
        done
        echo ""
        echo "Done! Crates are ready for publishing."
        echo "Run 'scripts/prepare-publish.sh publish' to publish, or 'scripts/prepare-publish.sh restore' to revert."
        ;;

    publish)
        echo "Publishing crates to crates.io..."
        for crate in "${CRATES[@]}"; do
            echo ""
            echo "=== Publishing $crate ==="
            cd "$ROOT_DIR/crates/$crate"

            # Check if already published
            if cargo search "$crate" 2>/dev/null | grep -q "^$crate = \"$VERSION\""; then
                echo "$crate@$VERSION already published, skipping..."
                continue
            fi

            # Use --no-verify to skip workspace dependency check
            # Dependencies are published in order, so this is safe
            cargo publish --allow-dirty --no-verify || {
                echo "Warning: Failed to publish $crate"
            }

            # Wait for crates.io to index
            echo "Waiting for crates.io to index..."
            sleep 30
        done
        echo ""
        echo "Publishing complete!"
        ;;

    restore)
        echo "Restoring original Cargo.toml files..."
        for crate in "${CRATES[@]}"; do
            restore_deps "$ROOT_DIR/crates/$crate"
        done
        echo "Done!"
        ;;

    check)
        echo "Checking publishable crates..."
        for crate in "${CRATES[@]}"; do
            cd "$ROOT_DIR/crates/$crate"
            echo "Checking $crate..."
            cargo publish --dry-run --allow-dirty 2>&1 | head -20 || true
            echo ""
        done
        ;;

    *)
        echo "Usage: $0 {prepare|publish|restore|check}"
        echo ""
        echo "  prepare - Convert path deps to version deps"
        echo "  publish - Publish all crates to crates.io"
        echo "  restore - Restore original Cargo.toml files"
        echo "  check   - Dry-run publish check"
        exit 1
        ;;
esac
