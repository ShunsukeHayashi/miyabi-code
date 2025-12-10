#!/usr/bin/env bash
# ============================================================
# A2A Plugin Management System
# Version: 5.0.0 - Plugin Architecture Edition
# Protocol: MIYABI-A2A-P5.0 Plugin-Enhanced
# ============================================================

set -euo pipefail

# Plugin System Configuration
readonly PLUGIN_MANAGER_VERSION="5.0.0"
readonly PLUGINS_DIR="${MIYABI_A2A_PLUGINS:-$HOME/.miyabi/plugins}"
readonly PLUGIN_REGISTRY="${MIYABI_A2A_REGISTRY:-$HOME/.miyabi/plugin-registry.json}"
readonly PLUGIN_CACHE_DIR="${MIYABI_A2A_PLUGIN_CACHE:-$HOME/.miyabi/plugin-cache}"

# Plugin categories
readonly PLUGIN_CATEGORIES=(
    "communication"    # Message routing and delivery
    "ai-integration"   # AI service connectors
    "monitoring"       # System monitoring and metrics
    "visualization"    # Dashboard and UI components
    "automation"       # Workflow and task automation
    "security"         # Authentication and encryption
    "storage"          # Data persistence and backup
    "external-api"     # Third-party service integrations
)

# Source advanced framework
CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$CURRENT_SCRIPT_DIR/../a2a-advanced.sh"

# Plugin System Colors
readonly PLUGIN_GREEN='\033[38;5;46m'
readonly PLUGIN_BLUE='\033[38;5;39m'
readonly PLUGIN_PURPLE='\033[38;5;93m'
readonly PLUGIN_ORANGE='\033[38;5;208m'
readonly PLUGIN_PINK='\033[38;5;205m'
readonly PINK='\033[38;5;205m'

# Unicode symbols for plugins
readonly SYMBOL_PLUGIN="🔌"
readonly SYMBOL_INSTALL="📦"
readonly SYMBOL_UNINSTALL="🗑️"
readonly SYMBOL_UPDATE="🔄"
readonly SYMBOL_REGISTRY="📋"
readonly SYMBOL_CONFIG="⚙️"

# ------------------------------------------------------------
# Plugin Management Core Functions
# ------------------------------------------------------------

ensure_plugin_dirs() {
    mkdir -p "$PLUGINS_DIR" "$PLUGIN_CACHE_DIR"
    [[ -f "$PLUGIN_REGISTRY" ]] || echo '{"plugins": {}, "categories": {}}' > "$PLUGIN_REGISTRY"
}

plugin_info() {
    echo -e "${BOLD}${PLUGIN_PURPLE}${SYMBOL_PLUGIN} A2A Plugin Manager v${PLUGIN_MANAGER_VERSION}${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${PLUGIN_BLUE}Plugin Directory:${RESET} $PLUGINS_DIR"
    echo -e "${PLUGIN_BLUE}Registry File:${RESET} $PLUGIN_REGISTRY"
    echo -e "${PLUGIN_BLUE}Cache Directory:${RESET} $PLUGIN_CACHE_DIR"
    echo ""

    # Show installed plugins count
    local installed_count=0
    if [[ -d "$PLUGINS_DIR" ]]; then
        installed_count=$(find "$PLUGINS_DIR" -name "*.plugin.sh" | wc -l | tr -d ' ')
    fi

    echo -e "${PLUGIN_GREEN}Installed Plugins:${RESET} $installed_count"
    echo -e "${PLUGIN_ORANGE}Available Categories:${RESET} ${#PLUGIN_CATEGORIES[@]}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

list_plugins() {
    local category="${1:-all}"

    ensure_plugin_dirs

    echo -e "${BOLD}${PLUGIN_PURPLE}📋 Installed Plugins${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ ! -d "$PLUGINS_DIR" ]] || [[ -z "$(ls -A "$PLUGINS_DIR" 2>/dev/null)" ]]; then
        echo -e "${DIM}No plugins installed yet${RESET}"
        echo ""
        echo "💡 Try installing a plugin:"
        echo "   $0 install-sample"
        echo "   $0 browse-registry"
        return
    fi

    local count=0
    for plugin_file in "$PLUGINS_DIR"/*.plugin.sh; do
        [[ -f "$plugin_file" ]] || continue

        local plugin_name=$(basename "$plugin_file" .plugin.sh)
        local plugin_info=$(get_plugin_metadata "$plugin_file")

        # Parse metadata
        local name=$(echo "$plugin_info" | jq -r '.name // "Unknown"' 2>/dev/null || echo "$plugin_name")
        local version=$(echo "$plugin_info" | jq -r '.version // "1.0.0"' 2>/dev/null || echo "1.0.0")
        local cat=$(echo "$plugin_info" | jq -r '.category // "other"' 2>/dev/null || echo "other")
        local description=$(echo "$plugin_info" | jq -r '.description // "No description"' 2>/dev/null || echo "No description")
        local status=$(is_plugin_active "$plugin_name" && echo "active" || echo "inactive")

        # Filter by category if specified
        if [[ "$category" != "all" && "$cat" != "$category" ]]; then
            continue
        fi

        # Status indicator
        local status_icon status_color
        if [[ "$status" == "active" ]]; then
            status_icon="✅"
            status_color="${GREEN}"
        else
            status_icon="⭕"
            status_color="${YELLOW}"
        fi

        echo -e "${PLUGIN_GREEN}${name}${RESET} ${DIM}v${version}${RESET}"
        echo -e "  ${status_icon} ${status_color}${status}${RESET} | ${PLUGIN_BLUE}${cat}${RESET} | $description"
        echo -e "  ${DIM}File: $plugin_file${RESET}"
        echo ""

        ((count++))
    done

    if [[ $count -eq 0 ]] && [[ "$category" != "all" ]]; then
        echo -e "${DIM}No plugins found in category: $category${RESET}"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BOLD}Total: ${count} plugins${RESET}"
}

get_plugin_metadata() {
    local plugin_file="$1"

    # Extract metadata from plugin header
    local metadata=$(grep -A 20 "^# PLUGIN_METADATA_START" "$plugin_file" 2>/dev/null | \
                    grep -B 20 "^# PLUGIN_METADATA_END" | \
                    grep "^#" | sed 's/^# //' | \
                    grep -E "^(name|version|category|description|author|dependencies):" | \
                    head -10)

    if [[ -n "$metadata" ]]; then
        # Convert to JSON
        echo "{"
        echo "$metadata" | while read -r line; do
            local key=$(echo "$line" | cut -d: -f1)
            local value=$(echo "$line" | cut -d: -f2- | sed 's/^ *//')
            echo "  \"$key\": \"$value\","
        done | sed '$ s/,$//'
        echo "}"
    else
        echo '{"name": "Unknown", "version": "1.0.0", "category": "other", "description": "No description available"}'
    fi
}

is_plugin_active() {
    local plugin_name="$1"
    local plugin_file="$PLUGINS_DIR/${plugin_name}.plugin.sh"

    [[ -f "$plugin_file" ]] && \
    grep -q "^PLUGIN_ACTIVE=true" "$plugin_file" 2>/dev/null
}

install_sample_plugins() {
    echo -e "${BOLD}${PLUGIN_ORANGE}${SYMBOL_INSTALL} Installing Sample Plugins${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    ensure_plugin_dirs

    # Sample Slack Integration Plugin
    create_sample_slack_plugin

    # Sample Discord Integration Plugin
    create_sample_discord_plugin

    # Sample Metrics Exporter Plugin
    create_sample_metrics_plugin

    # Sample AI Auto-Reply Plugin
    create_sample_ai_plugin

    echo -e "\n${GREEN}${SYMBOL_SUCCESS} Sample plugins installed successfully!${RESET}"
    echo ""
    echo "Next steps:"
    echo "  $0 list          # View installed plugins"
    echo "  $0 activate <plugin>  # Activate a plugin"
    echo "  $0 configure <plugin> # Configure plugin settings"
}

create_sample_slack_plugin() {
    local plugin_file="$PLUGINS_DIR/slack-integration.plugin.sh"

    cat > "$plugin_file" << 'EOF'
#!/usr/bin/env bash
# PLUGIN_METADATA_START
# name: Slack Integration
# version: 1.0.0
# category: external-api
# description: Send A2A messages to Slack channels
# author: A2A Plugin Team
# dependencies: curl, jq
# PLUGIN_METADATA_END

PLUGIN_ACTIVE=true
PLUGIN_NAME="slack-integration"

# Plugin Configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
SLACK_CHANNEL="${SLACK_CHANNEL:-#a2a-notifications}"
SLACK_USERNAME="${SLACK_USERNAME:-A2A-Bot}"

# Plugin Functions
slack_send_message() {
    local message="$1"
    local channel="${2:-$SLACK_CHANNEL}"

    if [[ -z "$SLACK_WEBHOOK_URL" ]]; then
        echo "⚠️  Slack webhook URL not configured" >&2
        return 1
    fi

    local payload=$(jq -n \
        --arg text "$message" \
        --arg channel "$channel" \
        --arg username "$SLACK_USERNAME" \
        '{text: $text, channel: $channel, username: $username, icon_emoji: ":robot_face:"}')

    curl -X POST -H 'Content-type: application/json' \
         --data "$payload" \
         "$SLACK_WEBHOOK_URL" -s > /dev/null

    echo "📤 Message sent to Slack: $channel"
}

# Plugin Hooks
on_message_sent() {
    local pane="$1"
    local message="$2"
    local status="$3"

    if [[ "$status" == "success" ]]; then
        slack_send_message "✅ A2A Message delivered to $pane: $message"
    else
        slack_send_message "❌ A2A Message failed for $pane: $message"
    fi
}

on_agent_status_change() {
    local agent="$1"
    local old_status="$2"
    local new_status="$3"

    slack_send_message "🤖 Agent $agent status changed: $old_status → $new_status"
}

# Plugin Configuration
configure_plugin() {
    echo "Configuring Slack Integration Plugin..."
    echo ""

    read -p "Slack Webhook URL: " webhook_url
    read -p "Default Channel [$SLACK_CHANNEL]: " channel
    read -p "Bot Username [$SLACK_USERNAME]: " username

    # Save configuration
    cat > "$HOME/.miyabi/slack-plugin.conf" << EOC
SLACK_WEBHOOK_URL="$webhook_url"
SLACK_CHANNEL="${channel:-$SLACK_CHANNEL}"
SLACK_USERNAME="${username:-$SLACK_USERNAME}"
EOC

    echo "✅ Slack plugin configured"
}

# Plugin Commands
case "${1:-}" in
    "send")
        slack_send_message "$2" "$3"
        ;;
    "configure")
        configure_plugin
        ;;
    "test")
        slack_send_message "🧪 A2A Slack Integration Test Message"
        ;;
    *)
        echo "Slack Integration Plugin v1.0.0"
        echo "Commands: send, configure, test"
        ;;
esac
EOF

    chmod +x "$plugin_file"
    echo -e "  ${GREEN}✅ Slack Integration Plugin${RESET}"
}

create_sample_discord_plugin() {
    local plugin_file="$PLUGINS_DIR/discord-integration.plugin.sh"

    cat > "$plugin_file" << 'EOF'
#!/usr/bin/env bash
# PLUGIN_METADATA_START
# name: Discord Integration
# version: 1.0.0
# category: external-api
# description: Send A2A notifications to Discord channels
# author: A2A Plugin Team
# dependencies: curl, jq
# PLUGIN_METADATA_END

PLUGIN_ACTIVE=true
PLUGIN_NAME="discord-integration"

# Plugin Configuration
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
DISCORD_USERNAME="${DISCORD_USERNAME:-A2A-Agent}"

# Plugin Functions
discord_send_message() {
    local message="$1"
    local embed="${2:-false}"

    if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
        echo "⚠️  Discord webhook URL not configured" >&2
        return 1
    fi

    local payload
    if [[ "$embed" == "true" ]]; then
        payload=$(jq -n \
            --arg username "$DISCORD_USERNAME" \
            --arg title "A2A System Notification" \
            --arg description "$message" \
            --arg color "3447003" \
            '{
                username: $username,
                avatar_url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f916.png",
                embeds: [{
                    title: $title,
                    description: $description,
                    color: ($color | tonumber),
                    timestamp: now | strftime("%Y-%m-%dT%H:%M:%S.000Z")
                }]
            }')
    else
        payload=$(jq -n \
            --arg content "$message" \
            --arg username "$DISCORD_USERNAME" \
            '{content: $content, username: $username}')
    fi

    curl -X POST -H 'Content-type: application/json' \
         --data "$payload" \
         "$DISCORD_WEBHOOK_URL" -s > /dev/null

    echo "💬 Message sent to Discord"
}

# Plugin Hooks
on_system_alert() {
    local alert_level="$1"
    local message="$2"

    case "$alert_level" in
        "critical")
            discord_send_message "🚨 **CRITICAL**: $message" true
            ;;
        "warning")
            discord_send_message "⚠️ **WARNING**: $message" true
            ;;
        *)
            discord_send_message "ℹ️ $message" false
            ;;
    esac
}

# Plugin Configuration
configure_plugin() {
    echo "Configuring Discord Integration Plugin..."
    echo ""

    read -p "Discord Webhook URL: " webhook_url
    read -p "Bot Username [$DISCORD_USERNAME]: " username

    cat > "$HOME/.miyabi/discord-plugin.conf" << EOC
DISCORD_WEBHOOK_URL="$webhook_url"
DISCORD_USERNAME="${username:-$DISCORD_USERNAME}"
EOC

    echo "✅ Discord plugin configured"
}

# Plugin Commands
case "${1:-}" in
    "send")
        discord_send_message "$2" "${3:-false}"
        ;;
    "alert")
        on_system_alert "$2" "$3"
        ;;
    "configure")
        configure_plugin
        ;;
    "test")
        discord_send_message "🧪 A2A Discord Integration Test" true
        ;;
    *)
        echo "Discord Integration Plugin v1.0.0"
        echo "Commands: send, alert, configure, test"
        ;;
esac
EOF

    chmod +x "$plugin_file"
    echo -e "  ${BLUE}✅ Discord Integration Plugin${RESET}"
}

create_sample_metrics_plugin() {
    local plugin_file="$PLUGINS_DIR/metrics-exporter.plugin.sh"

    cat > "$plugin_file" << 'EOF'
#!/usr/bin/env bash
# PLUGIN_METADATA_START
# name: Metrics Exporter
# version: 1.0.0
# category: monitoring
# description: Export A2A metrics to external monitoring systems
# author: A2A Plugin Team
# dependencies: curl, jq
# PLUGIN_METADATA_END

PLUGIN_ACTIVE=true
PLUGIN_NAME="metrics-exporter"

# Plugin Configuration
PROMETHEUS_GATEWAY="${PROMETHEUS_GATEWAY:-}"
DATADOG_API_KEY="${DATADOG_API_KEY:-}"
GRAFANA_WEBHOOK="${GRAFANA_WEBHOOK:-}"

# Metrics Functions
export_to_prometheus() {
    local metric_name="$1"
    local metric_value="$2"
    local labels="$3"

    if [[ -z "$PROMETHEUS_GATEWAY" ]]; then
        return 1
    fi

    local metric_data="${metric_name}${labels} ${metric_value}"
    echo "$metric_data" | curl -X POST --data-binary @- \
        "$PROMETHEUS_GATEWAY/metrics/job/a2a/instance/$(hostname)"

    echo "📊 Exported to Prometheus: $metric_name=$metric_value"
}

export_to_datadog() {
    local metric_name="$1"
    local metric_value="$2"
    local tags="$3"

    if [[ -z "$DATADOG_API_KEY" ]]; then
        return 1
    fi

    local timestamp=$(date +%s)
    local payload=$(jq -n \
        --arg metric "a2a.$metric_name" \
        --arg points "[[${timestamp}, ${metric_value}]]" \
        --arg tags "$tags" \
        '{
            series: [{
                metric: $metric,
                points: ($points | fromjson),
                tags: ($tags | split(","))
            }]
        }')

    curl -X POST "https://api.datadoghq.com/api/v1/series" \
        -H "DD-API-KEY: $DATADOG_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload" -s > /dev/null

    echo "📈 Exported to Datadog: $metric_name=$metric_value"
}

# Plugin Hooks
on_metric_recorded() {
    local metric_name="$1"
    local metric_value="$2"
    local tags="$3"

    # Export to all configured backends
    export_to_prometheus "$metric_name" "$metric_value" "{${tags}}"
    export_to_datadog "$metric_name" "$metric_value" "$tags"
}

# Generate metrics report
generate_report() {
    local period="${1:-hourly}"

    echo "📊 A2A Metrics Report ($period)"
    echo "Generated at: $(date)"
    echo ""

    # Read metrics from A2A
    local metrics_file="$HOME/.miyabi/a2a-metrics.log"
    if [[ -f "$metrics_file" ]]; then
        local total_messages=$(grep -c "message_sent" "$metrics_file" || echo "0")
        local failed_messages=$(grep -c "message_failed" "$metrics_file" || echo "0")
        local success_rate=$(awk "BEGIN {print ($total_messages - $failed_messages) / $total_messages * 100}" 2>/dev/null || echo "0")

        echo "Total Messages: $total_messages"
        echo "Failed Messages: $failed_messages"
        echo "Success Rate: ${success_rate}%"
        echo ""

        # Export these metrics
        on_metric_recorded "total_messages" "$total_messages" "type=counter"
        on_metric_recorded "failed_messages" "$failed_messages" "type=counter"
        on_metric_recorded "success_rate" "$success_rate" "type=gauge"
    fi
}

# Plugin Commands
case "${1:-}" in
    "export")
        on_metric_recorded "$2" "$3" "$4"
        ;;
    "report")
        generate_report "$2"
        ;;
    "configure")
        echo "Configuring Metrics Exporter Plugin..."
        read -p "Prometheus Gateway URL: " prom_url
        read -p "Datadog API Key: " dd_key

        cat > "$HOME/.miyabi/metrics-plugin.conf" << EOC
PROMETHEUS_GATEWAY="$prom_url"
DATADOG_API_KEY="$dd_key"
EOC
        echo "✅ Metrics exporter configured"
        ;;
    *)
        echo "Metrics Exporter Plugin v1.0.0"
        echo "Commands: export, report, configure"
        ;;
esac
EOF

    chmod +x "$plugin_file"
    echo -e "  ${PURPLE}✅ Metrics Exporter Plugin${RESET}"
}

create_sample_ai_plugin() {
    local plugin_file="$PLUGINS_DIR/ai-auto-reply.plugin.sh"

    cat > "$plugin_file" << 'EOF'
#!/usr/bin/env bash
# PLUGIN_METADATA_START
# name: AI Auto Reply
# version: 1.0.0
# category: ai-integration
# description: Automatically generate intelligent replies using AI
# author: A2A Plugin Team
# dependencies: curl, jq, claude
# PLUGIN_METADATA_END

PLUGIN_ACTIVE=false  # Disabled by default for safety
PLUGIN_NAME="ai-auto-reply"

# Plugin Configuration
AI_PROVIDER="${AI_PROVIDER:-claude}"
AUTO_REPLY_PATTERNS="${AUTO_REPLY_PATTERNS:-help,status,info}"

# AI Reply Functions
generate_ai_reply() {
    local incoming_message="$1"
    local context="${2:-}"

    local prompt="Generate a helpful reply for this A2A system message: '$incoming_message'"
    [[ -n "$context" ]] && prompt="$prompt Context: $context"

    case "$AI_PROVIDER" in
        "claude")
            if command -v claude >/dev/null 2>&1; then
                echo "$prompt" | claude chat --mode=quick 2>/dev/null | head -3 | tr '\n' ' '
            else
                echo "Claude not available, using template response"
            fi
            ;;
        "gpt")
            echo "GPT integration not implemented yet"
            ;;
        *)
            # Fallback template responses
            case "$incoming_message" in
                *help*)
                    echo "🤖 A2A System Help: Use 'health' for status, 'send <pane> <msg>' to communicate"
                    ;;
                *status*)
                    echo "🟢 A2A System Status: All agents operational, $(date)"
                    ;;
                *)
                    echo "🤖 A2A received your message: $incoming_message"
                    ;;
            esac
            ;;
    esac
}

should_auto_reply() {
    local message="$1"

    # Check if message matches auto-reply patterns
    IFS=',' read -ra PATTERNS <<< "$AUTO_REPLY_PATTERNS"
    for pattern in "${PATTERNS[@]}"; do
        if [[ "$message" =~ $pattern ]]; then
            return 0
        fi
    done

    return 1
}

# Plugin Hooks
on_message_received() {
    local from_pane="$1"
    local message="$2"

    if [[ "$PLUGIN_ACTIVE" != "true" ]]; then
        return 0
    fi

    if should_auto_reply "$message"; then
        local reply=$(generate_ai_reply "$message" "from_pane=$from_pane")

        # Send auto-reply back to sender
        source "$(dirname "$0")/../a2a-advanced.sh"
        a2a_send_advanced "$from_pane" "[AI-AutoReply] $reply"

        echo "🤖 Generated AI auto-reply to $from_pane"
    fi
}

# Plugin Commands
case "${1:-}" in
    "reply")
        generate_ai_reply "$2" "$3"
        ;;
    "activate")
        sed -i 's/PLUGIN_ACTIVE=false/PLUGIN_ACTIVE=true/' "$0"
        echo "✅ AI Auto-Reply activated"
        ;;
    "deactivate")
        sed -i 's/PLUGIN_ACTIVE=true/PLUGIN_ACTIVE=false/' "$0"
        echo "⭕ AI Auto-Reply deactivated"
        ;;
    "configure")
        echo "Configuring AI Auto-Reply Plugin..."
        read -p "AI Provider [claude/gpt]: " provider
        read -p "Auto-reply patterns (comma-separated): " patterns

        cat > "$HOME/.miyabi/ai-reply-plugin.conf" << EOC
AI_PROVIDER="${provider:-claude}"
AUTO_REPLY_PATTERNS="${patterns:-help,status,info}"
EOC
        echo "✅ AI Auto-Reply configured"
        ;;
    "test")
        echo "Testing AI reply generation..."
        generate_ai_reply "help me with A2A commands" "test=true"
        ;;
    *)
        echo "AI Auto Reply Plugin v1.0.0"
        echo "Commands: reply, activate, deactivate, configure, test"
        echo "Status: $(is_plugin_active 'ai-auto-reply' && echo 'Active' || echo 'Inactive')"
        ;;
esac
EOF

    chmod +x "$plugin_file"
    echo -e "  ${PINK}✅ AI Auto Reply Plugin${RESET}"
}

# ------------------------------------------------------------
# Plugin Management Commands
# ------------------------------------------------------------

activate_plugin() {
    local plugin_name="$1"
    local plugin_file="$PLUGINS_DIR/${plugin_name}.plugin.sh"

    if [[ ! -f "$plugin_file" ]]; then
        log_advanced "ERROR" "PluginManager" "Plugin not found: $plugin_name"
        return 1
    fi

    # Update plugin file to set PLUGIN_ACTIVE=true
    sed -i 's/PLUGIN_ACTIVE=false/PLUGIN_ACTIVE=true/' "$plugin_file"

    log_advanced "SUCCESS" "PluginManager" "Plugin activated: $plugin_name"
    echo -e "${GREEN}${SYMBOL_SUCCESS} Plugin '$plugin_name' activated${RESET}"
}

deactivate_plugin() {
    local plugin_name="$1"
    local plugin_file="$PLUGINS_DIR/${plugin_name}.plugin.sh"

    if [[ ! -f "$plugin_file" ]]; then
        log_advanced "ERROR" "PluginManager" "Plugin not found: $plugin_name"
        return 1
    fi

    sed -i 's/PLUGIN_ACTIVE=true/PLUGIN_ACTIVE=false/' "$plugin_file"

    log_advanced "SUCCESS" "PluginManager" "Plugin deactivated: $plugin_name"
    echo -e "${YELLOW}Plugin '$plugin_name' deactivated${RESET}"
}

configure_plugin() {
    local plugin_name="$1"
    local plugin_file="$PLUGINS_DIR/${plugin_name}.plugin.sh"

    if [[ ! -f "$plugin_file" ]]; then
        echo -e "${RED}${SYMBOL_ERROR} Plugin not found: $plugin_name${RESET}"
        return 1
    fi

    echo -e "${BOLD}${PLUGIN_BLUE}${SYMBOL_CONFIG} Configuring Plugin: $plugin_name${RESET}"
    echo ""

    # Execute plugin with configure command
    "$plugin_file" configure
}

show_plugin_usage() {
    echo -e "${BOLD}${CYAN}A2A Plugin Manager v${PLUGIN_MANAGER_VERSION}${RESET}"
    echo ""
    echo -e "${BOLD}${GREEN}Plugin Management:${RESET}"
    echo -e "  ${YELLOW}info${RESET}                          Show plugin system information"
    echo -e "  ${YELLOW}list${RESET} [category]              List installed plugins"
    echo -e "  ${YELLOW}install-sample${RESET}               Install sample plugins"
    echo -e "  ${YELLOW}activate${RESET} <plugin>            Activate a plugin"
    echo -e "  ${YELLOW}deactivate${RESET} <plugin>          Deactivate a plugin"
    echo -e "  ${YELLOW}configure${RESET} <plugin>           Configure plugin settings"
    echo ""
    echo -e "${BOLD}${BLUE}Categories:${RESET}"
    for category in "${PLUGIN_CATEGORIES[@]}"; do
        echo -e "  ${PLUGIN_PURPLE}$category${RESET}"
    done
    echo ""
    echo -e "${BOLD}${RED}Examples:${RESET}"
    echo -e "  $0 install-sample"
    echo -e "  $0 list communication"
    echo -e "  $0 activate slack-integration"
    echo -e "  $0 configure discord-integration"
}

# ------------------------------------------------------------
# Main CLI Router
# ------------------------------------------------------------

main() {
    case "${1:-help}" in
        "info")
            plugin_info
            ;;
        "list")
            list_plugins "${2:-all}"
            ;;
        "install-sample")
            install_sample_plugins
            ;;
        "activate")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 activate <plugin_name>${RESET}"
                exit 1
            fi
            activate_plugin "$2"
            ;;
        "deactivate")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 deactivate <plugin_name>${RESET}"
                exit 1
            fi
            deactivate_plugin "$2"
            ;;
        "configure")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 configure <plugin_name>${RESET}"
                exit 1
            fi
            configure_plugin "$2"
            ;;
        "help"|"--help"|"-h")
            show_plugin_usage
            ;;
        *)
            echo -e "${RED}${SYMBOL_ERROR} Unknown command: ${1:-}${RESET}"
            show_plugin_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"