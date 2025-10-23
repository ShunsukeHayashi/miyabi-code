# ADR-007: 53-Label State Management System

**Status**: ✅ Accepted
**Date**: 2025-10-05
**Deciders**: Core Team, Lead Architect, DevOps Lead, Product Manager
**Technical Story**: Related to GitHub OS State Management Architecture

---

## Context

### Problem Statement

In traditional software systems, application state is stored in databases (PostgreSQL, Redis, etc.) and queried via SQL or other query languages. For Miyabi, which uses GitHub as its operating system (ADR-002), we needed a state management mechanism that:

1. **Is GitHub-Native**: Uses GitHub primitives, no external databases
2. **Is Human-Readable**: Developers can understand state at a glance
3. **Is Queryable**: Easy to filter and search (GitHub API, GraphQL)
4. **Triggers Automation**: State changes trigger workflows
5. **Is Auditable**: Complete history of state transitions
6. **Supports Complexity**: Handle 10+ different state dimensions

**State Dimensions for an Issue**:
- **Lifecycle**: pending → analyzing → implementing → reviewing → done
- **Agent Assignment**: Which agent should process this Issue?
- **Priority**: How urgent is this Issue?
- **Type**: Is this a feature, bug, documentation, or something else?
- **Severity**: How critical is this Issue for security/stability?
- **Phase**: Which project phase does this belong to?
- **Special Flags**: Security, cost-watch, dependencies, etc.
- **Triggers**: Should this automatically trigger an action?
- **Quality**: What is the quality score (after review)?
- **Community**: Is this good-first-issue, help-wanted, etc.?

**Challenge**: How to represent 10+ dimensions of state in a GitHub-native way?

**Naive Approach (Issue Body Text)**:
```markdown
Status: implementing
Agent: CodeGenAgent
Priority: P1-High
Type: feature
```
❌ Not queryable, not triggerable, manual parsing required

**Alternative Approach (GitHub Projects Custom Fields)**:
```yaml
Status: implementing
Agent: CodeGenAgent
Priority: P1-High
```
❌ Limited to 10 custom fields, no automatic triggers, API limitations

**Our Approach (GitHub Labels)**:
```
📥 state:pending
🤖 agent:codegen
⚠️ priority:P1-High
✨ type:feature
```
✅ Queryable, triggerable, human-readable, unlimited dimensions

### Constraints

- Must use GitHub primitives only (no external state stores)
- Must support automated workflows (label-based triggers)
- Must be human-readable (developers understand at a glance)
- Must be queryable via GitHub API (filter by multiple labels)
- Must support complex state transitions (state machines)
- Must scale to 1000+ Issues without performance degradation

### Assumptions

- GitHub supports 100+ labels per repository (tested, works)
- Label-based automation is reliable (GitHub Actions, webhooks)
- Emoji prefixes improve scannability (tested with users)
- 53 labels sufficient for all state dimensions (extensible)

---

## Decision

**Use a structured 53-label system organized into 10 categories to represent all application state, with labels serving as the primary state management mechanism in Miyabi's GitHub OS architecture.**

### Implementation Details

**Label System Architecture**:
```
53 Labels organized into 10 Categories
    ↓
Each Category represents a State Dimension
    ↓
Labels applied to Issues/PRs
    ↓
GitHub API queries by labels
    ↓
GitHub Webhooks trigger on label changes
    ↓
Agents read labels to determine state
    ↓
Agents modify labels to transition state
```

**10 Categories (53 Labels Total)**:

**1. STATE (8 labels)** - Lifecycle management
```yaml
📥 state:pending           # New Issue, not yet processed
🔍 state:analyzing         # CoordinatorAgent analyzing
📋 state:planned           # Tasks created, ready for execution
🏗️ state:implementing     # CodeGenAgent executing
👀 state:reviewing         # ReviewAgent checking quality
🚢 state:deploying         # DeploymentAgent deploying
✅ state:done              # Complete, merged, deployed
🚫 state:blocked           # Blocked by dependency or issue
```

**2. AGENT (6 labels)** - Agent assignment
```yaml
🤖 agent:coordinator       # Assign to CoordinatorAgent
🤖 agent:codegen           # Assign to CodeGenAgent
🤖 agent:review            # Assign to ReviewAgent
🤖 agent:deployment        # Assign to DeploymentAgent
🤖 agent:pr                # Assign to PRAgent
🤖 agent:issue             # Assign to IssueAgent
```

**3. PRIORITY (4 labels)** - Urgency level
```yaml
🔥 priority:P0-Critical    # Production down, immediate action
⚠️ priority:P1-High        # Major bug, feature blocker
📌 priority:P2-Medium      # Normal priority
📝 priority:P3-Low         # Nice to have, backlog
```

**4. TYPE (7 labels)** - Issue classification
```yaml
✨ type:feature            # New functionality
🐛 type:bug                # Bug fix
📚 type:docs               # Documentation
♻️ type:refactor           # Code refactoring
⚡ type:performance        # Performance improvement
🔒 type:security           # Security fix/feature
🧪 type:test               # Testing-related
```

**5. SEVERITY (4 labels)** - Impact/escalation level
```yaml
🚨 severity:Sev.1-Critical  # Data loss, security breach (CTO escalation)
⚠️ severity:Sev.2-High      # Service degradation (Team Lead escalation)
📊 severity:Sev.3-Medium    # Minor impact (Standard workflow)
ℹ️ severity:Sev.4-Low       # Cosmetic, minimal impact
```

**6. PHASE (5 labels)** - Project phase
```yaml
🎯 phase:planning          # Requirements, design phase
🛠️ phase:development       # Active development
🧪 phase:testing           # QA, testing phase
🚀 phase:deployment        # Deployment, release
📊 phase:monitoring        # Post-release monitoring
```

**7. SPECIAL (7 labels)** - Special handling flags
```yaml
🔐 security                # Security-related (extra scrutiny)
💰 cost-watch              # Monitor costs (cloud resources)
🔄 dependencies            # External dependency update
🎨 design                  # Design/UX change required
⚙️ config                  # Configuration change
🌍 i18n                    # Internationalization
♿ accessibility           # Accessibility improvement
```

**8. TRIGGER (4 labels)** - Automation triggers
```yaml
🤖 trigger:agent-execute   # Auto-execute assigned agent
🚀 trigger:deploy-staging  # Auto-deploy to staging
🚀 trigger:deploy-production # Auto-deploy to production (after approval)
🔄 trigger:auto-close      # Auto-close when PR merged
```

**9. QUALITY (4 labels)** - Post-review quality scores
```yaml
⭐ quality:excellent       # 90-100 points (auto-merge approved)
👍 quality:good            # 80-89 points (auto-merge approved)
⚠️ quality:acceptable      # 70-79 points (manual review required)
❌ quality:needs-work      # <70 points (rejected, needs rework)
```

**10. COMMUNITY (4 labels)** - Community engagement
```yaml
👋 good-first-issue        # Easy for newcomers
🙏 help-wanted             # Community help requested
💬 discussion              # Discussion/RFC needed
🎓 mentorship              # Mentorship available
```

**Label Naming Convention**:
```
{emoji} {category}:{value}

Examples:
📥 state:pending
🤖 agent:codegen
⚠️ priority:P1-High
✨ type:feature
```

**State Transition Example** (Issue #270 lifecycle):
```bash
# 1. Issue created
gh issue create --title "Add feature X" --label "📥 state:pending"

# 2. IssueAgent analyzes
gh issue edit 270 --add-label "🤖 agent:issue,🔍 state:analyzing"
gh issue edit 270 --remove-label "📥 state:pending"
# IssueAgent adds: ✨ type:feature, ⚠️ priority:P1-High

# 3. CoordinatorAgent plans
gh issue edit 270 --add-label "🤖 agent:coordinator,📋 state:planned"
gh issue edit 270 --remove-label "🔍 state:analyzing"

# 4. CodeGenAgent implements
gh issue edit 270 --add-label "🤖 agent:codegen,🏗️ state:implementing"
gh issue edit 270 --remove-label "📋 state:planned"

# 5. ReviewAgent reviews
gh issue edit 270 --add-label "🤖 agent:review,👀 state:reviewing"
gh issue edit 270 --remove-label "🏗️ state:implementing"
# ReviewAgent adds: ⭐ quality:excellent (score: 92/100)

# 6. DeploymentAgent deploys
gh issue edit 270 --add-label "🤖 agent:deployment,🚢 state:deploying"
gh issue edit 270 --remove-label "👀 state:reviewing"

# 7. Done
gh issue edit 270 --add-label "✅ state:done"
gh issue edit 270 --remove-label "🚢 state:deploying"
gh issue close 270
```

**Label-Based Automation** (GitHub Actions trigger):
```yaml
name: Agent Execution
on:
  issues:
    types: [labeled]

jobs:
  execute-agent:
    if: contains(github.event.label.name, 'trigger:agent-execute')
    runs-on: ubuntu-latest
    steps:
      - name: Execute Agent
        run: |
          # Extract agent type from labels
          AGENT=$(gh issue view ${{ github.event.issue.number }} \
            --json labels --jq '.labels[] | select(.name | startswith("agent:")) | .name')

          # Execute agent
          miyabi agent run $AGENT --issue ${{ github.event.issue.number }}
```

**GitHub API Query Examples**:
```bash
# Find all Issues assigned to CodeGenAgent
gh issue list --label "agent:codegen"

# Find all P0-Critical Issues
gh issue list --label "priority:P0-Critical"

# Find all Issues currently implementing
gh issue list --label "state:implementing"

# Complex query: High-priority features in review
gh issue list --label "priority:P1-High,type:feature,state:reviewing"

# GraphQL query (multiple labels)
gh api graphql -f query='
{
  repository(owner: "owner", name: "repo") {
    issues(first: 100, labels: ["agent:codegen", "state:implementing"]) {
      nodes {
        number
        title
        labels(first: 10) { nodes { name } }
      }
    }
  }
}'
```

**Technology Choices**:
- **Label Storage**: GitHub Issues API (native)
- **Label Sync**: `.github/labels.yml` + GitHub Actions sync
- **Query API**: GitHub REST API v3 + GraphQL API v4
- **Webhooks**: GitHub webhooks for label change events
- **Rust Integration**: octocrab crate for label operations

### Success Criteria

- ✅ All 53 labels defined and synced across repositories
- ✅ State transitions 100% represented by label changes
- ✅ Label-based queries <500ms (GitHub API)
- ✅ Automated workflows triggered by label changes
- ✅ Zero external state stores required
- ✅ Human-readable at a glance (emoji + clear names)

---

## Consequences

### Positive

- **🔍 Queryable**: GitHub API supports filtering by multiple labels
- **🤖 Triggerable**: Webhooks fire on label changes, enabling automation
- **👀 Human-Readable**: Emoji prefixes + clear names (no need to open Issue)
- **📊 Auditable**: Complete label history in GitHub timeline
- **🔧 Simple**: No external database, no SQL, just labels
- **⚡ Fast**: GitHub API label queries <500ms
- **🌍 Universal**: Works across Issues, PRs, Discussions
- **📈 Scalable**: Tested with 1000+ Issues, no performance issues
- **🎨 Visual**: Issue list shows state at a glance with colored labels

### Negative

- **📋 Label Proliferation**: 53 labels is a lot to manage
  - Mitigation: `.github/labels.yml` for version control, automated sync
- **🔄 Manual Label Changes**: Developers can manually change labels (mistake risk)
  - Mitigation: Validation webhooks, agent-driven label management
- **🧩 No Conditional Logic**: Labels are boolean (present/absent), no values
  - Mitigation: Use multiple labels for compound state (e.g., P1-High + feature)
- **🔎 Search Limitations**: GitHub search doesn't support NOT (exclude labels)
  - Mitigation: Use GraphQL API for complex queries
- **📊 No Label Hierarchy**: Labels are flat, no parent-child relationships
  - Mitigation: Naming convention (category:value) provides logical grouping

### Neutral

- **📚 Learning Curve**: Team needs to learn 53 labels (2-3 days)
- **🔄 Migration**: Existing Issues need retroactive labeling (one-time effort)
- **📖 Documentation**: Label system must be well-documented (LABEL_SYSTEM_GUIDE.md)

---

## Alternatives Considered

### Option 1: GitHub Projects Custom Fields

**Description**: Use GitHub Projects V2 with custom fields for state

**Pros**:
- Structured data (dropdowns, numbers, dates)
- Kanban board visualization
- API support (GraphQL)

**Cons**:
- Limited to 10 custom fields per project
- Slower API queries (Projects API slower than Issues API)
- No webhook triggers on field changes
- Less visible (must open Project view)
- Not applicable to Discussions

**Why rejected**: Field limit, no triggers, less visible

### Option 2: Issue Body Metadata (YAML Frontmatter)

**Description**: Store state in Issue body as YAML frontmatter

```yaml
---
state: implementing
agent: codegen
priority: P1-High
---
```

**Pros**:
- Structured data
- No label limit
- Can include complex data (objects, arrays)

**Cons**:
- Not queryable via GitHub API (must parse body)
- No webhook triggers on body changes
- Manual parsing required
- Not visible in Issue list
- Editing requires updating entire body

**Why rejected**: Not queryable, no triggers, hidden

### Option 3: External Database (PostgreSQL)

**Description**: Store state in PostgreSQL, sync with GitHub

**Pros**:
- Powerful SQL queries
- Complex data structures
- Full control

**Cons**:
- Infrastructure cost ($50-200/month)
- State synchronization complexity (GitHub ↔ DB)
- Two sources of truth
- Not GitHub-native
- Requires authentication

**Why rejected**: Cost, complexity, not GitHub-native (violates ADR-002)

### Option 4: GitHub Status API

**Description**: Use GitHub commit/PR status checks

**Pros**:
- Native status mechanism
- Visual indicators (✅ ❌)
- API support

**Cons**:
- Only for commits/PRs (not Issues)
- Limited to success/failure/pending
- Not queryable by status
- No custom metadata

**Why rejected**: Limited to PRs, not flexible enough

---

## References

- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md`
- **Label Configuration**: `.github/labels.yml`
- **Agent SDK Integration**: `docs/AGENT_SDK_LABEL_INTEGRATION.md`
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md`
- **GitHub Labels API**: https://docs.github.com/en/rest/issues/labels

---

## Notes

### Label Sync Automation

**Label Configuration** (`.github/labels.yml`):
```yaml
# STATE category (8 labels)
- name: "📥 state:pending"
  color: "d4c5f9"
  description: "New Issue, not yet processed"

- name: "🔍 state:analyzing"
  color: "c5def5"
  description: "CoordinatorAgent analyzing"

# ... (50 more labels)
```

**GitHub Actions Sync** (`.github/workflows/sync-labels.yml`):
```yaml
name: Sync Labels
on:
  push:
    paths:
      - '.github/labels.yml'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: micnncim/action-label-syncer@v1
        with:
          manifest: .github/labels.yml
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Label Usage Statistics

**Most Common Labels** (Issue #1-500 analysis):
1. `state:implementing` - 142 Issues (28%)
2. `agent:codegen` - 128 Issues (26%)
3. `type:feature` - 215 Issues (43%)
4. `priority:P2-Medium` - 178 Issues (36%)
5. `quality:good` - 89 PRs (18%)

**Average Labels per Issue**: 4.2 labels
**Most Labels on Single Issue**: 9 labels (Issue #347 - complex security feature)

### Label Color Scheme

**Color Coding**:
- **Purple** (#d4c5f9): STATE labels (lifecycle)
- **Blue** (#c5def5): AGENT labels (assignment)
- **Orange** (#ff9800): PRIORITY labels (urgency)
- **Green** (#00ff00): TYPE:feature
- **Red** (#ff0000): TYPE:bug, PRIORITY:P0-Critical, SEVERITY:Sev.1
- **Yellow** (#ffeb3b): SPECIAL flags (security, cost-watch)
- **Cyan** (#00bcd4): QUALITY labels (post-review)

### Label-Based Agent Logic

**Agent Decision Tree** (CoordinatorAgent):
```rust
use miyabi_types::Label;

async fn select_agent(&self, issue: &Issue) -> Result<AgentType> {
    let labels = &issue.labels;

    // Explicit agent assignment
    if labels.contains("agent:codegen") {
        return Ok(AgentType::CodeGen);
    }

    // Infer from type and priority
    match (get_type(labels), get_priority(labels)) {
        (Some("feature"), Some("P0-Critical")) => Ok(AgentType::CodeGen),
        (Some("bug"), _) => Ok(AgentType::CodeGen),
        (Some("docs"), _) => Ok(AgentType::Documentation),
        (Some("security"), _) => Ok(AgentType::Security),
        _ => Ok(AgentType::Coordinator), // Default
    }
}
```

### State Machine Validation

**Valid State Transitions**:
```
pending → analyzing → planned → implementing → reviewing → deploying → done
                                    ↓               ↓
                                 blocked         blocked
```

**Invalid Transitions** (prevented by validation webhook):
```
implementing → done  (❌ must go through reviewing)
pending → deploying  (❌ must go through implementation)
done → implementing  (❌ cannot reopen completed Issue without manual approval)
```

### Lessons Learned

1. **Emoji Prefixes**: Improve scannability by 40% (user testing)
2. **Category:Value Format**: Logical grouping, easy to filter
3. **53 Labels**: Sweet spot (enough coverage, not overwhelming)
4. **Label Sync**: Automated sync prevents drift across repositories
5. **Validation Webhooks**: Catch invalid state transitions early

### Future Considerations

- ✅ **Label Presets**: Quick-add label combinations (e.g., "New Feature" adds type:feature + priority:P2-Medium + state:pending)
- ✅ **Label Templates**: Issue templates auto-add relevant labels
- ⏳ **Label Analytics**: Dashboard showing label distribution, trends
- ⏳ **AI-Assisted Labeling**: IssueAgent suggests labels based on content
- ⏳ **Label Hierarchy**: Explore GitHub Projects for hierarchical views

---

**Last Updated**: 2025-10-24
**Reviewers**: Lead Architect, DevOps Lead, Product Manager, UX Designer
**Actual Outcome**: ✅ All success criteria met, 53 labels deployed, 100% state coverage, <500ms queries
