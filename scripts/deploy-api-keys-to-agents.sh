#!/bin/bash
# =============================================================================
# Miyabi API Keys Deployment to 200 Agents
# =============================================================================
# Purpose: Deploy API keys to MUGEN (Agent-001~100) and MAJIN (Agent-101~200)
# Issue: #841
# Version: 1.0
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MUGEN_HOST="mugen"
MAJIN_HOST="majin"
AGENT_BASE_DIR="/home/ubuntu/miyabi-agents"
ENV_TEMPLATE_FILE=".env.agent.template"

# Required API Keys (from local environment or .env)
REQUIRED_KEYS=(
    "ANTHROPIC_API_KEY"
    "GITHUB_TOKEN"
    "GEMINI_API_KEY"
    "OPENAI_API_KEY"
    "GROQ_API_KEY"
    "LARK_APP_ID"
    "LARK_APP_SECRET"
)

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load API keys from environment or .env file
load_api_keys() {
    log_info "Loading API keys from environment..."

    # Source .env if exists
    if [ -f ".env" ]; then
        log_info "Sourcing .env file..."
        set -a
        source .env
        set +a
    fi

    # Source local environment
    if [ -f "$HOME/.miyabi_env" ]; then
        log_info "Sourcing ~/.miyabi_env..."
        set -a
        source "$HOME/.miyabi_env"
        set +a
    fi

    # Check required keys
    local missing_keys=()
    for key in "${REQUIRED_KEYS[@]}"; do
        if [ -z "${!key}" ]; then
            missing_keys+=("$key")
        fi
    done

    if [ ${#missing_keys[@]} -gt 0 ]; then
        log_warning "Missing optional keys: ${missing_keys[*]}"
        log_info "Only ANTHROPIC_API_KEY and GITHUB_TOKEN are strictly required"
    fi

    # Verify critical keys
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        log_error "ANTHROPIC_API_KEY is required!"
        exit 1
    fi

    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "GITHUB_TOKEN is required!"
        exit 1
    fi

    log_success "API keys loaded"
}

# Generate .env content for agents
generate_env_content() {
    local agent_id="$1"

    cat << EOF
# =============================================================================
# Miyabi Agent Environment - Agent-${agent_id}
# =============================================================================
# Generated: $(date)
# Issue: #841
# =============================================================================

# LLM API Keys
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY:-}
GEMINI_API_KEY=${GEMINI_API_KEY:-}
GROQ_API_KEY=${GROQ_API_KEY:-}

# GitHub
GITHUB_TOKEN=${GITHUB_TOKEN}
GITHUB_REPOSITORY=customer-cloud/miyabi-private
GITHUB_REPOSITORY_OWNER=customer-cloud

# Lark Integration
LARK_APP_ID=${LARK_APP_ID:-}
LARK_APP_SECRET=${LARK_APP_SECRET:-}

# Agent Configuration
AGENT_ID=${agent_id}
DEVICE_IDENTIFIER=miyabi-agent-${agent_id}

# Logging
RUST_LOG=info
LOG_DIRECTORY=/home/ubuntu/miyabi-agents/agent-${agent_id}/logs

# Workspace
WORKTREE_BASE_DIR=/home/ubuntu/miyabi-agents/agent-${agent_id}/worktrees
USE_WORKTREE=true

# Performance
DEFAULT_CONCURRENCY=2
EOF
}

# Deploy to single agent
deploy_to_agent() {
    local host="$1"
    local agent_id="$2"
    local agent_dir="${AGENT_BASE_DIR}/agent-${agent_id}"

    log_info "Deploying to Agent-${agent_id} on ${host}..."

    # Create directory structure
    ssh "$host" "mkdir -p ${agent_dir}/{logs,worktrees,config}"

    # Generate and deploy .env
    generate_env_content "$agent_id" | ssh "$host" "cat > ${agent_dir}/.env"

    # Set permissions
    ssh "$host" "chmod 600 ${agent_dir}/.env"

    log_success "Agent-${agent_id} configured"
}

# Deploy to host range
deploy_to_host() {
    local host="$1"
    local start_id="$2"
    local end_id="$3"

    log_info "Deploying to ${host} (Agent-${start_id} to Agent-${end_id})..."

    # Create base directory
    ssh "$host" "mkdir -p ${AGENT_BASE_DIR}"

    for ((i=start_id; i<=end_id; i++)); do
        local agent_id=$(printf "%03d" $i)
        deploy_to_agent "$host" "$agent_id"
    done

    log_success "Completed deployment to ${host}"
}

# Verify deployment
verify_deployment() {
    local host="$1"
    local agent_id="$2"
    local agent_dir="${AGENT_BASE_DIR}/agent-${agent_id}"

    # Check if .env exists and has content
    local env_check=$(ssh "$host" "[ -f ${agent_dir}/.env ] && grep -c ANTHROPIC_API_KEY ${agent_dir}/.env 2>/dev/null || echo 0")

    if [ "$env_check" -ge 1 ]; then
        echo -e "${GREEN}[PASS]${NC} Agent-${agent_id}"
        return 0
    else
        echo -e "${RED}[FAIL]${NC} Agent-${agent_id}"
        return 1
    fi
}

# Full verification
verify_all() {
    log_info "Verifying all deployments..."

    local failed=0

    # Verify MUGEN (001-100)
    log_info "Verifying MUGEN agents..."
    for ((i=1; i<=100; i++)); do
        local agent_id=$(printf "%03d" $i)
        if ! verify_deployment "$MUGEN_HOST" "$agent_id"; then
            ((failed++))
        fi
    done

    # Verify MAJIN (101-200)
    log_info "Verifying MAJIN agents..."
    for ((i=101; i<=200; i++)); do
        local agent_id=$(printf "%03d" $i)
        if ! verify_deployment "$MAJIN_HOST" "$agent_id"; then
            ((failed++))
        fi
    done

    if [ $failed -eq 0 ]; then
        log_success "All 200 agents verified successfully!"
    else
        log_error "${failed} agents failed verification"
        return 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all       Deploy to all 200 agents (MUGEN + MAJIN)"
    echo "  mugen     Deploy to MUGEN only (Agent-001~100)"
    echo "  majin     Deploy to MAJIN only (Agent-101~200)"
    echo "  verify    Verify all deployments"
    echo "  single    Deploy to single agent (requires AGENT_ID env)"
    echo ""
    echo "Environment:"
    echo "  ANTHROPIC_API_KEY  Required"
    echo "  GITHUB_TOKEN       Required"
    echo "  Other keys         Optional"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} Miyabi API Keys Deployment${NC}"
    echo -e "${BLUE} Target: 200 Agents (MUGEN + MAJIN)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    local command="${1:-all}"

    case "$command" in
        all)
            load_api_keys
            log_info "Starting full deployment to 200 agents..."
            deploy_to_host "$MUGEN_HOST" 1 100
            deploy_to_host "$MAJIN_HOST" 101 200
            verify_all
            ;;
        mugen)
            load_api_keys
            deploy_to_host "$MUGEN_HOST" 1 100
            log_info "Verifying MUGEN agents..."
            for ((i=1; i<=100; i++)); do
                verify_deployment "$MUGEN_HOST" "$(printf "%03d" $i)"
            done
            ;;
        majin)
            load_api_keys
            deploy_to_host "$MAJIN_HOST" 101 200
            log_info "Verifying MAJIN agents..."
            for ((i=101; i<=200; i++)); do
                verify_deployment "$MAJIN_HOST" "$(printf "%03d" $i)"
            done
            ;;
        verify)
            verify_all
            ;;
        single)
            load_api_keys
            if [ -z "$AGENT_ID" ]; then
                log_error "AGENT_ID environment variable required"
                exit 1
            fi
            if [ "$AGENT_ID" -le 100 ]; then
                deploy_to_agent "$MUGEN_HOST" "$(printf "%03d" $AGENT_ID)"
            else
                deploy_to_agent "$MAJIN_HOST" "$(printf "%03d" $AGENT_ID)"
            fi
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac

    echo ""
    log_success "Deployment script completed!"
    echo ""
}

main "$@"
