#!/bin/bash
# Create Planned Issues - 2026-01-09
# Run this script on a machine with gh CLI authenticated
# Usage: ./scripts/create-planned-issues.sh

set -e

REPO="ShunsukeHayashi/miyabi-private"

echo "Creating planned issues for $REPO..."
echo ""

# Check gh authentication
if ! gh auth status &>/dev/null; then
    echo "Error: gh CLI not authenticated. Run 'gh auth login' first."
    exit 1
fi

# Issue 1: Discord MCP Server
echo "Creating Issue 1: Discord MCP Server..."
gh issue create \
    --repo "$REPO" \
    --title "feat(discord-mcp): Complete Discord MCP Server core methods implementation" \
    --body "## Summary
The Discord MCP Server has several unimplemented methods that need to be completed for full functionality.

## Current State
- \`crates/miyabi-discord-mcp-server/src/discord/\` contains stub implementations
- Methods return \`todo!()\` or empty responses

## Files to Update
- \`src/discord/channel.rs\` - 5 methods
- \`src/discord/message.rs\` - 6 methods
- \`src/discord/role.rs\` - 2 methods
- \`src/rpc/handler.rs\` - Rate limit handling

## Tasks
- [ ] Implement channel methods (create, delete, update, get_channels, get_channel)
- [ ] Implement message methods (send, edit, delete, get, react, pin)
- [ ] Implement role methods (create_role, assign_role)
- [ ] Add proper rate limit tracking
- [ ] Add unit tests

## References
- \`crates/miyabi-discord-mcp-server/src/discord/channel.rs:10-47\`
- \`crates/miyabi-discord-mcp-server/src/discord/message.rs:10-70\`

## Estimated Duration
4-6 hours

## Priority
P1 - High" \
    --label "✨ type:feature" \
    --label "📊 impact:Medium"

echo "Issue 1 created!"

# Issue 2: Token Blacklist
echo "Creating Issue 2: Token Blacklist..."
gh issue create \
    --repo "$REPO" \
    --title "feat(web-api): Implement token blacklist for secure logout" \
    --body "## Summary
The authentication system currently lacks token blacklist functionality for secure session management.

## Current State
- \`src/routes/auth.rs:362\` - TODO comment for token blacklist
- \`tests/unit_auth.rs:296\` - TODO for Redis-based blacklist

## Implementation Plan
1. Create \`TokenBlacklist\` trait
2. Implement in-memory version for development
3. Implement Redis version for production
4. Integrate with logout endpoint

## Tasks
- [ ] Define \`TokenBlacklist\` trait in \`src/services/\`
- [ ] Create \`MemoryTokenBlacklist\` implementation
- [ ] Create \`RedisTokenBlacklist\` implementation
- [ ] Update \`/auth/logout\` endpoint
- [ ] Add middleware to check blacklist
- [ ] Add tests

## References
- \`crates/miyabi-web-api/src/routes/auth.rs:207,362\`

## Estimated Duration
2-3 hours

## Priority
P1 - High" \
    --label "🔒 security" \
    --label "✨ type:feature"

echo "Issue 2 created!"

# Issue 3: Stripe Billing
echo "Creating Issue 3: Stripe Billing..."
gh issue create \
    --repo "$REPO" \
    --title "feat(billing): Complete Stripe checkout and subscription management" \
    --body "## Summary
Billing routes have placeholder implementations that need to be connected to Stripe API.

## Current State
- \`src/routes/billing.rs:271-277\` - Checkout session creation is mocked
- \`src/routes/billing.rs:431\` - Subscription cancellation is mocked

## Tasks
- [ ] Add \`stripe-rust\` crate dependency
- [ ] Implement \`create_checkout_session\` with actual Stripe API
- [ ] Implement \`cancel_subscription\`
- [ ] Add webhook handler for Stripe events
- [ ] Add subscription status sync
- [ ] Add comprehensive tests with Stripe test mode

## References
- \`crates/miyabi-web-api/src/routes/billing.rs:271-431\`

## Estimated Duration
6-8 hours

## Priority
P2 - Medium" \
    --label "✨ type:feature" \
    --label "💰 billing"

echo "Issue 3 created!"

# Issue 4: Repository GitHub API
echo "Creating Issue 4: Repository GitHub API..."
gh issue create \
    --repo "$REPO" \
    --title "feat(repository): Integrate GitHub API for repository statistics" \
    --body "## Summary
Repository service returns hardcoded values for open_issues and open_prs counters.

## Current State
- \`src/services/repository_service.rs:257-258\` - Returns 0 for both counts

## Tasks
- [ ] Add octocrab client to repository service
- [ ] Implement \`fetch_repository_stats\` method
- [ ] Add caching layer for API rate limiting
- [ ] Update repository list endpoint
- [ ] Add tests with mocked GitHub API

## References
- \`crates/miyabi-web-api/src/services/repository_service.rs:257-258\`

## Estimated Duration
3-4 hours

## Priority
P2 - Medium" \
    --label "✨ type:feature"

echo "Issue 4 created!"

# Issue 5: Agent Execution
echo "Creating Issue 5: Agent Execution..."
gh issue create \
    --repo "$REPO" \
    --title "feat(agents): Implement actual agent execution in API routes" \
    --body "## Summary
Multiple API endpoints have placeholder agent execution that needs real implementation.

## Current State
- \`src/routes/agents.rs:526\` - Agent execution is mocked
- \`src/routes/codegen.rs:142\` - CodeGenAgent execution is mocked
- \`src/routes/telegram.rs:578\` - Agent execution is mocked

## Tasks
- [ ] Create \`AgentExecutor\` service
- [ ] Integrate with A2ABridge for agent invocation
- [ ] Add async task queue for long-running agents
- [ ] Implement progress tracking
- [ ] Add WebSocket notifications for agent status
- [ ] Add comprehensive integration tests

## References
- \`crates/miyabi-web-api/src/routes/agents.rs:526\`
- \`crates/miyabi-web-api/src/routes/codegen.rs:142\`

## Estimated Duration
8-10 hours

## Priority
P1 - High" \
    --label "✨ type:feature" \
    --label "📊 impact:High"

echo "Issue 5 created!"

# Issue 6: tmux Enhancements
echo "Creating Issue 6: tmux Enhancements..."
gh issue create \
    --repo "$REPO" \
    --title "refactor(tmux): Add session metadata and agent mapping" \
    --body "## Summary
tmux routes lack proper metadata parsing and agent-to-pane mapping.

## Current State
- \`src/routes/tmux.rs:189-190\` - created_at and attached not parsed
- \`src/routes/tmux.rs:295\` - Agent mapping not implemented

## Tasks
- [ ] Parse tmux session creation time
- [ ] Detect session attachment status
- [ ] Implement agent-to-pane mapping from conductor timeline
- [ ] Add session health check endpoint
- [ ] Add tests

## References
- \`crates/miyabi-web-api/src/routes/tmux.rs:189-295\`

## Estimated Duration
2-3 hours

## Priority
P3 - Low" \
    --label "🔧 type:refactor"

echo "Issue 6 created!"

# Issue 7: DAG Optimization
echo "Creating Issue 7: DAG Optimization..."
gh issue create \
    --repo "$REPO" \
    --title "perf(dag): Optimize topological sort with task-to-level map" \
    --body "## Summary
The DAG topological sort implementation has a TODO for optimization.

## Current State
- \`src/topological.rs:131\` - TODO comment for optimization

## Tasks
- [ ] Add task-to-level HashMap cache
- [ ] Optimize level lookup in parallel execution
- [ ] Add benchmarks
- [ ] Verify correctness with property tests

## References
- \`crates/miyabi-dag/src/topological.rs:131\`

## Estimated Duration
1-2 hours

## Priority
P3 - Low" \
    --label "⚡ type:performance"

echo "Issue 7 created!"

# Issue 8: Five Worlds Merge
echo "Creating Issue 8: Five Worlds Merge..."
gh issue create \
    --repo "$REPO" \
    --title "feat(worktree): Implement Five Worlds merge logic" \
    --body "## Summary
The Five Worlds worktree implementation has placeholder merge logic.

## Current State
- \`src/five_worlds.rs:425\` - Merge logic returns placeholder

## Tasks
- [ ] Design merge strategy for parallel worktrees
- [ ] Implement conflict detection
- [ ] Implement automatic merge for non-conflicting changes
- [ ] Add manual conflict resolution API
- [ ] Add integration tests

## References
- \`crates/miyabi-worktree/src/five_worlds.rs:425\`

## Estimated Duration
4-5 hours

## Priority
P2 - Medium" \
    --label "✨ type:feature"

echo "Issue 8 created!"

echo ""
echo "=========================================="
echo "All 8 issues created successfully!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Issue 1: Discord MCP Server (P1)"
echo "  - Issue 2: Token Blacklist (P1)"
echo "  - Issue 3: Stripe Billing (P2)"
echo "  - Issue 4: Repository GitHub API (P2)"
echo "  - Issue 5: Agent Execution (P1)"
echo "  - Issue 6: tmux Enhancements (P3)"
echo "  - Issue 7: DAG Optimization (P3)"
echo "  - Issue 8: Five Worlds Merge (P2)"
echo ""
echo "Total estimated: 30-41 hours"
