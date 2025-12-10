#!/bin/bash
# ============================================================
# Miyabi Claude Code A2A Examples
# Practical examples using claude --agents
# ============================================================

# ------------------------------------------------------------
# Setup
# ------------------------------------------------------------

# Load agent definitions
AGENTS_FILE="${MIYABI_AGENTS_FILE:-./miyabi_agents.json}"

# Ensure agents file exists
if [ ! -f "$AGENTS_FILE" ]; then
    echo "⚠️ Agents file not found: $AGENTS_FILE"
    echo "   Create it or set MIYABI_AGENTS_FILE"
fi

# ------------------------------------------------------------
# Example 1: Simple Single Agent Task
# ------------------------------------------------------------

example_single_agent() {
    echo "=== Example 1: Single Agent Task ==="
    
    # Using inline JSON for one agent
    claude --dangerously-skip-permissions \
        --agents '{
            "kaede": {
                "description": "CodeGen Agent",
                "prompt": "You are カエデ, the CodeGen agent. Write clean, tested code."
            }
        }' \
        "Create a simple REST API endpoint for user registration. Use @kaede."
}

# ------------------------------------------------------------
# Example 2: Multi-Agent Coordination
# ------------------------------------------------------------

example_multi_agent() {
    echo "=== Example 2: Multi-Agent Coordination ==="
    
    claude --dangerously-skip-permissions \
        --agents '{
            "shikiroon": {
                "description": "Conductor - Coordinates tasks",
                "prompt": "You are しきるん. Break down tasks and assign to agents."
            },
            "kaede": {
                "description": "CodeGen - Writes code", 
                "prompt": "You are カエデ. Implement features when assigned."
            },
            "sakura": {
                "description": "Review - Reviews code",
                "prompt": "You are サクラ. Review code for quality and security."
            }
        }' \
        "Implement a user authentication system.
         
         @shikiroon: Break this into subtasks
         @kaede: Implement the code
         @sakura: Review the implementation
         
         Report using format: [Agent名] Status: Detail"
}

# ------------------------------------------------------------
# Example 3: Using JSON File
# ------------------------------------------------------------

example_from_file() {
    echo "=== Example 3: Load Agents from File ==="
    
    if [ -f "$AGENTS_FILE" ]; then
        claude --dangerously-skip-permissions \
            --agents "$(cat $AGENTS_FILE)" \
            "Analyze the current codebase and suggest improvements.
             Use @kaede for implementation suggestions and @sakura for review insights."
    else
        echo "Agents file not found: $AGENTS_FILE"
    fi
}

# ------------------------------------------------------------
# Example 4: Development Workflow
# ------------------------------------------------------------

example_dev_workflow() {
    local issue_number="${1:-100}"
    
    echo "=== Example 4: Development Workflow for Issue #$issue_number ==="
    
    claude --dangerously-skip-permissions \
        --agents '{
            "shikiroon": {
                "description": "Conductor",
                "prompt": "Coordinate the development workflow. PUSH communication only."
            },
            "mitsukeroon": {
                "description": "Issue Agent",
                "prompt": "Analyze GitHub issues and create implementation plans."
            },
            "kaede": {
                "description": "CodeGen",
                "prompt": "Implement features following the plan."
            },
            "sakura": {
                "description": "Review",
                "prompt": "Review code thoroughly before merging."
            },
            "tsubaki": {
                "description": "PR Agent",
                "prompt": "Create and manage pull requests."
            }
        }' \
        "Complete GitHub Issue #$issue_number end-to-end:
         
         1. @mitsukeroon: Analyze the issue requirements
         2. @shikiroon: Create implementation plan
         3. @kaede: Implement the solution
         4. @sakura: Review the code
         5. @tsubaki: Create and manage the PR
         
         Each agent reports: [Agent名] Status: Detail
         Final report to Guardian when complete."
}

# ------------------------------------------------------------
# Example 5: Marketing Campaign
# ------------------------------------------------------------

example_marketing() {
    local product="${1:-Miyabi Pro}"
    
    echo "=== Example 5: Marketing Campaign for $product ==="
    
    claude --dangerously-skip-permissions \
        --agents '{
            "hiromeroon": {
                "description": "Marketing Strategy",
                "prompt": "Design comprehensive marketing campaigns."
            },
            "kakuchan": {
                "description": "Content Creator",
                "prompt": "Write compelling marketing content."
            },
            "tsubuyakun": {
                "description": "SNS Strategy",
                "prompt": "Create social media content and strategy."
            },
            "dougakun": {
                "description": "Video Strategy",
                "prompt": "Plan video content for YouTube."
            }
        }' \
        "Create a launch campaign for $product:
         
         @hiromeroon: Design the overall campaign strategy
         @kakuchan: Write landing page and email copy
         @tsubuyakun: Create social media content plan
         @dougakun: Plan launch video content
         
         Coordinate outputs for a cohesive campaign."
}

# ------------------------------------------------------------
# Example 6: A2A tmux Integration
# ------------------------------------------------------------

example_tmux_a2a() {
    echo "=== Example 6: A2A tmux Integration ==="
    
    claude --dangerously-skip-permissions \
        --agents '{
            "shikiroon": {
                "description": "Conductor at pane %18",
                "prompt": "You are しきるん at tmux pane %18. Receive PUSH reports from workers."
            },
            "kaede": {
                "description": "CodeGen at pane %19",
                "prompt": "You are カエデ at tmux pane %19. Report to Conductor at %18."
            }
        }' \
        "Demonstrate A2A communication:
         
         1. @kaede starts a task and reports to @shikiroon
         2. Use tmux P0.2 protocol:
            tmux send-keys -t %18 '[カエデ] 開始: Demo task' && sleep 0.5 && tmux send-keys -t %18 Enter
         3. Complete the task and report:
            tmux send-keys -t %18 '[カエデ] 完了: Demo complete' && sleep 0.5 && tmux send-keys -t %18 Enter
         
         Explain each step."
}

# ------------------------------------------------------------
# Example 7: Code Review Pipeline
# ------------------------------------------------------------

example_review_pipeline() {
    local pr_number="${1:-123}"
    
    echo "=== Example 7: Code Review Pipeline for PR #$pr_number ==="
    
    claude --dangerously-skip-permissions \
        --agents '{
            "sakura": {
                "description": "Primary Reviewer",
                "prompt": "You are サクラ, the primary code reviewer. Check code quality, security, performance."
            },
            "kaede": {
                "description": "Implementation Support",
                "prompt": "You are カエデ. Help fix issues found during review."
            }
        }' \
        "Review PR #$pr_number:
         
         @sakura: Perform thorough code review
         - Code correctness
         - Security vulnerabilities  
         - Performance issues
         - Test coverage
         - Documentation
         
         If issues found, @kaede suggests fixes.
         
         Report: [サクラ] Review: {findings}
         If approved: [サクラ] 完了: PR #$pr_number approved"
}

# ------------------------------------------------------------
# Example 8: Codex Integration
# ------------------------------------------------------------

example_codex_integration() {
    echo "=== Example 8: Codex Integration ==="
    
    # Using codex -s danger-full-access mode
    codex -s danger-full-access \
        "You have access to Miyabi agents:
         
         Agents available:
         - しきるん (Conductor): Coordinates tasks
         - カエデ (CodeGen): Implements code
         - サクラ (Review): Reviews code
         
         Task: Analyze the current directory structure and suggest improvements.
         
         Use A2A communication format: [Agent名] Status: Detail"
}

# ------------------------------------------------------------
# Example 9: Parallel Agent Execution
# ------------------------------------------------------------

example_parallel() {
    echo "=== Example 9: Parallel Agent Tasks ==="
    
    claude --dangerously-skip-permissions \
        --agents '{
            "kaede_1": {
                "description": "CodeGen Instance 1",
                "prompt": "You are カエデ-1. Handle frontend implementation."
            },
            "kaede_2": {
                "description": "CodeGen Instance 2", 
                "prompt": "You are カエデ-2. Handle backend implementation."
            },
            "shikiroon": {
                "description": "Coordinator",
                "prompt": "Coordinate parallel work streams."
            }
        }' \
        "Implement a feature requiring both frontend and backend work:
         
         @shikiroon: Split the task
         @kaede_1: Implement frontend (React components)
         @kaede_2: Implement backend (API endpoints)
         
         Both report progress to @shikiroon.
         Merge results when both complete."
}

# ------------------------------------------------------------
# Example 10: Full Orchestration
# ------------------------------------------------------------

example_full_orchestration() {
    local task="$1"
    
    if [ -z "$task" ]; then
        task="Create a complete user management feature with CRUD operations"
    fi
    
    echo "=== Example 10: Full Orchestration ==="
    echo "Task: $task"
    
    claude --dangerously-skip-permissions \
        --agents "$(cat $AGENTS_FILE 2>/dev/null || echo '{}')" \
        "Execute full orchestration for: $task
         
         Workflow:
         1. @shikiroon analyzes and plans
         2. @mitsukeroon creates tracking issue
         3. @kaede implements
         4. @sakura reviews
         5. @tsubaki creates PR
         6. @botan prepares deployment
         
         PUSH communication required.
         Report all status changes.
         Request Guardian approval for production."
}

# ------------------------------------------------------------
# Main Menu
# ------------------------------------------------------------

show_menu() {
    cat << 'EOF'
Miyabi Claude Code A2A Examples
================================

Usage: ./cc_examples.sh <example_number> [args]

Examples:
  1. example_single_agent       Single agent task
  2. example_multi_agent        Multi-agent coordination
  3. example_from_file          Load agents from JSON file
  4. example_dev_workflow <n>   Development workflow for issue
  5. example_marketing <name>   Marketing campaign
  6. example_tmux_a2a          A2A tmux integration demo
  7. example_review_pipeline <n> Code review pipeline
  8. example_codex_integration  Codex integration
  9. example_parallel           Parallel agent execution
  10. example_full_orchestration "<task>"  Full orchestration

Quick Run:
  ./cc_examples.sh 1            Run example 1
  ./cc_examples.sh 4 270        Run dev workflow for issue #270
  ./cc_examples.sh 5 "Miyabi"   Run marketing for Miyabi

EOF
}

# Entry point
case "${1:-menu}" in
    1) example_single_agent ;;
    2) example_multi_agent ;;
    3) example_from_file ;;
    4) example_dev_workflow "$2" ;;
    5) example_marketing "$2" ;;
    6) example_tmux_a2a ;;
    7) example_review_pipeline "$2" ;;
    8) example_codex_integration ;;
    9) example_parallel ;;
    10) example_full_orchestration "$2" ;;
    menu|help|*) show_menu ;;
esac
