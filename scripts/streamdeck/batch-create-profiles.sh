#!/bin/bash
# Batch create remaining Stream Deck scripts

echo "🎮 Creating Profile 2-5 scripts..."

# Profile 2: Business Agents (21-35)
for i in {21..34}; do
  AGENT_NAMES=("strategy-planner" "marketing-manager" "sales-manager" "growth-analyst" "brand-manager" "content-creator" "market-researcher" "insight-analyst" "pricing-strategist" "crm-manager" "lead-manager" "campaign-manager" "social-media" "restart-agent")
  AGENT_IDX=$((i - 21))
  AGENT_NAME=${AGENT_NAMES[$AGENT_IDX]}
  
  cat > "${i}-${AGENT_NAME}.sh" <<EOF
#!/bin/bash
# Stream Deck: ${AGENT_NAME^}
# Control ${AGENT_NAME} business agent

osascript -e 'display notification "${AGENT_NAME}操作中..." with title "🎮 Stream Deck"'

# Agent-specific logic here
echo "${AGENT_NAME} executed"
EOF
  chmod +x "${i}-${AGENT_NAME}.sh"
done

# Profile 3: Development Tools (41-55)
DEV_TOOLS=("build-all" "test-all" "lint-check" "package-release" "branch-create" "merge-pr" "push-remote" "pull-origin" "tag-version" "debug-mode" "profile-run" "security-audit" "docs-generate" "clean-build")
for i in {41..54}; do
  TOOL_IDX=$((i - 41))
  TOOL_NAME=${DEV_TOOLS[$TOOL_IDX]}
  
  cat > "${i}-${TOOL_NAME}.sh" <<EOF
#!/bin/bash
# Stream Deck: ${TOOL_NAME^}
# Development tool: ${TOOL_NAME}

osascript -e 'display notification "${TOOL_NAME}実行中..." with title "🛠️  Stream Deck"'

cd ~/Dev/miyabi-private

case "${TOOL_NAME}" in
  "build-all") cargo build --all --release ;;
  "test-all") cargo test --all ;;
  "lint-check") cargo clippy -- -D warnings ;;
  "clean-build") cargo clean && cargo build --release ;;
  *) echo "${TOOL_NAME} executed" ;;
esac
EOF
  chmod +x "${i}-${TOOL_NAME}.sh"
done

echo "✅ Created $(ls *.sh | wc -l) scripts total"
