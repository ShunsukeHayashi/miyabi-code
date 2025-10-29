---
name: Issue Analysis with Label Inference
description: Analyze GitHub Issues and automatically infer appropriate labels from Miyabi's 57-label system across 11 categories. Use when creating or triaging Issues, or when label inference is needed.
allowed-tools: Read, Grep, Glob, WebFetch
---

# Issue Analysis with Label Inference

AI-powered Issue analysis and automatic label inference based on Miyabi's 57-label system across 11 categories.

## When to Use

- User creates a new Issue and asks "what labels should I use?"
- User requests "analyze this Issue" or "triage issue #270"
- User asks to "infer labels for this Issue"
- After Issue creation, to automatically determine appropriate labels
- When managing Issue backlog and prioritization

## Miyabi's 57-Label System

### 11 Categories Overview

| # | Category | Count | Purpose | Examples |
|---|----------|-------|---------|----------|
| 1 | **STATE** | 8 | Lifecycle management | `📥 state:pending`, `✅ state:done` |
| 2 | **AGENT** | 6 | Agent assignment | `🤖 agent:coordinator`, `🤖 agent:codegen` |
| 3 | **PRIORITY** | 4 | Priority management | `🔥 priority:P0-Critical`, `📝 priority:P3-Low` |
| 4 | **TYPE** | 7 | Issue classification | `✨ type:feature`, `🐛 type:bug` |
| 5 | **SEVERITY** | 4 | Severity/Escalation | `🚨 severity:Sev.1-Critical` |
| 6 | **PHASE** | 5 | Project phase | `🎯 phase:planning`, `🚀 phase:deployment` |
| 7 | **SPECIAL** | 7 | Special operations | `🔐 security`, `💰 cost-watch` |
| 8 | **TRIGGER** | 4 | Automation triggers | `🤖 trigger:agent-execute` |
| 9 | **QUALITY** | 4 | Quality score | `⭐ quality:excellent`, `🔴 quality:poor` |
| 10 | **COMMUNITY** | 4 | Community | `👋 good-first-issue`, `🙏 help-wanted` |
| 11 | **HIERARCHY** | 4 | Issue hierarchy | `🌳 hierarchy:root`, `📄 hierarchy:child` |

## Label Inference Rules

### 1. TYPE Inference (Required - Always 1)

**Keywords → Label Mapping**:
- **feature**: "add", "implement", "create", "new", "enhance"
  → `✨ type:feature`

- **bug**: "fix", "crash", "error", "broken", "not working"
  → `🐛 type:bug`

- **docs**: "documentation", "README", "guide", "tutorial"
  → `📚 type:docs`

- **refactor**: "refactor", "cleanup", "reorganize", "improve structure"
  → `🔧 type:refactor`

- **test**: "test", "coverage", "unit test", "e2e", "integration test"
  → `🧪 type:test`

- **architecture**: "architecture", "system design", "microservices", "migration"
  → `🏗️ type:architecture`

- **deployment**: "deploy", "CI/CD", "docker", "kubernetes", "infrastructure"
  → `🚀 type:deployment`

### 2. PRIORITY Inference (Required - Always 1)

**Urgency & Impact Assessment**:

- **P0-Critical**:
  - Keywords: "security", "data loss", "production down", "urgent", "critical"
  - Impact: Affects all users, revenue loss, security breach
  - SLA: 24 hours
  → `🔥 priority:P0-Critical`

- **P1-High**:
  - Keywords: "major feature", "important bug", "performance degradation"
  - Impact: Affects many users, significant business impact
  - SLA: 3 days
  → `⚠️ priority:P1-High`

- **P2-Medium**:
  - Keywords: "normal feature", "standard bug", "improvement"
  - Impact: Affects some users, moderate business impact
  - SLA: 1 week
  → `📊 priority:P2-Medium`

- **P3-Low**:
  - Keywords: "nice-to-have", "typo", "minor improvement", "comment"
  - Impact: Low business impact
  - SLA: None (when available)
  → `📝 priority:P3-Low`

### 3. SEVERITY Inference (Optional - If applicable)

**Technical Severity Assessment**:

- **Sev.1-Critical**: Production outage, security breach, data corruption
  → `🚨 severity:Sev.1-Critical`
  → Escalate to: Guardian + CISO + TechLead

- **Sev.2-High**: Major feature broken, significant performance degradation
  → `⚠️ severity:Sev.2-High`
  → Escalate to: TechLead or CISO

- **Sev.3-Medium**: Partial functionality issue
  → `📊 severity:Sev.3-Medium`
  → Auto-handled by Agents

- **Sev.4-Low**: Minor UI glitch, cosmetic issue
  → `📝 severity:Sev.4-Low`
  → Auto-handled by Agents

### 4. SPECIAL Labels Inference (Optional)

- **security**: Contains "XSS", "SQL injection", "vulnerability", "CVE"
  → `🔐 security`
  → Action: Notify CISO, make Issue private

- **cost-watch**: Contains "large dataset", "expensive API", "Claude API", "high cost"
  → `💰 cost-watch`
  → Action: Monitor API usage, check budget

- **dependencies**: Contains "depends on #", "blocked by", "waiting for"
  → `🔄 dependencies`
  → Action: Pause until dependencies resolved

- **learning**: Contains "research", "learn", "investigate", "explore"
  → `🎓 learning`
  → Action: Extended SLA, lower progress report frequency

- **experiment**: Contains "experiment", "POC", "proof of concept", "trial"
  → `🔬 experiment`
  → Action: Allow failure, require Guardian pre-approval

### 5. COMMUNITY Labels Inference (Optional)

- **good-first-issue**: Criteria:
  - Estimated time < 2 hours
  - No dependencies
  - Clear requirements
  - Simple implementation
  → `👋 good-first-issue`

- **help-wanted**: Needs external expertise or community review
  → `🙏 help-wanted`

### 6. HIERARCHY Labels Inference (Automatic)

- **hierarchy:root**: No parent Issue specified
  → `🌳 hierarchy:root`

- **hierarchy:parent**: Has 1+ child Issues
  → `📂 hierarchy:parent`

- **hierarchy:child**: Has parent Issue specified
  → `📄 hierarchy:child`

- **hierarchy:leaf**: No child Issues (terminal node)
  → `🍃 hierarchy:leaf`

## Analysis Workflow

### Step 1: Read Issue Content
```
- Issue title
- Issue body (description)
- Comments (if any)
- Related Issues (linked Issues)
```

### Step 2: Extract Keywords
```
- Technical keywords: "security", "performance", "API"
- Action keywords: "add", "fix", "refactor"
- Urgency keywords: "urgent", "critical", "nice-to-have"
```

### Step 3: Apply Inference Rules
```
1. Determine TYPE (required, 1 label)
2. Determine PRIORITY (required, 1 label)
3. Determine SEVERITY (if bug/incident)
4. Check for SPECIAL conditions
5. Assess COMMUNITY suitability
6. Determine HIERARCHY position
```

### Step 4: Generate Label Set
```json
{
  "required": [
    "type:feature",
    "priority:P1-High"
  ],
  "recommended": [
    "agent:codegen",
    "phase:planning"
  ],
  "optional": [
    "security",
    "cost-watch"
  ],
  "automatic": [
    "state:pending",
    "hierarchy:leaf"
  ]
}
```

### Step 5: Provide Rationale
```
Explain why each label was selected based on:
- Issue content analysis
- Keyword matching
- Business/technical impact assessment
- Historical Issue patterns
```

## Example Analysis

### Example 1: Security Bug

**Issue Title**: "XSS vulnerability in comment form"

**Issue Body**:
```
Found XSS vulnerability in `/comments/new` form.
User input is not sanitized before rendering.
Affects all users.
```

**Inferred Labels**:
```yaml
Required:
  - 🐛 type:bug
  - 🔥 priority:P0-Critical

Recommended:
  - 🚨 severity:Sev.1-Critical
  - 🔐 security
  - 🤖 agent:codegen
  - 🤖 trigger:agent-execute

Automatic:
  - 📥 state:pending
  - 🍃 hierarchy:leaf
```

**Rationale**:
- TYPE: `bug` (keyword "vulnerability", "not sanitized")
- PRIORITY: `P0-Critical` (affects all users, security issue)
- SEVERITY: `Sev.1-Critical` (security vulnerability)
- SPECIAL: `security` (keyword "XSS", "vulnerability")
- TRIGGER: `agent-execute` (urgent, auto-fix recommended)

**Escalation**: Guardian + CISO + TechLead (immediately)

---

### Example 2: New Feature

**Issue Title**: "Add dark mode toggle to settings"

**Issue Body**:
```
Add dark mode toggle to user settings page.
Should persist user preference in localStorage.
```

**Inferred Labels**:
```yaml
Required:
  - ✨ type:feature
  - ⚠️ priority:P1-High

Recommended:
  - 🤖 agent:codegen
  - 🎯 phase:planning

Automatic:
  - 📥 state:pending
  - 🍃 hierarchy:leaf
```

**Rationale**:
- TYPE: `feature` (keyword "Add")
- PRIORITY: `P1-High` (user-facing feature, moderate impact)
- AGENT: `codegen` (requires UI + logic implementation)
- PHASE: `planning` (design + implementation needed)

**No Escalation Needed**: Standard Agent workflow

---

### Example 3: Documentation Typo

**Issue Title**: "Fix typo in README.md"

**Issue Body**:
```
"teh" should be "the" in line 42.
```

**Inferred Labels**:
```yaml
Required:
  - 📚 type:docs
  - 📝 priority:P3-Low

Recommended:
  - 👋 good-first-issue

Automatic:
  - 📥 state:pending
  - 🍃 hierarchy:leaf
```

**Rationale**:
- TYPE: `docs` (keyword "README", "typo")
- PRIORITY: `P3-Low` (low impact)
- COMMUNITY: `good-first-issue` (simple, < 2 hours)

**No Escalation Needed**: Community contribution welcome

## Output Format

```json
{
  "issue_number": 270,
  "title": "XSS vulnerability in comment form",
  "analysis": {
    "type": "bug",
    "priority": "P0-Critical",
    "severity": "Sev.1-Critical",
    "estimated_time": "4-6 hours",
    "complexity": "medium",
    "agent_recommendation": "codegen + review",
    "escalation": "Guardian + CISO + TechLead"
  },
  "labels": {
    "required": ["type:bug", "priority:P0-Critical"],
    "recommended": ["severity:Sev.1-Critical", "security", "agent:codegen", "trigger:agent-execute"],
    "automatic": ["state:pending", "hierarchy:leaf"]
  },
  "rationale": {
    "type": "Contains keywords: 'vulnerability', 'XSS', 'affects all users'",
    "priority": "Security issue with global impact, requires immediate attention",
    "severity": "Security vulnerability with potential data exposure",
    "special": "Security-related issue, requires CISO notification"
  }
}
```

## Related Files

- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md`
- **Label Definitions**: `.github/labels.yml`
- **IssueAgent Spec**: `.codex/agents/specs/coding/issue-agent.md`
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md`

## Related Skills

- **Agent Execution**: For executing Agents after label assignment
- **Rust Development**: For implementing label inference logic
