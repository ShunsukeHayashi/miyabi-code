#!/usr/bin/env bash
# ============================================================
# A2A AI Integration Layer - Claude Code, Codex, Gemini
# Version: 4.0.0 - AI-Powered Multi-Agent Platform
# Protocol: MIYABI-A2A-P4.0 AI-Enhanced
# ============================================================

set -euo pipefail

# AI Integration Configuration
readonly AI_CONFIG_FILE="${MIYABI_A2A_AI_CONFIG:-$HOME/.miyabi/ai-config.yml}"
readonly AI_CACHE_DIR="${MIYABI_A2A_AI_CACHE:-$HOME/.miyabi/ai-cache}"
readonly CLAUDE_CODE_BINARY="${CLAUDE_CODE_BINARY:-claude}"
readonly CODEX_BINARY="${CODEX_BINARY:-codex}"
readonly GEMINI_BINARY="${GEMINI_BINARY:-gemini}"

# Source the advanced framework
CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$CURRENT_SCRIPT_DIR/a2a-advanced.sh"

# AI Service Status
readonly AI_STATUS_ACTIVE="🟢"
readonly AI_STATUS_INACTIVE="🔴"
readonly AI_STATUS_ERROR="🟡"

# ------------------------------------------------------------
# AI Service Detection & Configuration
# ------------------------------------------------------------

detect_ai_services() {
    log_advanced "INFO" "AI-Detection" "Scanning for AI service binaries..."

    echo -e "${BOLD}${PURPLE}🧠 AI Service Detection Dashboard${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Claude Code Detection
    if command -v "$CLAUDE_CODE_BINARY" >/dev/null 2>&1; then
        local claude_version=$("$CLAUDE_CODE_BINARY" --version 2>/dev/null | head -1 || echo "unknown")
        echo -e "${AI_STATUS_ACTIVE} ${BOLD}Claude Code${RESET} - ${GREEN}Available${RESET} ${DIM}($claude_version)${RESET}"

        # Test Claude Code authentication
        if "$CLAUDE_CODE_BINARY" auth check >/dev/null 2>&1; then
            echo -e "   ${SYMBOL_SUCCESS} Authentication: ${GREEN}Valid${RESET}"
        else
            echo -e "   ${SYMBOL_WARNING} Authentication: ${YELLOW}Not configured${RESET}"
        fi
    else
        echo -e "${AI_STATUS_INACTIVE} ${BOLD}Claude Code${RESET} - ${RED}Not found${RESET} ${DIM}(install: npm install -g claude-cli)${RESET}"
    fi

    # Codex Detection
    if command -v "$CODEX_BINARY" >/dev/null 2>&1; then
        local codex_version=$("$CODEX_BINARY" --version 2>/dev/null | head -1 || echo "unknown")
        echo -e "${AI_STATUS_ACTIVE} ${BOLD}OpenAI Codex${RESET} - ${GREEN}Available${RESET} ${DIM}($codex_version)${RESET}"

        # Test Codex API access
        if "$CODEX_BINARY" status >/dev/null 2>&1; then
            echo -e "   ${SYMBOL_SUCCESS} API Access: ${GREEN}Active${RESET}"
        else
            echo -e "   ${SYMBOL_WARNING} API Access: ${YELLOW}Limited/Not configured${RESET}"
        fi
    else
        echo -e "${AI_STATUS_INACTIVE} ${BOLD}OpenAI Codex${RESET} - ${RED}Not found${RESET} ${DIM}(install: pip install openai-cli)${RESET}"
    fi

    # Gemini CLI Detection
    if command -v "$GEMINI_BINARY" >/dev/null 2>&1; then
        local gemini_version=$("$GEMINI_BINARY" --version 2>/dev/null | head -1 || echo "unknown")
        echo -e "${AI_STATUS_ACTIVE} ${BOLD}Google Gemini${RESET} - ${GREEN}Available${RESET} ${DIM}($gemini_version)${RESET}"

        # Test Gemini API access
        if [[ -n "${GOOGLE_API_KEY:-}" ]]; then
            echo -e "   ${SYMBOL_SUCCESS} API Key: ${GREEN}Configured${RESET}"
        else
            echo -e "   ${SYMBOL_WARNING} API Key: ${YELLOW}Not set${RESET} ${DIM}(export GOOGLE_API_KEY=...)${RESET}"
        fi
    else
        echo -e "${AI_STATUS_INACTIVE} ${BOLD}Google Gemini${RESET} - ${RED}Not found${RESET} ${DIM}(install: npm install -g @google/generative-ai-cli)${RESET}"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ------------------------------------------------------------
# Claude Code Integration
# ------------------------------------------------------------

a2a_claude_exec() {
    local task="$1"
    local target_pane="${2:-}"
    local options="${3:-}"

    log_advanced "INFO" "Claude-Code" "Executing task: $task"

    if ! command -v "$CLAUDE_CODE_BINARY" >/dev/null 2>&1; then
        log_advanced "ERROR" "Claude-Code" "Claude Code not available"
        return 1
    fi

    echo -e "${BOLD}${BLUE}🤖 Claude Code Execution${RESET}"
    echo -e "${DIM}Task: $task${RESET}"
    echo ""

    # Create cache directory
    ensure_cache_dir

    # Execute Claude Code and capture output
    local output_file="$AI_CACHE_DIR/claude-$(date +%s).output"
    local start_time=$(date +%s)

    if [[ "$options" == *"--background"* ]]; then
        # Background execution
        echo -e "${YELLOW}${SYMBOL_GEAR} Executing in background...${RESET}"
        (
            "$CLAUDE_CODE_BINARY" exec "$task" > "$output_file" 2>&1
            local exit_code=$?
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))

            if [[ $exit_code -eq 0 ]]; then
                log_advanced "SUCCESS" "Claude-Code" "Background task completed in ${duration}s"
                [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Claude-Code] Task completed: $task (${duration}s)"
            else
                log_advanced "ERROR" "Claude-Code" "Background task failed in ${duration}s"
                [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Claude-Code] Task failed: $task"
            fi
        ) &
        local bg_pid=$!
        echo -e "${GREEN}Background PID: $bg_pid${RESET}"
        record_metric "claude_background_task" 1 "task=$task,pid=$bg_pid"
    else
        # Foreground execution with real-time output
        "$CLAUDE_CODE_BINARY" exec "$task" | tee "$output_file"
        local exit_code=${PIPESTATUS[0]}
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        if [[ $exit_code -eq 0 ]]; then
            echo -e "\n${GREEN}${SYMBOL_SUCCESS} Claude Code task completed in ${duration}s${RESET}"
            [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Claude-Code] ✅ Task completed: $task"
            record_metric "claude_success" 1 "task=$task,duration=${duration}s"
        else
            echo -e "\n${RED}${SYMBOL_ERROR} Claude Code task failed in ${duration}s${RESET}"
            [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Claude-Code] ❌ Task failed: $task"
            record_metric "claude_failed" 1 "task=$task,duration=${duration}s"
            return $exit_code
        fi
    fi
}

a2a_claude_chat() {
    local message="$1"
    local context="${2:-}"
    local target_pane="${3:-}"

    log_advanced "INFO" "Claude-Chat" "Starting interactive session"

    if ! command -v "$CLAUDE_CODE_BINARY" >/dev/null 2>&1; then
        log_advanced "ERROR" "Claude-Chat" "Claude Code not available"
        return 1
    fi

    echo -e "${BOLD}${CYAN}💬 Claude Code Interactive Chat${RESET}"
    echo -e "${DIM}Message: $message${RESET}"
    [[ -n "$context" ]] && echo -e "${DIM}Context: $context${RESET}"
    echo ""

    # Prepare chat session
    local chat_file="$AI_CACHE_DIR/claude-chat-$(date +%s).md"
    ensure_cache_dir

    {
        echo "# Claude Code Chat Session"
        echo "**Started:** $(date)"
        [[ -n "$context" ]] && echo "**Context:** $context"
        echo ""
        echo "**User:** $message"
        echo ""
    } > "$chat_file"

    # Execute chat
    local response=$(echo "$message" | "$CLAUDE_CODE_BINARY" chat ${context:+--context "$context"} 2>/dev/null || echo "Error: Claude Code chat failed")

    echo "$response" | tee -a "$chat_file"

    if [[ -n "$target_pane" ]] && [[ "$response" != "Error:"* ]]; then
        # Send summarized response to target pane
        local summary=$(echo "$response" | head -3 | tr '\n' ' ')
        a2a_send_advanced "$target_pane" "[Claude-Chat] 💬 $summary..."
    fi

    log_advanced "SUCCESS" "Claude-Chat" "Chat session completed"
    record_metric "claude_chat" 1 "message_length=${#message}"
}

# ------------------------------------------------------------
# Codex Integration
# ------------------------------------------------------------

a2a_codex_generate() {
    local prompt="$1"
    local language="${2:-auto}"
    local target_pane="${3:-}"

    log_advanced "INFO" "Codex" "Generating code for: $prompt"

    if ! command -v "$CODEX_BINARY" >/dev/null 2>&1; then
        log_advanced "ERROR" "Codex" "Codex CLI not available"
        return 1
    fi

    echo -e "${BOLD}${GREEN}⚡ OpenAI Codex Code Generation${RESET}"
    echo -e "${DIM}Prompt: $prompt${RESET}"
    echo -e "${DIM}Language: $language${RESET}"
    echo ""

    ensure_cache_dir
    local output_file="$AI_CACHE_DIR/codex-$(date +%s).${language}"
    local start_time=$(date +%s)

    # Execute Codex
    if "$CODEX_BINARY" generate --prompt "$prompt" --language "$language" --output "$output_file" 2>/dev/null; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        echo -e "${GREEN}${SYMBOL_SUCCESS} Code generation completed in ${duration}s${RESET}"
        echo -e "${BOLD}Generated code:${RESET}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Display generated code with syntax highlighting if possible
        if command -v bat >/dev/null 2>&1; then
            bat --style=numbers --color=always "$output_file" || cat "$output_file"
        elif command -v pygmentize >/dev/null 2>&1; then
            pygmentize "$output_file" 2>/dev/null || cat "$output_file"
        else
            cat "$output_file"
        fi

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${BLUE}Output saved to: $output_file${RESET}"

        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Codex] ⚡ Code generated for: $prompt"
        record_metric "codex_success" 1 "language=$language,duration=${duration}s"
    else
        echo -e "${RED}${SYMBOL_ERROR} Code generation failed${RESET}"
        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Codex] ❌ Code generation failed: $prompt"
        record_metric "codex_failed" 1 "language=$language"
        return 1
    fi
}

a2a_codex_review() {
    local code_file="$1"
    local target_pane="${2:-}"

    log_advanced "INFO" "Codex-Review" "Reviewing code file: $code_file"

    if ! command -v "$CODEX_BINARY" >/dev/null 2>&1; then
        log_advanced "ERROR" "Codex-Review" "Codex CLI not available"
        return 1
    fi

    if [[ ! -f "$code_file" ]]; then
        log_advanced "ERROR" "Codex-Review" "Code file not found: $code_file"
        return 1
    fi

    echo -e "${BOLD}${PURPLE}🔍 Codex Code Review${RESET}"
    echo -e "${DIM}File: $code_file${RESET}"
    echo ""

    # Execute code review
    local review_output=$("$CODEX_BINARY" review --file "$code_file" 2>/dev/null || echo "Review failed")

    if [[ "$review_output" != "Review failed" ]]; then
        echo -e "${GREEN}${SYMBOL_SUCCESS} Code review completed${RESET}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$review_output"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Codex-Review] 🔍 Review completed for: $(basename "$code_file")"
        record_metric "codex_review_success" 1 "file=$(basename "$code_file")"
    else
        echo -e "${RED}${SYMBOL_ERROR} Code review failed${RESET}"
        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Codex-Review] ❌ Review failed for: $(basename "$code_file")"
        record_metric "codex_review_failed" 1 "file=$(basename "$code_file")"
        return 1
    fi
}

# ------------------------------------------------------------
# Gemini Integration
# ------------------------------------------------------------

a2a_gemini_analyze() {
    local input="$1"
    local analysis_type="${2:-general}"
    local target_pane="${3:-}"

    log_advanced "INFO" "Gemini" "Analyzing with type: $analysis_type"

    if ! command -v "$GEMINI_BINARY" >/dev/null 2>&1; then
        log_advanced "ERROR" "Gemini" "Gemini CLI not available"
        return 1
    fi

    echo -e "${BOLD}${YELLOW}🧠 Google Gemini Analysis${RESET}"
    echo -e "${DIM}Type: $analysis_type${RESET}"
    echo -e "${DIM}Input: ${input:0:100}...${RESET}"
    echo ""

    ensure_cache_dir
    local output_file="$AI_CACHE_DIR/gemini-$(date +%s).analysis"
    local start_time=$(date +%s)

    # Prepare analysis prompt based on type
    local prompt
    case "$analysis_type" in
        "code")
            prompt="Analyze this code for quality, security, and optimization opportunities: $input"
            ;;
        "data")
            prompt="Analyze this data and provide insights: $input"
            ;;
        "logs")
            prompt="Analyze these logs for errors, patterns, and recommendations: $input"
            ;;
        "performance")
            prompt="Analyze this for performance bottlenecks and optimization suggestions: $input"
            ;;
        *)
            prompt="Provide a comprehensive analysis of: $input"
            ;;
    esac

    # Execute Gemini analysis
    if echo "$prompt" | "$GEMINI_BINARY" generate --model=gemini-pro > "$output_file" 2>/dev/null; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        echo -e "${GREEN}${SYMBOL_SUCCESS} Analysis completed in ${duration}s${RESET}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat "$output_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Gemini] 🧠 Analysis completed ($analysis_type)"
        record_metric "gemini_success" 1 "type=$analysis_type,duration=${duration}s"
    else
        echo -e "${RED}${SYMBOL_ERROR} Analysis failed${RESET}"
        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Gemini] ❌ Analysis failed ($analysis_type)"
        record_metric "gemini_failed" 1 "type=$analysis_type"
        return 1
    fi
}

a2a_gemini_multimodal() {
    local text_input="$1"
    local image_path="${2:-}"
    local target_pane="${3:-}"

    log_advanced "INFO" "Gemini-Multimodal" "Processing multimodal input"

    if ! command -v "$GEMINI_BINARY" >/dev/null 2>&1; then
        log_advanced "ERROR" "Gemini-Multimodal" "Gemini CLI not available"
        return 1
    fi

    echo -e "${BOLD}${CYAN}🎨 Gemini Multimodal Analysis${RESET}"
    echo -e "${DIM}Text: $text_input${RESET}"
    [[ -n "$image_path" ]] && echo -e "${DIM}Image: $image_path${RESET}"
    echo ""

    local cmd=("$GEMINI_BINARY" generate --model=gemini-pro-vision)
    [[ -n "$image_path" ]] && cmd+=(--image="$image_path")

    if echo "$text_input" | "${cmd[@]}" 2>/dev/null; then
        echo -e "\n${GREEN}${SYMBOL_SUCCESS} Multimodal analysis completed${RESET}"
        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Gemini-Vision] 🎨 Multimodal analysis completed"
        record_metric "gemini_multimodal_success" 1 "has_image=$([[ -n "$image_path" ]] && echo "true" || echo "false")"
    else
        echo -e "${RED}${SYMBOL_ERROR} Multimodal analysis failed${RESET}"
        [[ -n "$target_pane" ]] && a2a_send_advanced "$target_pane" "[Gemini-Vision] ❌ Multimodal analysis failed"
        record_metric "gemini_multimodal_failed" 1
        return 1
    fi
}

# ------------------------------------------------------------
# AI Orchestration Functions
# ------------------------------------------------------------

a2a_ai_orchestrate() {
    local task="$1"
    local ai_services="${2:-claude,codex,gemini}"
    local coordination_pane="${3:-}"

    log_advanced "INFO" "AI-Orchestrate" "Starting multi-AI task: $task"

    echo -e "${BOLD}${PURPLE}🎼 AI Services Orchestration${RESET}"
    echo -e "${DIM}Task: $task${RESET}"
    echo -e "${DIM}Services: $ai_services${RESET}"
    echo ""

    IFS=',' read -ra SERVICES <<< "$ai_services"
    local total_services=${#SERVICES[@]}
    local completed_services=0

    [[ -n "$coordination_pane" ]] && a2a_send_advanced "$coordination_pane" "[AI-Orchestrate] 🎼 Starting task with $total_services AI services"

    for service in "${SERVICES[@]}"; do
        service=$(echo "$service" | tr -d ' ')  # Remove whitespace

        echo -e "${BOLD}Processing with $service...${RESET}"

        case "$service" in
            "claude")
                if a2a_claude_exec "$task" "$coordination_pane" "--background"; then
                    ((completed_services++))
                    echo -e "${GREEN}✅ Claude Code: Task delegated${RESET}"
                else
                    echo -e "${RED}❌ Claude Code: Failed${RESET}"
                fi
                ;;
            "codex")
                if a2a_codex_generate "$task" "auto" "$coordination_pane"; then
                    ((completed_services++))
                    echo -e "${GREEN}✅ Codex: Code generated${RESET}"
                else
                    echo -e "${RED}❌ Codex: Failed${RESET}"
                fi
                ;;
            "gemini")
                if a2a_gemini_analyze "$task" "general" "$coordination_pane"; then
                    ((completed_services++))
                    echo -e "${GREEN}✅ Gemini: Analysis completed${RESET}"
                else
                    echo -e "${RED}❌ Gemini: Failed${RESET}"
                fi
                ;;
            *)
                echo -e "${YELLOW}⚠️  Unknown service: $service${RESET}"
                ;;
        esac

        echo ""
    done

    echo -e "${BOLD}${CYAN}🎯 Orchestration Summary${RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}Completed: $completed_services${RESET} / ${BLUE}Total: $total_services${RESET}"

    local success_rate=$((completed_services * 100 / total_services))
    echo -e "${PURPLE}Success Rate: ${success_rate}%${RESET}"

    [[ -n "$coordination_pane" ]] && a2a_send_advanced "$coordination_pane" "[AI-Orchestrate] 🎯 Completed: $completed_services/$total_services services (${success_rate}%)"

    record_metric "ai_orchestration" 1 "services=$total_services,completed=$completed_services,success_rate=${success_rate}%"

    return $((total_services - completed_services))
}

# ------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------

ensure_cache_dir() {
    [[ -d "$AI_CACHE_DIR" ]] || mkdir -p "$AI_CACHE_DIR"
}

show_ai_usage() {
    echo -e "${BOLD}${CYAN}A2A AI Integration Commands${RESET}"
    echo ""
    echo -e "${BOLD}${GREEN}AI Service Detection:${RESET}"
    echo -e "  ${YELLOW}detect-ai${RESET}                    Show available AI services"
    echo ""
    echo -e "${BOLD}${BLUE}Claude Code Integration:${RESET}"
    echo -e "  ${YELLOW}claude-exec${RESET}   <task> [pane] [options]     Execute Claude Code task"
    echo -e "  ${YELLOW}claude-chat${RESET}   <message> [context] [pane]  Interactive Claude chat"
    echo ""
    echo -e "${BOLD}${GREEN}Codex Integration:${RESET}"
    echo -e "  ${YELLOW}codex-gen${RESET}     <prompt> [lang] [pane]      Generate code with Codex"
    echo -e "  ${YELLOW}codex-review${RESET}  <file> [pane]               Review code with Codex"
    echo ""
    echo -e "${BOLD}${YELLOW}Gemini Integration:${RESET}"
    echo -e "  ${YELLOW}gemini-analyze${RESET} <input> [type] [pane]      Analyze with Gemini"
    echo -e "  ${YELLOW}gemini-vision${RESET}  <text> [image] [pane]      Multimodal analysis"
    echo ""
    echo -e "${BOLD}${PURPLE}AI Orchestration:${RESET}"
    echo -e "  ${YELLOW}ai-orchestrate${RESET} <task> [services] [pane]   Multi-AI task execution"
    echo ""
    echo -e "${BOLD}${RED}Examples:${RESET}"
    echo -e "  $0 claude-exec 'Fix the authentication bug' %0"
    echo -e "  $0 codex-gen 'Create a REST API endpoint' python %0"
    echo -e "  $0 gemini-analyze 'log.txt' logs %0"
    echo -e "  $0 ai-orchestrate 'Optimize the database' claude,gemini %0"
}

# ------------------------------------------------------------
# Extended CLI Router for AI Integration
# ------------------------------------------------------------

main_ai() {
    case "${1:-help}" in
        "detect-ai")
            detect_ai_services
            ;;
        "claude-exec")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 claude-exec <task> [pane] [options]${RESET}"
                exit 1
            fi
            a2a_claude_exec "$2" "${3:-}" "${4:-}"
            ;;
        "claude-chat")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 claude-chat <message> [context] [pane]${RESET}"
                exit 1
            fi
            a2a_claude_chat "$2" "${3:-}" "${4:-}"
            ;;
        "codex-gen")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 codex-gen <prompt> [language] [pane]${RESET}"
                exit 1
            fi
            a2a_codex_generate "$2" "${3:-auto}" "${4:-}"
            ;;
        "codex-review")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 codex-review <file> [pane]${RESET}"
                exit 1
            fi
            a2a_codex_review "$2" "${3:-}"
            ;;
        "gemini-analyze")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 gemini-analyze <input> [type] [pane]${RESET}"
                exit 1
            fi
            a2a_gemini_analyze "$2" "${3:-general}" "${4:-}"
            ;;
        "gemini-vision")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 gemini-vision <text> [image] [pane]${RESET}"
                exit 1
            fi
            a2a_gemini_multimodal "$2" "${3:-}" "${4:-}"
            ;;
        "ai-orchestrate")
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}${SYMBOL_ERROR} Usage: $0 ai-orchestrate <task> [services] [pane]${RESET}"
                exit 1
            fi
            a2a_ai_orchestrate "$2" "${3:-claude,codex,gemini}" "${4:-}"
            ;;
        "help-ai"|"ai-help")
            show_ai_usage
            ;;
        *)
            # Fallback to main A2A advanced commands
            main "$@"
            ;;
    esac
}

# Run AI integration if this script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_ai "$@"
fi