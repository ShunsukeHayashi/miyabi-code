#!/bin/bash
# Miyabi - Headless Task Template Generator
# Usage: ./create-headless-task.sh <task-name> <task-type>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

usage() {
    cat << EOF
Usage: $0 <task-name> <task-type>

Arguments:
  task-name    Name of the new task (lowercase, hyphen-separated)
  task-type    Type of task (batch|analysis|report|transform)

Examples:
  $0 weekly-report report
  $0 security-audit analysis
  $0 create-prs batch

Available task types:
  - batch: Batch creation tasks (issues, PRs, docs)
  - analysis: Code/data analysis tasks
  - report: Periodic report generation
  - transform: Data transformation tasks

EOF
    exit 0
}

# Parse arguments
if [[ $# -lt 2 ]]; then
    usage
fi

TASK_NAME="$1"
TASK_TYPE="$2"

# Validate task name
if [[ ! "$TASK_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "Error: Task name must be lowercase with hyphens only"
    exit 1
fi

# Validate task type
if [[ ! "$TASK_TYPE" =~ ^(batch|analysis|report|transform)$ ]]; then
    echo "Error: Invalid task type. Must be: batch, analysis, report, or transform"
    exit 1
fi

PROMPT_FILE="$PROJECT_ROOT/.claude/prompts/$TASK_NAME.txt"
TEMPLATE_FILE="$PROJECT_ROOT/.claude/templates/$TASK_NAME.json"
SCRIPT_FILE="$PROJECT_ROOT/.claude/scripts/$TASK_NAME.sh"

# Check if files already exist
if [[ -f "$PROMPT_FILE" ]] || [[ -f "$TEMPLATE_FILE" ]]; then
    log_warning "Task '$TASK_NAME' already exists. Overwrite? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Aborted"
        exit 0
    fi
fi

echo "================================"
echo "Miyabi - Create Headless Task"
echo "================================"
echo ""
log_info "Task name: $TASK_NAME"
log_info "Task type: $TASK_TYPE"
echo ""

# Create prompt template
log_info "Creating prompt template..."

case "$TASK_TYPE" in
    batch)
        AGENT_DESCRIPTION="Batch Creation Agent"
        TASK_DESCRIPTION="Create multiple items in batch from the provided JSON template."
        ;;
    analysis)
        AGENT_DESCRIPTION="Analysis Agent"
        TASK_DESCRIPTION="Analyze the provided data and generate findings with recommendations."
        ;;
    report)
        AGENT_DESCRIPTION="Report Generation Agent"
        TASK_DESCRIPTION="Generate a structured report from the collected data."
        ;;
    transform)
        AGENT_DESCRIPTION="Data Transformation Agent"
        TASK_DESCRIPTION="Transform input data according to specified rules."
        ;;
esac

cat > "$PROMPT_FILE" << EOF
You are a ${AGENT_DESCRIPTION} within the Miyabi Society.

# Task

${TASK_DESCRIPTION}

# Input Format

You will receive a JSON file containing:
- task_name: Name of this task
- description: Task description
- parameters: Task-specific parameters
- data: Array of data items to process

# Instructions

1. Read the JSON template provided after this prompt
2. Process each item in the "data" array according to task type
3. Track progress and report:
   - Total items to process
   - Current progress (N/Total)
   - Processed item IDs
   - Any errors encountered
4. After all items are processed:
   - Generate a summary report
   - List all processed items

# Important Notes

- Handle errors gracefully and continue processing
- Do not stop on errors - process as many items as possible
- Provide detailed error messages for debugging
- At the end, provide a complete report of successes and failures

# Output Format

Provide a structured report:
\`\`\`
# ${AGENT_DESCRIPTION} Report

**Task**: [task_name]
**Total Items**: N
**Successfully Processed**: M
**Failed**: K

## Processed Items

1. [Item 1]
2. [Item 2]
...

## Failed Items (if any)

1. [Item] - Error: [error message]
...

## Summary

[Brief summary of the processing]
\`\`\`

# JSON Template

EOF

log_success "Prompt created: $PROMPT_FILE"

# Create template
log_info "Creating JSON template..."

cat > "$TEMPLATE_FILE" << EOF
{
  "task_name": "${TASK_NAME}",
  "version": "1.0.0",
  "created_at": "$(date +%Y-%m-%d)",
  "description": "TODO: Add task description",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  },
  "data": [
    {
      "id": "item-1",
      "field1": "data1",
      "field2": "data2"
    },
    {
      "id": "item-2",
      "field1": "data3",
      "field2": "data4"
    }
  ]
}
EOF

log_success "Template created: $TEMPLATE_FILE"

# Create execution script
log_info "Creating execution script..."

cat > "$SCRIPT_FILE" << 'EOF'
#!/bin/bash
# Auto-generated execution script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TASK_NAME="TASK_NAME_PLACEHOLDER"
PROMPT_FILE="$PROJECT_ROOT/.claude/prompts/$TASK_NAME.txt"

# Default template
TEMPLATE_NAME="${1:-$TASK_NAME}"
TEMPLATE_FILE="$PROJECT_ROOT/.claude/templates/$TEMPLATE_NAME.json"

# Validate files
if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "Error: Prompt file not found: $PROMPT_FILE"
    exit 1
fi

if [[ ! -f "$TEMPLATE_FILE" ]]; then
    echo "Error: Template file not found: $TEMPLATE_FILE"
    exit 1
fi

echo "Executing $TASK_NAME with template: $TEMPLATE_NAME"
echo ""

cd "$PROJECT_ROOT"

# Execute with Claude Code headless mode
claude -p "$(cat "$PROMPT_FILE")

$(cat "$TEMPLATE_FILE")"
EOF

# Replace placeholder
sed -i '' "s/TASK_NAME_PLACEHOLDER/$TASK_NAME/g" "$SCRIPT_FILE"

chmod +x "$SCRIPT_FILE"

log_success "Script created: $SCRIPT_FILE"

echo ""
echo "================================"
echo "Task created successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit the prompt template:"
echo "   nano $PROMPT_FILE"
echo ""
echo "2. Edit the JSON template:"
echo "   nano $TEMPLATE_FILE"
echo ""
echo "3. Execute the task:"
echo "   $SCRIPT_FILE"
echo ""
echo "Or use the one-liner:"
echo "   cd ~/Dev/miyabi-private && claude -p \"\$(cat .claude/prompts/$TASK_NAME.txt)"
echo ""
echo "   \$(cat .claude/templates/$TASK_NAME.json)\""
echo ""
