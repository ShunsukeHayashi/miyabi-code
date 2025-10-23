# ADR-002: Use GitHub as Operating System

**Status**: ✅ Accepted
**Date**: 2025-08-20
**Deciders**: Core Team, Lead Architect, DevOps Lead
**Technical Story**: Related to GitHub OS Integration Architecture

---

## Context

### Problem Statement

Traditional software projects separate their development tools, state storage, and execution environment:
- State stored in databases (PostgreSQL, Redis, MongoDB)
- Execution on separate servers (AWS, GCP, self-hosted)
- Development tools isolated from production (local dev vs cloud)
- Complex synchronization between systems

This separation creates several issues:
1. **State Synchronization**: Keeping multiple state stores consistent
2. **Infrastructure Cost**: Running dedicated databases and servers
3. **Deployment Complexity**: Multiple deployment targets
4. **Observability Gaps**: Logs and state in different systems
5. **Access Control**: Managing permissions across platforms

For Miyabi, we needed a unified platform that could serve as:
- Primary state layer (Issues, PRs, Labels)
- Event bus (Webhooks, Actions)
- Execution environment (GitHub Actions, self-hosted runners)
- Storage layer (Packages, Releases, Artifacts)
- Identity provider (GitHub OAuth)

### Constraints

- Must be accessible to all team members
- Must support autonomous agent execution
- Must provide real-time event notifications
- Must scale to thousands of Issues/PRs
- Must maintain state durability and consistency
- Must support parallel execution (worktrees)

### Assumptions

- GitHub API rate limits are sufficient (5000 req/hour authenticated)
- GitHub Actions provides enough compute time (2000 min/month free, unlimited self-hosted)
- GitHub's 99.95% uptime SLA is acceptable
- Team is familiar with GitHub workflows

---

## Decision

**Use GitHub as the primary operating system for Miyabi, with all state stored in GitHub primitives and all execution happening via GitHub Actions or self-hosted runners.**

### Implementation Details

**GitHub OS Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│ GitHub OS - Core Primitives                              │
├─────────────────────────────────────────────────────────┤
│ • Issues        → State Entities (Tasks, Bugs, Features)│
│ • PRs           → State Transitions (Code Changes)      │
│ • Labels        → State Metadata (53-label system)      │
│ • Projects V2   → State Collections (Dashboards)        │
│ • Discussions   → Message Queue (Async Communication)   │
│ • Actions       → Execution Engine (CI/CD)              │
│ • Packages      → Artifact Storage (Binaries, Images)   │
│ • Webhooks      → Event Bus (Real-time Notifications)   │
│ • OAuth         → Identity Provider (Authentication)    │
└─────────────────────────────────────────────────────────┘
```

**State Management Strategy**:
1. **Issues as State Entities**:
   - Every task, bug, feature is an Issue
   - Labels define Issue state (📥 pending, 🔍 analyzing, etc.)
   - Issue body contains structured data (JSON in code blocks)
   - Issue comments track state transitions

2. **PRs as State Transitions**:
   - Every code change creates a PR
   - PR merge = state transition commit
   - PR labels indicate review status
   - PR checks validate state transition

3. **Labels as State Metadata**:
   - 53 labels across 10 categories
   - Labels are queryable via GitHub API
   - Labels trigger automated workflows
   - Labels define agent assignment

4. **GitHub Actions as Execution**:
   - Water Spider orchestrator runs on self-hosted runner
   - Agent execution triggered by Issue labels
   - Worktree operations via Actions
   - Results pushed back to Issues

**Technology Choices**:
- **API Client**: octocrab (Rust GitHub API wrapper)
- **Webhook Handler**: axum web framework
- **Event Processing**: tokio async runtime
- **State Queries**: GitHub GraphQL API v4
- **Authentication**: GitHub App + Installation tokens

### Success Criteria

- ✅ All Miyabi state stored in GitHub (zero external databases)
- ✅ All agent execution via GitHub Actions (zero external compute)
- ✅ State queries respond in <500ms (GitHub API latency)
- ✅ 99.9% uptime (matching GitHub SLA)
- ✅ Support 100+ concurrent Issues without degradation
- ✅ Complete audit trail in GitHub (all actions logged)

---

## Consequences

### Positive

- **💰 Cost Reduction**: No database servers, no application servers ($200-500/month savings)
- **🔒 Security**: GitHub handles authentication, authorization, audit logging
- **📊 Observability**: All state visible in GitHub UI, no separate dashboards needed
- **🚀 Scalability**: GitHub scales automatically, no capacity planning
- **🔄 Simplicity**: Single source of truth, no state synchronization
- **🛡️ Durability**: GitHub's backup and disaster recovery included
- **👥 Collaboration**: All team members already have GitHub access
- **📝 Audit Trail**: Complete history of all state changes
- **🔌 Integration**: Easy integration with existing GitHub ecosystem

### Negative

- **⏱️ API Rate Limits**: 5000 req/hour can be limiting for high-volume operations
  - Mitigation: Conditional requests (ETags), GraphQL batching, caching
- **🌐 Internet Dependency**: Requires internet connection to GitHub
  - Mitigation: Self-hosted runner for local execution, offline mode for dev
- **📦 Vendor Lock-in**: Tightly coupled to GitHub platform
  - Mitigation: Abstraction layer (`miyabi-github` crate), migration path documented
- **🔍 Query Limitations**: GitHub API less flexible than SQL
  - Mitigation: Projects V2 API for complex queries, local caching
- **💾 Storage Limits**: GitHub Issues have size limits (~65KB per comment)
  - Mitigation: Large data in GitHub Packages, references in Issues

### Neutral

- **🔧 Learning Curve**: Team needs to understand GitHub OS concepts (2-3 days)
- **📚 Documentation**: GitHub API docs comprehensive but extensive
- **🔄 API Versioning**: GitHub API evolves, requires maintenance

---

## Alternatives Considered

### Option 1: Traditional Database (PostgreSQL)

**Description**: Use PostgreSQL for state, separate application server

**Pros**:
- Powerful SQL queries
- Proven reliability
- Full control over schema
- No rate limits

**Cons**:
- Infrastructure cost ($50-200/month)
- Database maintenance overhead
- State synchronization with GitHub
- Separate backup strategy
- Access control complexity

**Why rejected**: Infrastructure cost and complexity outweigh benefits

### Option 2: Hybrid Approach (GitHub + Database)

**Description**: Use GitHub for Issues/PRs, database for complex queries

**Pros**:
- Best of both worlds
- Flexible querying
- GitHub UI benefits

**Cons**:
- State synchronization complexity
- Two sources of truth
- Infrastructure cost
- Increased failure points

**Why rejected**: Violates "single source of truth" principle

### Option 3: Alternative Git Hosting (GitLab, Gitea)

**Description**: Use GitLab or self-hosted Gitea instead of GitHub

**Pros**:
- Similar primitives (Issues, MRs, CI)
- GitLab has built-in database
- Self-hosted option available

**Cons**:
- Less mature API ecosystem
- Smaller community
- Self-hosting complexity
- Team already on GitHub

**Why rejected**: GitHub's ecosystem and team familiarity

---

## References

- **GitHub OS Integration Guide**: `docs/GITHUB_OS_INTEGRATION.md`
- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md`
- **GitHub API v4 (GraphQL)**: https://docs.github.com/en/graphql
- **GitHub REST API**: https://docs.github.com/en/rest
- **Octocrab Docs**: https://docs.rs/octocrab/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Notes

### GitHub API Usage Patterns

**Efficient API Usage**:
```rust
use octocrab::{Octocrab, models::issues::Issue};

// GraphQL batch query (1 API call for multiple Issues)
let query = r#"
  query($owner: String!, $repo: String!, $states: [IssueState!]) {
    repository(owner: $owner, name: $repo) {
      issues(first: 100, states: $states) {
        nodes {
          number
          title
          labels(first: 10) { nodes { name } }
          state
        }
      }
    }
  }
"#;

let result: serde_json::Value = octocrab
    .graphql(query)
    .await?;
```

**Conditional Requests (ETags)**:
```rust
// First request
let (issue, etag) = octocrab
    .issues("owner", "repo")
    .get(270)
    .await?;

// Subsequent request (returns 304 Not Modified if unchanged)
let updated = octocrab
    .issues("owner", "repo")
    .get_with_etag(270, &etag)
    .await?;
```

### GitHub Rate Limit Management

**Rate Limit Statistics** (as of 2025-10-24):
- Authenticated: 5000 requests/hour
- GraphQL: 5000 points/hour (1 query = 1-100 points depending on complexity)
- Search API: 30 requests/minute
- Conditional requests (304): Do not count against rate limit ✅

**Best Practices**:
1. Use GraphQL for batch queries (10x reduction in API calls)
2. Implement conditional requests with ETags
3. Cache frequently accessed data (labels, project fields)
4. Use webhooks instead of polling
5. Batch write operations (create multiple labels in one call)

### Migration from Database (Lessons Learned)

**Before (PostgreSQL Era)**:
- Infrastructure: $150/month (RDS db.t3.small)
- Maintenance: 5 hours/month (backups, upgrades, monitoring)
- API latency: 50-100ms (database query)
- Total cost: $200/month + 5 hours labor

**After (GitHub OS)**:
- Infrastructure: $0/month (GitHub free tier + self-hosted runner)
- Maintenance: 0 hours/month (GitHub handles everything)
- API latency: 200-500ms (GitHub API, but acceptable)
- Total cost: $0/month + 0 hours labor

**ROI**: $2,400/year + 60 hours/year savings ✅

### Future Considerations

- ✅ **GitHub Projects V2**: Advanced state queries with custom fields
- ✅ **GitHub Discussions**: Message queue for async agent communication
- ⏳ **GitHub Copilot Workspace**: Potential integration for AI-assisted development
- ⏳ **GitHub Packages**: Artifact storage for deployments (Container Registry, NPM)
- ⏳ **GitHub Pages**: Static site hosting for documentation and dashboards

---

**Last Updated**: 2025-10-24
**Reviewers**: Lead Architect, DevOps Lead, Security Engineer
**Actual Outcome**: ✅ All success criteria met, $2,400/year cost savings
