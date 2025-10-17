# Miyabi Claude Code Skills

This directory contains **15 specialized Skills** that extend Claude Code's capabilities for the Miyabi project.

## 📚 What are Skills?

Skills are **model-invoked** capabilities that Claude autonomously activates based on your request. Unlike slash commands (which require explicit invocation), Skills are automatically used when Claude detects a relevant task.

## 🎯 Available Skills (15 Total)

### Technical Skills (10) - Development & Operations
**Focus**: Rust development, Git workflows, debugging, performance, security

### Business Skills (5) - Strategy & Growth
**Focus**: Business planning, market research, content marketing, sales, analytics

### 1. Rust Development Workflow

**Location**: `.claude/Skills/rust-development/SKILL.md`

**When Invoked**:
- "Build the project"
- "Run tests"
- "Check code quality"
- Before committing Rust code

**Capabilities**:
- Complete Rust build cycle (clean, build, test, clippy, fmt)
- Workspace-aware execution
- Release builds
- Documentation generation
- Comprehensive error reporting

**Tools**: Bash, Read, Grep, Glob

---

### 2. Agent Execution with Worktree

**Location**: `.claude/Skills/agent-execution/SKILL.md`

**When Invoked**:
- "Run coordinator agent on issue #270"
- "Process multiple issues in parallel"
- "Execute codegen agent"
- Managing concurrent development tasks

**Capabilities**:
- Execute all 7 Coding Agents (Coordinator, CodeGen, Review, Deployment, PR, Issue, Refresher)
- Git Worktree isolation for parallel execution
- Agent assignment based on Task type
- Execution context setup (`.agent-context.json`, `EXECUTION_CONTEXT.md`)
- Merge & cleanup workflows

**Agent Types**:
- 🔴 **Leader**: CoordinatorAgent (sequential only)
- 🟢 **Execution**: CodeGen, Review, Deployment, PR, Issue (parallel OK)
- 🟡 **Support**: Refresher (conditional execution)

**Tools**: Bash, Read, Write, Edit, Grep, Glob

---

### 3. Issue Analysis with Label Inference

**Location**: `.claude/Skills/issue-analysis/SKILL.md`

**When Invoked**:
- "What labels should I use?"
- "Analyze this Issue"
- "Triage issue #270"
- After Issue creation

**Capabilities**:
- AI-powered label inference from Miyabi's 57-label system across 11 categories
- Automatic TYPE, PRIORITY, SEVERITY determination
- SPECIAL label detection (security, cost-watch, dependencies)
- COMMUNITY label assessment (good-first-issue, help-wanted)
- HIERARCHY label assignment (root, parent, child, leaf)
- Escalation recommendations

**Label Categories**:
1. STATE (8) - Lifecycle management
2. AGENT (6) - Agent assignment
3. PRIORITY (4) - Priority management
4. TYPE (7) - Issue classification
5. SEVERITY (4) - Severity/Escalation
6. PHASE (5) - Project phase
7. SPECIAL (7) - Special operations
8. TRIGGER (4) - Automation triggers
9. QUALITY (4) - Quality score
10. COMMUNITY (4) - Community
11. HIERARCHY (4) - Issue hierarchy

**Tools**: Read, Grep, Glob, WebFetch

---

### 4. Entity-Relation Based Documentation

**Location**: `.claude/Skills/documentation-generation/SKILL.md`

**When Invoked**:
- "Document this feature"
- "Update the architecture docs"
- "Explain how X works"
- After implementing new features

**Capabilities**:
- Documentation generation based on Miyabi's Entity-Relation Model (14 entities, 39 relationships)
- Automatic entity identification and relationship mapping
- Rust + TypeScript dual implementation documentation
- Mermaid diagram generation
- File location mapping
- Bidirectional traceability (Entity ↔ Implementation)

**Entity-Relation Model**:
- **14 Entities**: Issue, Task, Agent, PR, Label, QualityReport, Command, Escalation, Deployment, LDDLog, DAG, Worktree, DiscordCommunity, SubIssue
- **39 Relationships**: Issue processing (R1-R4), Agent execution (R9-R15), Label control (R16-R18), Quality management (R19-R23), Parallel execution (R24-R27), Community integration (R28-R35), Hierarchy (R36-R39)

**Tools**: Read, Write, Edit, Grep, Glob

---

### 5. Git Workflow with Conventional Commits

**Location**: `.claude/Skills/git-workflow/SKILL.md`

**When Invoked**:
- "Commit these changes"
- "Create a PR"
- "Merge this branch"
- After completing features

**Capabilities**:
- Automated Git workflow following Conventional Commits specification
- PR creation with proper formatting (Summary, Changes, Test Plan, Quality Report)
- Branch naming conventions (feature/270-description)
- Merge strategies (squash, merge, rebase)
- Worktree-specific workflows
- Pre-commit hook handling

**Commit Types**: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

**Tools**: Bash, Read, Grep, Glob

---

### 6. Project Setup and Miyabi Integration

**Location**: `.claude/Skills/project-setup/SKILL.md`

**When Invoked**:
- "Create a new project"
- "Integrate Miyabi into this project"
- "Set up a new Rust workspace"
- Starting new microservices

**Capabilities**:
- Complete project initialization from scratch
- Cargo workspace setup with proper structure
- GitHub integration (labels, workflows, Issue templates)
- Miyabi framework integration (.miyabi.yml, .claude/ directory)
- Environment variable configuration
- Documentation generation (README, CLAUDE.md)

**Setup Modes**: New project, Add Miyabi to existing, Create microservice

**Tools**: Bash, Read, Write, Edit, Glob, Grep

---

### 7. Debugging and Troubleshooting

**Location**: `.claude/Skills/debugging-troubleshooting/SKILL.md`

**When Invoked**:
- "This code isn't working"
- "Why is this test failing?"
- "Debug this error"
- Compilation/runtime errors

**Capabilities**:
- Systematic error diagnosis (compilation, test, runtime, logic, performance, integration)
- Backtrace analysis (RUST_BACKTRACE)
- Debugger usage (rust-lldb, VS Code)
- Common panic remediation
- Test debugging with pretty_assertions and insta
- Advanced tools (cargo-expand, cargo-asm, valgrind)

**Error Types**: Compilation, test failure, runtime panic, logic error, performance issue, integration error

**Tools**: Bash, Read, Grep, Glob

---

### 8. Performance Analysis and Optimization

**Location**: `.claude/Skills/performance-analysis/SKILL.md`

**When Invoked**:
- "This is slow"
- "Why is memory usage so high?"
- "Optimize this function"
- Profiling performance

**Capabilities**:
- CPU profiling (flamegraph, perf)
- Benchmarking (criterion)
- Memory profiling (valgrind, heaptrack)
- Binary size analysis (cargo-bloat)
- Async runtime profiling (tokio-console)
- Optimization strategies (algorithm, allocation, parallelization)
- Profile-Guided Optimization (PGO)

**Tools**: Bash (flamegraph, criterion, perf, valgrind, cargo-bloat), Read, Grep, Glob

**Tools**: Bash, Read, Grep, Glob

---

### 9. Security Audit and Vulnerability Scanning

**Location**: `.claude/Skills/security-audit/SKILL.md`

**When Invoked**:
- "Scan for security vulnerabilities"
- "Are there any CVEs?"
- "Audit the codebase"
- Before production deployment

**Capabilities**:
- Dependency vulnerability scanning (cargo-audit)
- Policy enforcement (cargo-deny)
- Unsafe code detection (cargo-geiger)
- Secret detection (gitleaks)
- Supply chain analysis (cargo-supply-chain)
- Code security analysis (clippy security lints)
- Cryptography best practices
- Input validation patterns

**Security Tools**: cargo-audit, cargo-deny, cargo-geiger, gitleaks, cargo-supply-chain

**Tools**: Bash, Read, Grep, Glob

---

### 10. Dependency Management for Cargo and npm

**Location**: `.claude/Skills/dependency-management/SKILL.md`

**When Invoked**:
- "Update dependencies"
- "Why is there a version conflict?"
- "Add a new dependency"
- Weekly/monthly dependency updates

**Capabilities**:
- Adding dependencies (cargo add, npm install)
- Updating dependencies (cargo update, npm update)
- Dependency tree analysis (cargo tree)
- Version conflict resolution
- Workspace dependency management
- Feature management
- Security audits (cargo audit, npm audit)
- Dependency hygiene (cargo-udeps)

**Update Strategy**: Patch (weekly), Minor (monthly), Major (quarterly)

**Tools**: Bash, Read, Write, Edit, Grep, Glob

---

### 11. Business Strategy and Planning

**Location**: `.claude/Skills/business-strategy-planning/SKILL.md`

**When Invoked**:
- "Create a business plan"
- "Define our product strategy"
- "Identify target customers"
- Starting new business/product

**Capabilities**:
- Self-analysis and career assessment (SelfAnalysisAgent)
- Product concept design with USP and BMC (ProductConceptAgent)
- Detailed persona development 3-5 personas (PersonaAgent)
- Comprehensive 8-phase business plan (AIEntrepreneurAgent)
- TAM/SAM/SOM market sizing
- Revenue model and funding strategy

**Business Agents**: じぶんるん, つくるそん, ぺるそん, あきんどさん

**Tools**: Read, Write, WebFetch, Bash

---

### 12. Market Research and Competitive Analysis

**Location**: `.claude/Skills/market-research-analysis/SKILL.md`

**When Invoked**:
- "Analyze the market"
- "Who are our competitors?"
- "Validate this business idea"
- Entering new markets

**Capabilities**:
- TAM/SAM/SOM calculation with data sources
- Competitor analysis (20+ companies in 3 tiers)
- 5 major market trends identification
- Customer needs assessment (interviews, surveys)
- Competitive positioning matrix
- SWOT analysis and opportunity mapping

**Business Agent**: しらべるん (MarketResearchAgent)

**Tools**: WebFetch, Read, Write, Bash

---

### 13. Content Marketing and Social Media Strategy

**Location**: `.claude/Skills/content-marketing-strategy/SKILL.md`

**When Invoked**:
- "Create content strategy"
- "How to grow on social media?"
- "Start a YouTube channel"
- Building brand awareness

**Capabilities**:
- 6-month content calendar (90+ pieces)
- Multi-platform SNS strategy (Twitter, LinkedIn, Instagram)
- YouTube channel optimization (13 workflows)
- Blog, video, podcast content creation
- Editorial calendar management
- Content distribution matrix

**Business Agents**: かくちゃん, つぶやくん, どうがるん

**Tools**: WebFetch, Read, Write, Bash

---

### 14. Sales and CRM Management

**Location**: `.claude/Skills/sales-crm-management/SKILL.md`

**When Invoked**:
- "Build our sales process"
- "How to reduce churn?"
- "Increase customer LTV"
- Optimizing sales operations

**Capabilities**:
- Complete sales funnel design (Awareness → Purchase → LTV)
- B2B sales playbook with BANT qualification
- CRM setup with pipeline stages
- Customer health scoring (0-100 points)
- Churn prevention and win-back campaigns
- LTV optimization and NRR tracking

**Business Agents**: うるくん, かんりるん, じょうごるん

**Tools**: Read, Write, WebFetch, Bash

---

### 15. Growth Analytics and Dashboard Management

**Location**: `.claude/Skills/growth-analytics-dashboard/SKILL.md`

**When Invoked**:
- "Analyze our growth metrics"
- "What's our CAC/LTV?"
- "Build a KPI dashboard"
- Making data-driven decisions

**Capabilities**:
- KPI framework setup (20+ metrics across 5 categories)
- Dashboard design (Executive, Product, Marketing, Sales)
- Cohort analysis (retention + revenue)
- A/B testing framework
- PDCA cycle implementation (4-week sprints)
- Predictive analytics (churn prediction, revenue forecasting)
- Automated reporting and alerting

**Business Agent**: すうじるん (AnalyticsAgent)

**Tools**: Read, Write, WebFetch, Bash

---

## 🚀 How to Use Skills

### Automatic Invocation

Skills are automatically invoked by Claude when your request matches the Skill's description:

```
User: "Build the project and run all tests"
→ Claude automatically invokes "Rust Development Workflow" Skill

User: "Process issues #270, #271, #272 in parallel"
→ Claude automatically invokes "Agent Execution with Worktree" Skill

User: "What labels should I use for this bug?"
→ Claude automatically invokes "Issue Analysis with Label Inference" Skill
```

### Manual Testing

To test a Skill, simply describe the task naturally:

```
"Check the code quality and run clippy"
"Run the coordinator agent on issue #270"
"Analyze issue #270 and suggest labels"
"Document the CodeGenAgent architecture"
```

---

## 📖 Related Documentation

- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md` - Complete entity definitions and relationships
- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md` - 57-label system documentation
- **Template Master Index**: `docs/TEMPLATE_MASTER_INDEX.md` - 88-file template inventory
- **Agent Specifications**: `.claude/agents/specs/coding/*.md` - Individual Agent specs
- **Worktree Protocol**: `docs/WORKTREE_PROTOCOL.md` - Parallel execution protocol

---

## 🛠️ Skill Development Guidelines

### When to Create a New Skill

Create a new Skill when:
- The task is **complex** and requires multiple tool invocations
- The task is **frequently performed** by users
- The task requires **domain-specific knowledge** (e.g., Miyabi's label system)
- The task benefits from **structured workflows** (e.g., build → test → lint)

### Skill Structure

```markdown
---
name: Skill Name
description: Clear description of what this Skill does and when to use it
allowed-tools: Tool1, Tool2, Tool3
---

# Skill Name

[Description]

## When to Use

[List of use cases]

## Workflow

[Step-by-step workflow]

## Examples

[Concrete examples]

## Related Files

[Links to related files]
```

### Best Practices

1. **Focused Description**: Include both functionality AND usage triggers
2. **Tool Restrictions**: Use `allowed-tools` for security-sensitive Skills
3. **Clear Examples**: Provide concrete input/output examples
4. **Troubleshooting**: Include common issues and solutions
5. **Related Skills**: Link to complementary Skills

---

## 🎨 Skill Integration with Miyabi

All Skills are designed around Miyabi's core concepts:

- **Agent System**: Skills leverage the 7 Coding Agents (Coordinator, CodeGen, Review, Deployment, PR, Issue, Refresher)
- **Label System**: Skills understand and work with the 57-label taxonomy
- **Entity-Relation Model**: Skills maintain consistency with the 14 entities and 39 relationships
- **Worktree Protocol**: Skills support parallel execution via Git Worktrees
- **Rust-First**: Skills prioritize Rust implementations while maintaining TypeScript references

---

## 📊 Skill Activation Statistics

Track which Skills are most frequently used to identify high-value workflows:

### Technical Skills (1-10)
| Skill | Common Triggers | Frequency | Use Case |
|-------|----------------|-----------|----------|
| 1. Rust Development | "build", "test", "clippy" | Very High | Daily development |
| 2. Agent Execution | "run agent", "process issue" | High | Autonomous development |
| 3. Issue Analysis | "analyze issue", "what labels" | High | Issue triage |
| 4. Documentation | "document", "explain how" | Medium | Knowledge sharing |
| 5. Git Workflow | "commit", "create PR" | Very High | Daily development |
| 6. Project Setup | "new project", "integrate Miyabi" | Low | Initial setup |
| 7. Debugging | "debug", "why is this failing" | High | Problem solving |
| 8. Performance | "optimize", "slow performance" | Medium | Performance tuning |
| 9. Security Audit | "scan for vulnerabilities" | Medium | Security hardening |
| 10. Dependency Mgmt | "update dependencies" | Medium | Maintenance |

### Business Skills (11-15)
| Skill | Common Triggers | Frequency | Use Case |
|-------|----------------|-----------|----------|
| 11. Business Strategy | "business plan", "product strategy" | Medium | Strategic planning |
| 12. Market Research | "analyze market", "competitors" | Medium | Market validation |
| 13. Content Marketing | "content strategy", "grow social" | High | Brand building |
| 14. Sales & CRM | "sales process", "reduce churn" | High | Revenue growth |
| 15. Growth Analytics | "analyze metrics", "KPI dashboard" | Very High | Data-driven decisions |

---

## 🔄 Skill Updates

When updating Skills:

1. Update the `SKILL.md` file
2. Test the Skill with representative examples
3. Update this README if the Skill's purpose changes
4. Notify users of breaking changes

---

**Miyabi Claude Code Skills** - Extending Claude's capabilities for autonomous development 🌸
