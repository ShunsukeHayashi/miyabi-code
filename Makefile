# Miyabi - Complete Autonomous AI Development Operations Platform
# Makefile for common development tasks

.PHONY: help build test clippy fmt check clean doc audit install run
.PHONY: build-release build-all test-all test-unit test-integration
.PHONY: mcp-list mcp-install pitch-deck watch
.PHONY: quick full

# Default target
.DEFAULT_GOAL := help

# Tools
CARGO := $(shell which cargo 2>/dev/null || echo "$(HOME)/.cargo/bin/cargo")
RUSTUP := $(shell which rustup 2>/dev/null || echo "$(HOME)/.cargo/bin/rustup")

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Help target
help:
	@echo "$(BLUE)Miyabi - Development Makefile$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC) make [target]"
	@echo ""
	@echo "$(YELLOW)Common Targets:$(NC)"
	@echo "  $(GREEN)quick$(NC)         - Quick check (fmt + clippy)"
	@echo "  $(GREEN)full$(NC)          - Full check (fmt + clippy + test)"
	@echo "  $(GREEN)build$(NC)         - Build all workspace crates"
	@echo "  $(GREEN)test$(NC)          - Run all tests"
	@echo "  $(GREEN)run$(NC)           - Run miyabi CLI"
	@echo ""
	@echo "$(YELLOW)Build Targets:$(NC)"
	@echo "  $(GREEN)build-release$(NC) - Build optimized release binaries"
	@echo "  $(GREEN)build-all$(NC)     - Build with all features"
	@echo "  $(GREEN)clean$(NC)         - Clean build artifacts"
	@echo ""
	@echo "$(YELLOW)Test Targets:$(NC)"
	@echo "  $(GREEN)test-all$(NC)      - Run all tests (unit + integration)"
	@echo "  $(GREEN)test-unit$(NC)     - Run unit tests only"
	@echo "  $(GREEN)test-integration$(NC) - Run integration tests only"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  $(GREEN)check$(NC)         - Run cargo check"
	@echo "  $(GREEN)clippy$(NC)        - Run clippy linter"
	@echo "  $(GREEN)fmt$(NC)           - Format code with rustfmt"
	@echo "  $(GREEN)audit$(NC)         - Audit dependencies for security issues"
	@echo ""
	@echo "$(YELLOW)Documentation:$(NC)"
	@echo "  $(GREEN)doc$(NC)           - Generate and open documentation"
	@echo ""
	@echo "$(YELLOW)MCP Servers:$(NC)"
	@echo "  $(GREEN)mcp-list$(NC)      - List all MCP servers"
	@echo "  $(GREEN)mcp-install$(NC)   - Install MCP server dependencies"
	@echo ""
	@echo "$(YELLOW)Pitch Deck:$(NC)"
	@echo "  $(GREEN)pitch-deck$(NC)    - Build pitch deck (all formats)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  $(GREEN)watch$(NC)         - Watch for changes and rebuild"
	@echo ""

# Quick development check
quick: fmt clippy
	@echo "$(GREEN)✅ Quick check passed!$(NC)"

# Full check before commit
full: fmt clippy test
	@echo "$(GREEN)✅ Full check passed!$(NC)"

# Build targets
build:
	@echo "$(BLUE)🔨 Building workspace...$(NC)"
	$(CARGO) build --workspace
	@echo "$(GREEN)✅ Build complete$(NC)"

build-release:
	@echo "$(BLUE)🔨 Building release binaries...$(NC)"
	$(CARGO) build --workspace --release
	@echo "$(GREEN)✅ Release build complete$(NC)"
	@ls -lh target/release/miyabi* 2>/dev/null || true

build-all:
	@echo "$(BLUE)🔨 Building with all features...$(NC)"
	$(CARGO) build --workspace --all-features
	@echo "$(GREEN)✅ Build complete$(NC)"

# Test targets
test:
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	$(CARGO) test --workspace
	@echo "$(GREEN)✅ Tests passed$(NC)"

test-all:
	@echo "$(BLUE)🧪 Running all tests...$(NC)"
	$(CARGO) test --workspace --all-features
	@echo "$(GREEN)✅ All tests passed$(NC)"

test-unit:
	@echo "$(BLUE)🧪 Running unit tests...$(NC)"
	$(CARGO) test --workspace --lib
	@echo "$(GREEN)✅ Unit tests passed$(NC)"

test-integration:
	@echo "$(BLUE)🧪 Running integration tests...$(NC)"
	$(CARGO) test --workspace --test '*'
	@echo "$(GREEN)✅ Integration tests passed$(NC)"

# Code quality
check:
	@echo "$(BLUE)🔍 Running cargo check...$(NC)"
	$(CARGO) check --workspace --all-features
	@echo "$(GREEN)✅ Check passed$(NC)"

clippy:
	@echo "$(BLUE)📎 Running clippy...$(NC)"
	$(CARGO) clippy --workspace --all-features -- -D warnings
	@echo "$(GREEN)✅ Clippy passed$(NC)"

fmt:
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	$(CARGO) fmt --all -- --check
	@echo "$(GREEN)✅ Format check passed$(NC)"

fmt-fix:
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	$(CARGO) fmt --all
	@echo "$(GREEN)✅ Code formatted$(NC)"

audit:
	@echo "$(BLUE)🔒 Auditing dependencies...$(NC)"
	$(CARGO) audit
	@echo "$(GREEN)✅ Audit complete$(NC)"

# Documentation
doc:
	@echo "$(BLUE)📚 Generating documentation...$(NC)"
	$(CARGO) doc --workspace --all-features --no-deps --open
	@echo "$(GREEN)✅ Documentation generated$(NC)"

# Clean
clean:
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	$(CARGO) clean
	@echo "$(GREEN)✅ Clean complete$(NC)"

# Install dependencies
install:
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	@echo "$(YELLOW)Installing Rust toolchain components...$(NC)"
	$(RUSTUP) component add rustfmt clippy
	@echo "$(YELLOW)Installing cargo tools...$(NC)"
	$(CARGO) install cargo-audit || true
	$(CARGO) install cargo-watch || true
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

# Run miyabi CLI
run:
	@echo "$(BLUE)🚀 Running Miyabi CLI...$(NC)"
	$(CARGO) run --bin miyabi -- $(ARGS)

# MCP Servers
mcp-list:
	@echo "$(BLUE)📋 MCP Servers:$(NC)"
	@find mcp-servers -maxdepth 1 -type d -not -name mcp-servers | sed 's|mcp-servers/||' | sort

mcp-install:
	@echo "$(BLUE)📦 Installing MCP server dependencies...$(NC)"
	@for dir in mcp-servers/*/; do \
		if [ -f "$$dir/package.json" ]; then \
			echo "$(YELLOW)Installing: $$dir$(NC)"; \
			cd "$$dir" && npm install && cd ../..; \
		fi \
	done
	@echo "$(GREEN)✅ MCP dependencies installed$(NC)"

# Pitch Deck
pitch-deck:
	@echo "$(BLUE)🎨 Building pitch deck...$(NC)"
	@$(MAKE) -C docs/pitch-deck all
	@echo "$(GREEN)✅ Pitch deck built$(NC)"

# Watch mode
watch:
	@echo "$(BLUE)👀 Watching for changes...$(NC)"
	$(CARGO) watch -x 'check --workspace' -x 'test --workspace'

# Development convenience targets
dev: build test
	@echo "$(GREEN)✅ Development build complete$(NC)"

ci: fmt check clippy test
	@echo "$(GREEN)✅ CI checks passed$(NC)"
