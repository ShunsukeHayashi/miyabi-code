#!/usr/bin/env bash
# Miyabi Headless Context Loader
# Version: 1.0.0
# Purpose: Smart context loading for Claude Code headless mode

set -euo pipefail

MIYABI_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
CONTEXT_CACHE="${CONTEXT_CACHE:-/tmp/miyabi-headless-context}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $*" >&2
}

log_error() {
    echo -e "${RED}✗${NC} $*" >&2
}

# タスクタイプ検出
detect_task_type() {
    local task="$1"
    local task_lower
    task_lower=$(echo "$task" | tr '[:upper:]' '[:lower:]')

    # キーワードベース検出
    if echo "$task_lower" | grep -qE "agent|execute|run|coordinate"; then
        echo "agent_execution"
    elif echo "$task_lower" | grep -qE "implement|code|develop|fix|bug|refactor"; then
        echo "code_implementation"
    elif echo "$task_lower" | grep -qE "issue|label|triage|analyze"; then
        echo "issue_management"
    elif echo "$task_lower" | grep -qE "business|strategy|market|crm|sales|marketing"; then
        echo "business_planning"
    elif echo "$task_lower" | grep -qE "document|doc|readme|guide|write"; then
        echo "documentation"
    elif echo "$task_lower" | grep -qE "test|benchmark|performance|profile"; then
        echo "testing_performance"
    elif echo "$task_lower" | grep -qE "deploy|release|publish|ci|cd"; then
        echo "deployment"
    elif echo "$task_lower" | grep -qE "security|audit|vulnerability|scan"; then
        echo "security"
    else
        echo "general"
    fi
}

# Layer 1: Core Context をロード
load_core_context() {
    local output_file="$1"

    log_info "Loading Core Context (Layer 1)..."

    {
        echo "=== MIYABI CORE CONTEXT ==="
        echo ""
        echo "# Orchestrator Agent Definition"
        echo ""

        if [[ -f "$MIYABI_ROOT/CLAUDE.md" ]]; then
            cat "$MIYABI_ROOT/CLAUDE.md"
        else
            log_warn "CLAUDE.md not found"
        fi

        echo ""
        echo "---"
        echo ""
        echo "# Global Configuration"
        echo ""

        if [[ -f "$HOME/.claude/CLAUDE.md" ]]; then
            cat "$HOME/.claude/CLAUDE.md"
        else
            log_warn "~/.claude/CLAUDE.md not found"
        fi

        echo ""
        echo "---"
        echo ""
        echo "# Core Rules"
        echo ""

        if [[ -f "$MIYABI_ROOT/.claude/context/core-rules.md" ]]; then
            cat "$MIYABI_ROOT/.claude/context/core-rules.md"
        else
            log_warn "core-rules.md not found"
        fi

        echo ""
        echo "---"
        echo ""
        echo "# Architecture Overview"
        echo ""

        if [[ -f "$MIYABI_ROOT/.claude/context/architecture.md" ]]; then
            cat "$MIYABI_ROOT/.claude/context/architecture.md"
        else
            log_warn "architecture.md not found"
        fi

        echo ""
        echo "---"
        echo ""
        echo "# Miyabi Definition Index"
        echo ""

        if [[ -f "$MIYABI_ROOT/miyabi_def/INDEX.yaml" ]]; then
            cat "$MIYABI_ROOT/miyabi_def/INDEX.yaml"
        else
            log_warn "miyabi_def/INDEX.yaml not found"
        fi

        echo ""
        echo "=== END CORE CONTEXT ==="
    } > "$output_file"

    log_success "Core context loaded"
}

# Layer 2: Task-Specific Context をロード
load_task_context() {
    local task_type="$1"
    local output_file="$2"

    log_info "Loading Task-Specific Context (Layer 2): $task_type"

    {
        echo ""
        echo "=== TASK-SPECIFIC CONTEXT: $task_type ==="
        echo ""

        case "$task_type" in
            agent_execution)
                echo "# Agent Execution Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/Skills/agent-execution/SKILL.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/Skills/agent-execution/SKILL.md"
                fi

                echo ""
                echo "---"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/context/worktree.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/context/worktree.md"
                fi

                echo ""
                echo "---"
                echo ""
                echo "# Agent Definitions (YAML)"
                echo '```yaml'

                if [[ -f "$MIYABI_ROOT/miyabi_def/variables/agents.yaml" ]]; then
                    cat "$MIYABI_ROOT/miyabi_def/variables/agents.yaml"
                fi

                echo '```'
                ;;

            code_implementation)
                echo "# Code Implementation Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/context/rust.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/context/rust.md"
                fi

                echo ""
                echo "---"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/context/development.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/context/development.md"
                fi

                echo ""
                echo "---"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/Skills/rust-development/SKILL.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/Skills/rust-development/SKILL.md"
                fi

                echo ""
                echo "---"
                echo ""
                echo "# Crate Definitions (YAML)"
                echo '```yaml'

                if [[ -f "$MIYABI_ROOT/miyabi_def/variables/crates.yaml" ]]; then
                    cat "$MIYABI_ROOT/miyabi_def/variables/crates.yaml"
                fi

                echo '```'
                ;;

            issue_management)
                echo "# Issue Management Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/Skills/issue-analysis/SKILL.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/Skills/issue-analysis/SKILL.md"
                fi

                echo ""
                echo "---"
                echo ""
                echo "# Label System (YAML)"
                echo '```yaml'

                if [[ -f "$MIYABI_ROOT/miyabi_def/variables/labels.yaml" ]]; then
                    cat "$MIYABI_ROOT/miyabi_def/variables/labels.yaml"
                fi

                echo '```'
                echo ""
                echo "---"
                echo ""
                echo "# Workflows (YAML)"
                echo '```yaml'

                if [[ -f "$MIYABI_ROOT/miyabi_def/variables/workflows.yaml" ]]; then
                    cat "$MIYABI_ROOT/miyabi_def/variables/workflows.yaml"
                fi

                echo '```'
                ;;

            business_planning)
                echo "# Business Planning Context"
                echo ""

                if [[ -d "$MIYABI_ROOT/.claude/agents/specs/business" ]]; then
                    for spec_file in "$MIYABI_ROOT/.claude/agents/specs/business"/*.md; do
                        if [[ -f "$spec_file" ]]; then
                            echo "## $(basename "$spec_file" .md)"
                            echo ""
                            cat "$spec_file"
                            echo ""
                            echo "---"
                            echo ""
                        fi
                    done
                fi
                ;;

            documentation)
                echo "# Documentation Generation Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/Skills/documentation-generation/SKILL.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/Skills/documentation-generation/SKILL.md"
                fi

                echo ""
                echo "---"
                echo ""
                echo "# Entity Definitions (YAML)"
                echo '```yaml'

                if [[ -f "$MIYABI_ROOT/miyabi_def/variables/entities.yaml" ]]; then
                    cat "$MIYABI_ROOT/miyabi_def/variables/entities.yaml"
                fi

                echo '```'
                echo ""
                echo "---"
                echo ""
                echo "# Relation Definitions (YAML)"
                echo '```yaml'

                if [[ -f "$MIYABI_ROOT/miyabi_def/variables/relations.yaml" ]]; then
                    cat "$MIYABI_ROOT/miyabi_def/variables/relations.yaml"
                fi

                echo '```'
                ;;

            testing_performance)
                echo "# Testing & Performance Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/Skills/performance-analysis/SKILL.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/Skills/performance-analysis/SKILL.md"
                fi

                echo ""
                echo "---"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/context/rust.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/context/rust.md"
                fi
                ;;

            deployment)
                echo "# Deployment Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/commands/deploy.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/commands/deploy.md"
                fi

                echo ""
                echo "---"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/context/infrastructure.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/context/infrastructure.md"
                fi
                ;;

            security)
                echo "# Security Audit Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/Skills/security-audit/SKILL.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/Skills/security-audit/SKILL.md"
                fi
                ;;

            general)
                echo "# General Task Context"
                echo ""

                if [[ -f "$MIYABI_ROOT/.claude/context/miyabi-definition.md" ]]; then
                    cat "$MIYABI_ROOT/.claude/context/miyabi-definition.md"
                fi
                ;;

            *)
                echo "# Unknown task type: $task_type"
                ;;
        esac

        echo ""
        echo "=== END TASK-SPECIFIC CONTEXT ==="
    } >> "$output_file"

    log_success "Task-specific context loaded: $task_type"
}

# 統合コンテキスト生成
generate_integrated_context() {
    local task="$1"
    local task_type
    task_type=$(detect_task_type "$task")

    local timestamp
    timestamp=$(date +%s)
    local output_file="$CONTEXT_CACHE/integrated-context-${timestamp}.md"

    # キャッシュディレクトリ作成
    mkdir -p "$CONTEXT_CACHE"

    log_info "Task: $task"
    log_info "Detected task type: $task_type"

    # Layer 1: Core Context
    load_core_context "$output_file"

    # Layer 2: Task-Specific Context
    load_task_context "$task_type" "$output_file"

    # メタデータ追加
    {
        echo ""
        echo "=== CONTEXT METADATA ==="
        echo "Generated: $(date -Iseconds)"
        echo "Task: $task"
        echo "Task Type: $task_type"
        echo "File: $output_file"
        echo "Size: $(wc -c < "$output_file") bytes"
        echo "==="
    } >> "$output_file"

    log_success "Integrated context generated: $output_file"
    echo "$output_file"
}

# メイン処理
main() {
    if [[ $# -eq 0 ]]; then
        log_error "Usage: $0 <task_description>"
        exit 1
    fi

    local task="$*"

    # 統合コンテキスト生成
    local context_file
    context_file=$(generate_integrated_context "$task")

    # 結果出力
    echo "$context_file"
}

main "$@"
