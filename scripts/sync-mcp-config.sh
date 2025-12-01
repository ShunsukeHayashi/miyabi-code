#!/usr/bin/env bash
# =============================================================================
# Miyabi MCP Config Sync Script
# =============================================================================
# 
# 3つの環境用にMCP設定を同期:
#   1. miyabi      - Miyabi開発環境（フル機能）
#   2. chatgpt     - ChatGPT + Appli Connector用
#   3. claude-code - Claude Code + Appli Connector用
#
# Usage:
#   ./scripts/sync-mcp-config.sh [environment]
#
# Examples:
#   ./scripts/sync-mcp-config.sh miyabi
#   ./scripts/sync-mcp-config.sh chatgpt
#   ./scripts/sync-mcp-config.sh claude-code
#   TARGET_HOME=$(pwd)/.home ./scripts/sync-mcp-config.sh claude-code
#
# =============================================================================
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get repo root
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_home="${TARGET_HOME:-$HOME}"

# Config paths
configs_dir="${repo_root}/.claude/configs"
claude_desktop_dir="${target_home}/.config/claude-desktop"
claude_debug_dir="${target_home}/.claude/debug"

# Available environments
declare -A ENV_CONFIGS=(
  ["miyabi"]="mcp-miyabi.json"
  ["chatgpt"]="mcp-chatgpt-appli.json"
  ["claude-code"]="mcp-claude-code-appli.json"
)

declare -A ENV_DESCRIPTIONS=(
  ["miyabi"]="Miyabi Full Development (all agents, tools, integrations)"
  ["chatgpt"]="ChatGPT + Appli Connector (task API, read-only GitHub)"
  ["claude-code"]="Claude Code + Appli Connector (core agents, filesystem)"
)

# Print usage
usage() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Miyabi MCP Config Sync${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Usage:${NC}"
  echo "  $0 <environment>"
  echo ""
  echo -e "${YELLOW}Available environments:${NC}"
  for env in "${!ENV_CONFIGS[@]}"; do
    printf "  ${GREEN}%-12s${NC} - %s\n" "$env" "${ENV_DESCRIPTIONS[$env]}"
  done
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  TARGET_HOME=<path>  Override target HOME directory"
  echo ""
  echo -e "${YELLOW}Examples:${NC}"
  echo "  $0 miyabi                           # Sync Miyabi config to \$HOME"
  echo "  $0 claude-code                      # Sync Claude Code config"
  echo "  TARGET_HOME=/tmp/test $0 chatgpt    # Sync to custom directory"
  echo ""
  exit 1
}

# Validate environment
validate_env() {
  local env="$1"
  if [[ ! -v "ENV_CONFIGS[$env]" ]]; then
    echo -e "${RED}Error: Unknown environment '$env'${NC}"
    echo ""
    usage
  fi
}

# Create required directories
create_dirs() {
  echo -e "${BLUE}Creating directories...${NC}"
  mkdir -p "${claude_desktop_dir}"
  mkdir -p "${claude_debug_dir}"
  echo -e "  ${GREEN}✓${NC} ${claude_desktop_dir}"
  echo -e "  ${GREEN}✓${NC} ${claude_debug_dir}"
}

# Sync config
sync_config() {
  local env="$1"
  local config_file="${ENV_CONFIGS[$env]}"
  local src_config="${configs_dir}/${config_file}"
  local dst_config="${claude_desktop_dir}/claude_desktop_config.json"

  if [[ ! -f "${src_config}" ]]; then
    echo -e "${RED}Error: Source config not found: ${src_config}${NC}"
    exit 1
  fi

  echo -e "${BLUE}Syncing config...${NC}"
  echo -e "  Source: ${src_config}"
  echo -e "  Target: ${dst_config}"

  # Create temp file for processing
  local tmp_file
  tmp_file="$(mktemp)"

  # Replace repo paths if different
  perl -pe 's|/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private|'"${repo_root}"'|g' "${src_config}" > "${tmp_file}"

  # Move to destination
  mv "${tmp_file}" "${dst_config}"
  chmod 600 "${dst_config}"

  echo -e "  ${GREEN}✓${NC} Config synced successfully"
}

# Show summary
show_summary() {
  local env="$1"
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Sync Complete: ${env}${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Config synced to:${NC}"
  echo "  ${claude_desktop_dir}/claude_desktop_config.json"
  echo ""
  echo -e "${YELLOW}To verify:${NC}"
  echo "  HOME=\"${target_home}\" claude mcp list"
  echo ""
  
  case "$env" in
    miyabi)
      echo -e "${YELLOW}Miyabi Development Commands:${NC}"
      echo "  claude mcp list                    # List all MCP servers"
      echo "  claude --mcp miyabi 'task'         # Use Miyabi agent"
      ;;
    chatgpt)
      echo -e "${YELLOW}ChatGPT Integration:${NC}"
      echo "  1. Start Appli Connector: appli-connector start --config ${configs_dir}/mcp-chatgpt-appli.json"
      echo "  2. Configure ChatGPT Custom GPT with the endpoint URL"
      ;;
    claude-code)
      echo -e "${YELLOW}Claude Code Commands:${NC}"
      echo "  claude mcp list                    # List MCP servers"
      echo "  claude code 'implement feature'    # Start coding task"
      ;;
  esac
  echo ""
}

# Main
main() {
  if [[ $# -lt 1 ]]; then
    usage
  fi

  local env="$1"
  validate_env "$env"

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Miyabi MCP Config Sync${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "Environment: ${GREEN}${env}${NC} - ${ENV_DESCRIPTIONS[$env]}"
  echo -e "Target HOME: ${target_home}"
  echo -e "Repo Root:   ${repo_root}"
  echo ""

  create_dirs
  sync_config "$env"
  show_summary "$env"
}

main "$@"
