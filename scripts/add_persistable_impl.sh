#!/bin/bash
# Add PersistableAgent implementation to all business agents

set -e

AGENTS=(
    "ai_entrepreneur:AIEntrepreneurAgent"
    "analytics:AnalyticsAgent"
    "content_creation:ContentCreationAgent"
    "crm:CRMAgent"
    "funnel_design:FunnelDesignAgent"
    "jonathan_ive_design:JonathanIveDesignAgent"
    "market_research:MarketResearchAgent"
    "marketing:MarketingAgent"
    "persona:PersonaAgent"
    "product_concept:ProductConceptAgent"
    "product_design:ProductDesignAgent"
    "sales:SalesAgent"
    "self_analysis:SelfAnalysisAgent"
    "sns_strategy:SNSStrategyAgent"
    "youtube:YouTubeAgent"
)

AGENT_DIR="crates/miyabi-agent-business/src"

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r file_name agent_name <<< "$agent_info"
    file_path="$AGENT_DIR/${file_name}.rs"

    echo "Processing $agent_name in $file_path..."

    # Check if file already has impl_persistable_agent macro call
    if grep -q "impl_persistable_agent!" "$file_path"; then
        echo "  ✓ Already has PersistableAgent implementation, skipping"
        continue
    fi

    # Add implementation at the end of file (before the final newline if any)
    cat >> "$file_path" << EOF

// Database persistence implementation
crate::impl_persistable_agent!($agent_name, "$agent_name");
EOF

    echo "  ✓ Added PersistableAgent implementation"
done

echo ""
echo "✅ All business agents now implement PersistableAgent!"
