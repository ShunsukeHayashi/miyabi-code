# Tutorial Plan - Issue #472: Create 10 Tutorials

**Issue**: #472
**Title**: [P4-003] チュートリアル10個作成
**Priority**: P1-High
**Type**: docs
**Created**: 2025-10-24
**Created by**: CoordinatorAgent (しきるん)

---

## Executive Summary

This plan outlines the creation of **10 comprehensive tutorials** for the Miyabi autonomous development framework. The tutorials will be structured across three difficulty levels (Beginner, Intermediate, Advanced) and cover the full spectrum of Miyabi's capabilities - from basic setup to advanced Agent customization and production deployment.

**Target Audience**: Developers, DevOps engineers, and technical managers interested in autonomous AI-powered development workflows.

**Total Estimated Time**: 40-50 hours of content creation
**Target Word Count per Tutorial**: 1,000-2,000 words
**Format**: Markdown with code examples, diagrams (Mermaid), and hands-on exercises

---

## Tutorial Structure Overview

### Level Distribution
- **Beginner (3 tutorials)**: Foundation concepts, basic usage
- **Intermediate (4 tutorials)**: Advanced features, customization
- **Advanced (3 tutorials)**: Architecture deep dives, production deployment

### Common Elements (All Tutorials)
1. **Learning Objectives** - Clear goals at the start
2. **Prerequisites** - Required knowledge and setup
3. **Step-by-Step Instructions** - Hands-on walkthroughs
4. **Code Examples** - Real, runnable code snippets
5. **Troubleshooting** - Common issues and solutions
6. **Success Metrics** - How to verify completion
7. **Next Steps** - Recommended follow-up tutorials

---

## 📚 Tutorial Catalog

### Beginner Level (3 Tutorials)

#### Tutorial 1: Getting Started with Miyabi
**Filename**: `tutorials/01-getting-started.md`
**Estimated Length**: 1,500 words
**Duration**: 30 minutes
**Difficulty**: ⭐ Beginner

**Learning Objectives**:
- Install Miyabi CLI and dependencies
- Configure GitHub integration
- Execute your first autonomous Agent
- Understand the Issue-to-PR workflow

**Prerequisites**:
- Basic Git knowledge
- GitHub account with API token
- Rust 1.70+ installed
- Basic command line proficiency

**Content Outline**:
1. **Introduction** (200 words)
   - What is Miyabi?
   - Why autonomous development?
   - Architecture overview diagram

2. **Installation** (400 words)
   - System requirements (macOS/Linux/Windows)
   - Install Rust toolchain
   - Clone repository
   - Build from source: `cargo build --release`
   - Verify installation: `miyabi --version`

3. **Configuration** (300 words)
   - Set environment variables
     ```bash
     export GITHUB_TOKEN=ghp_xxx
     export ANTHROPIC_API_KEY=sk-xxx
     export DEVICE_IDENTIFIER=MacBook
     ```
   - Configure `miyabi.toml`
   - Test GitHub connection: `miyabi github status`

4. **First Agent Execution** (400 words)
   - Create a simple Issue on GitHub
   - Run CoordinatorAgent: `miyabi agent run coordinator --issue 270`
   - Observe autonomous task decomposition
   - Review generated PR

5. **Understanding the Output** (200 words)
   - Read execution logs in `.ai/logs/`
   - Inspect generated files
   - Review Agent decisions

**Success Metrics**:
- ✅ Miyabi CLI successfully installed
- ✅ GitHub integration verified
- ✅ First Agent execution completed
- ✅ Generated PR visible on GitHub

**Next Steps**: Tutorial 2 (Understanding Agents)

---

#### Tutorial 2: Understanding Agents - The 21 Characters
**Filename**: `tutorials/02-understanding-agents.md`
**Estimated Length**: 1,800 words
**Duration**: 45 minutes
**Difficulty**: ⭐ Beginner

**Learning Objectives**:
- Understand the 7 Coding Agents and their roles
- Learn about the 14 Business Agents
- Grasp Agent character names (e.g., しきるん, つくるん)
- Know when to use which Agent

**Prerequisites**:
- Completed Tutorial 1
- Familiarity with software development lifecycle

**Content Outline**:
1. **Agent Architecture** (300 words)
   - BaseAgent trait pattern
   - Task-based execution model
   - Autonomous decision-making

2. **Coding Agents Deep Dive** (600 words)
   - **CoordinatorAgent (しきるん)**: Task orchestration, DAG construction
   - **CodeGenAgent (つくるん)**: AI-driven code generation
   - **ReviewAgent (めだまん)**: Quality scoring (100-point scale)
   - **IssueAgent (みつけるん)**: Issue analysis and labeling
   - **PRAgent (まとめるん)**: Pull Request automation
   - **DeploymentAgent (はこぶん)**: CI/CD deployment
   - **RefresherAgent (つなぐん)**: Issue state monitoring

3. **Business Agents Overview** (500 words)
   - **Strategy & Planning** (6 Agents): AIEntrepreneur, ProductConcept, etc.
   - **Marketing** (5 Agents): MarketResearch, ContentCreation, SNS, YouTube
   - **Sales & CRM** (3 Agents): Sales, CRM, Analytics

4. **Character Name System** (200 words)
   - Color-coded roles: 🔴 Leaders, 🟢 Executors, 🔵 Analyzers, 🟡 Supporters
   - Parallel execution rules
   - Friendly Japanese names

5. **Hands-On Exercise** (200 words)
   - Run different Agents on sample Issues
   - Compare outputs
   - Observe parallel execution

**Success Metrics**:
- ✅ Can identify appropriate Agent for a given task
- ✅ Understand parallel vs. sequential execution rules
- ✅ Successfully executed at least 3 different Agents

**Next Steps**: Tutorial 3 (Issue-to-PR Workflow)

---

#### Tutorial 3: Issue-to-PR Workflow - Autonomous Development Cycle
**Filename**: `tutorials/03-issue-to-pr-workflow.md`
**Estimated Length**: 1,600 words
**Duration**: 40 minutes
**Difficulty**: ⭐ Beginner

**Learning Objectives**:
- Master the complete autonomous development cycle
- Understand Label-driven state transitions
- Learn Conventional Commits integration
- Practice end-to-end workflow

**Prerequisites**:
- Completed Tutorial 1 & 2
- Basic understanding of Git workflows

**Content Outline**:
1. **Workflow Overview** (300 words)
   - GitHub as OS architecture
   - State transition diagram: `pending → analyzing → implementing → reviewing → done`
   - Role of Labels in workflow orchestration

2. **Phase 1: Issue Creation** (300 words)
   - Write effective Issue descriptions
   - Specify task dependencies with `(depends: #270)`
   - IssueAgent automatic labeling

3. **Phase 2: Task Decomposition** (400 words)
   - CoordinatorAgent DAG construction
   - Topological sorting for parallel execution
   - Task assignment to appropriate Agents

4. **Phase 3: Code Generation** (300 words)
   - CodeGenAgent execution in Worktree
   - Git Worktree isolation benefits
   - Conventional Commits format

5. **Phase 4: Quality Review** (200 words)
   - ReviewAgent scoring (100-point scale)
   - Quality gates (80+ for auto-merge)
   - Feedback loops

6. **Phase 5: PR Creation** (100 words)
   - PRAgent automation
   - PR template usage
   - Merge strategy

**Success Metrics**:
- ✅ Created Issue → Generated PR end-to-end
- ✅ Understand each phase of the workflow
- ✅ Can interpret Label state transitions

**Next Steps**: Tutorial 4 (Agent Customization)

---

### Intermediate Level (4 Tutorials)

#### Tutorial 4: Agent Customization - Building Your Own Prompts
**Filename**: `tutorials/04-agent-customization.md`
**Estimated Length**: 2,000 words
**Duration**: 60 minutes
**Difficulty**: ⭐⭐ Intermediate

**Learning Objectives**:
- Understand Agent spec files (`.claude/agents/specs/`)
- Customize Agent prompts (`.claude/agents/prompts/`)
- Configure Agent behavior via `miyabi.toml`
- Create custom Agent execution contexts

**Prerequisites**:
- Completed Beginner tutorials (1-3)
- Familiarity with YAML/Markdown
- Understanding of LLM prompting

**Content Outline**:
1. **Agent Spec Anatomy** (400 words)
   - Structure of spec files
   - Key sections: Role, Responsibilities, Execution Authority
   - Severity levels and escalation rules
   - Success criteria definition

2. **Customizing Prompts** (500 words)
   - Prompt template system
   - Context injection: Issue info, Task details, Worktree path
   - Step-by-step instruction customization
   - Example: Customize CodeGenAgent to follow specific coding style

3. **Configuration Options** (400 words)
   - `miyabi.toml` structure
   - Agent-specific settings
   - LLM backend selection (GPT-OSS-20B, Groq, vLLM, Ollama)
   - Reasoning effort levels (Low/Medium/High)

4. **Testing Custom Agents** (400 words)
   - Dry-run mode: `miyabi agent run --dry-run`
   - Log analysis in `.ai/logs/`
   - Iterative refinement process

5. **Best Practices** (300 words)
   - Keep prompts focused and actionable
   - Use clear success criteria
   - Version control your customizations
   - Document custom behaviors

**Success Metrics**:
- ✅ Created custom Agent spec
- ✅ Modified prompt successfully
- ✅ Agent behaves as expected
- ✅ Documented customization rationale

**Next Steps**: Tutorial 5 (Worktree Parallel Execution)

---

#### Tutorial 5: Worktree-Based Parallel Execution
**Filename**: `tutorials/05-worktree-parallel-execution.md`
**Estimated Length**: 1,800 words
**Duration**: 50 minutes
**Difficulty**: ⭐⭐ Intermediate

**Learning Objectives**:
- Master Git Worktree isolation for parallel Agent execution
- Understand DAG-based task scheduling
- Configure concurrency levels
- Troubleshoot Worktree conflicts

**Prerequisites**:
- Completed Tutorial 1-4
- Intermediate Git knowledge
- Understanding of concurrent programming concepts

**Content Outline**:
1. **Why Worktrees?** (300 words)
   - Problem: File-level conflicts in parallel execution
   - Solution: Directory-level isolation with Worktrees
   - Benefits: True parallelism, easy rollback, independent debugging

2. **Worktree Architecture** (400 words)
   - Directory structure: `.worktrees/issue-270/`
   - Context files: `.agent-context.json`, `EXECUTION_CONTEXT.md`
   - Lifecycle: Create → Execute → Merge → Cleanup

3. **Parallel Execution Demo** (500 words)
   - Example: 3 Issues processed concurrently
     ```bash
     miyabi agent run coordinator --issues 270,271,272 --concurrency 3
     ```
   - Real-time progress monitoring
   - Understanding DAG levels (topological sorting)

4. **Concurrency Tuning** (300 words)
   - CPU core detection with `num_cpus`
   - Maximum concurrency (5 parallel tasks)
   - Low-spec vs. high-spec machine strategies

5. **Troubleshooting** (300 words)
   - Stuck Worktrees: `git worktree list`, `git worktree remove`
   - Merge conflicts: Resolution strategies
   - Cleanup stale Worktrees: `git worktree prune`

**Success Metrics**:
- ✅ Successfully executed 3+ Issues in parallel
- ✅ Understood Worktree lifecycle
- ✅ Resolved at least one Worktree conflict
- ✅ Optimized concurrency for your machine

**Next Steps**: Tutorial 6 (Label System Mastery)

---

#### Tutorial 6: Label System Mastery - 53 Labels Explained
**Filename**: `tutorials/06-label-system-mastery.md`
**Estimated Length**: 1,700 words
**Duration**: 45 minutes
**Difficulty**: ⭐⭐ Intermediate

**Learning Objectives**:
- Master the 53-label system across 10 categories
- Understand Label-driven state machines
- Use Labels for Agent routing and prioritization
- Implement custom Label workflows

**Prerequisites**:
- Completed Tutorial 1-3
- Familiarity with GitHub Labels
- Understanding of state machines

**Content Outline**:
1. **Label System Philosophy** (200 words)
   - "Everything starts with an Issue. Labels define the state."
   - Operating system metaphor for Labels
   - Label as workflow driver

2. **10 Label Categories** (800 words)
   - **STATE** (8 labels): Lifecycle management
   - **AGENT** (6 labels): Agent assignment
   - **PRIORITY** (4 labels): P0-Critical to P3-Low
   - **TYPE** (7 labels): feature, bug, docs, refactor, test, style, performance
   - **SEVERITY** (4 labels): Escalation levels
   - **PHASE** (5 labels): Project phases
   - **SPECIAL** (7 labels): security, cost-watch, epic, etc.
   - **TRIGGER** (4 labels): Automation triggers
   - **QUALITY** (4 labels): Score-based quality gates
   - **COMMUNITY** (4 labels): good-first-issue, help-wanted

3. **Label-Driven Automation** (300 words)
   - State transition triggers: `pending → analyzing`
   - Agent routing: `agent:codegen` → CodeGenAgent
   - Deployment triggers: `trigger:deploy-staging`

4. **Custom Label Workflows** (300 words)
   - Creating organization-specific Labels
   - Integrating with GitHub Actions
   - Label-based access control

5. **Best Practices** (100 words)
   - Keep Label taxonomy consistent
   - Document custom Labels
   - Use automation for Label management

**Success Metrics**:
- ✅ Can identify correct Labels for any Issue
- ✅ Understand state transition rules
- ✅ Created custom Label workflow
- ✅ Automated Label management with IssueAgent

**Next Steps**: Tutorial 7 (MCP Integration)

---

#### Tutorial 7: MCP Integration - Connecting External Tools
**Filename**: `tutorials/07-mcp-integration.md`
**Estimated Length**: 1,900 words
**Duration**: 55 minutes
**Difficulty**: ⭐⭐ Intermediate

**Learning Objectives**:
- Understand Model Context Protocol (MCP)
- Integrate Miyabi with MCP servers
- Use Context7 for external documentation
- Build custom MCP tools for Miyabi

**Prerequisites**:
- Completed Tutorial 1-4
- Basic understanding of JSON-RPC
- Familiarity with API integration

**Content Outline**:
1. **MCP Fundamentals** (300 words)
   - What is MCP? (Model Context Protocol)
   - JSON-RPC 2.0 transport
   - MCP Server ecosystem
   - Miyabi's MCP Server: `miyabi-mcp-server`

2. **Installing MCP Servers** (400 words)
   - List available MCPs: `claude mcp list`
   - Install GitHub MCP: `@modelcontextprotocol/server-github`
   - Install Context7: `@upstash/context7-mcp`
   - Configure in `claude_desktop_config.json`

3. **Using Context7 for Documentation** (400 words)
   - Context7 API key setup (context7.com)
   - Fetch external library docs:
     ```
     "Use context7 to get the latest Tokio async runtime documentation"
     ```
   - Use cases: Benchmark harnesses, framework APIs, Docker configs

4. **Miyabi MCP Server** (500 words)
   - Starting the server: `miyabi mcp start --transport stdio`
   - Available methods: `agents/{agent_type}/execute`
   - Calling Agents via MCP:
     ```json
     {
       "method": "agents/coordinator/execute",
       "params": { "issue_number": 270 }
     }
     ```
   - Remote access with HTTP transport

5. **Building Custom MCP Tools** (300 words)
   - Extend `miyabi-mcp-server`
   - Add custom methods
   - Example: Knowledge base search integration

**Success Metrics**:
- ✅ Installed and configured MCP servers
- ✅ Successfully used Context7 for documentation
- ✅ Executed Agents via MCP
- ✅ Built a simple custom MCP method

**Next Steps**: Tutorial 8 (Entity-Relation Model)

---

### Advanced Level (3 Tutorials)

#### Tutorial 8: Entity-Relation Model Deep Dive
**Filename**: `tutorials/08-entity-relation-model.md`
**Estimated Length**: 2,000 words
**Duration**: 60 minutes
**Difficulty**: ⭐⭐⭐ Advanced

**Learning Objectives**:
- Master the 12 core Entities (Issue, Task, Agent, PR, etc.)
- Understand 27 relationships between Entities
- Apply N1/N2/N3 notation for workflows
- Use Rust Entity APIs

**Prerequisites**:
- Completed Intermediate tutorials (4-7)
- Rust programming knowledge
- Understanding of graph theory (DAGs)

**Content Outline**:
1. **Entity System Overview** (300 words)
   - 12 core Entities and their roles
   - Rust type definitions in `miyabi-types`
   - Entity lifecycle management

2. **Core Entities Detailed** (600 words)
   - **E1: Issue** - GitHub Issue wrapper
   - **E2: Task** - Decomposed work units
   - **E3: Agent** - Autonomous executors
   - **E4: PR** - Pull Request automation
   - **E5: Label** - State management
   - **E6: QualityReport** - Review scores
   - **E7: Command** - Claude Code commands
   - **E8: Escalation** - Error handling
   - **E9: Deployment** - CI/CD tracking
   - **E10: LDDLog** - Execution logs
   - **E11: DAG** - Task dependency graph
   - **E12: Worktree** - Isolation context

3. **27 Relationships Explained** (500 words)
   - Issue processing flow: R1-R4
   - Agent execution: R9-R13
   - Task management: R5-R7
   - Full relationship table

4. **N1/N2/N3 Notation** (400 words)
   - Hierarchical workflow notation
   - Dependency markers: $H (High), $L (Low)
   - Example workflows:
     ```
     N1:Issue $H→ N2:CoordinatorAgent $H→ N3:TaskDecomposition
     N1:Task $H→ N2:CodeGenAgent $H→ N3:GeneratedCode
     ```
   - Rust API: `EntityRelationMap`

5. **Practical Application** (200 words)
   - Building custom workflow graphs
   - Querying Entity relationships
   - Debugging workflow issues

**Success Metrics**:
- ✅ Can diagram Entity relationships for any workflow
- ✅ Understand N1/N2/N3 notation
- ✅ Used Rust Entity APIs
- ✅ Created custom Entity relationship

**Next Steps**: Tutorial 9 (Custom Agent Development)

---

#### Tutorial 9: Custom Agent Development - From Scratch
**Filename**: `tutorials/09-custom-agent-development.md`
**Estimated Length**: 2,000 words
**Duration**: 90 minutes
**Difficulty**: ⭐⭐⭐ Advanced

**Learning Objectives**:
- Implement BaseAgent trait in Rust
- Create custom Agent spec and prompt
- Integrate with CoordinatorAgent orchestration
- Add custom Agent to Miyabi CLI

**Prerequisites**:
- Completed all previous tutorials
- Strong Rust programming skills
- Understanding of async/await
- Familiarity with Tokio runtime

**Content Outline**:
1. **BaseAgent Architecture** (300 words)
   - Trait definition in `miyabi-agents`
   - `execute()` method signature
   - `AgentResult` return type
   - Error handling with `MiyabiError`

2. **Implementing a Custom Agent** (700 words)
   - Example: `SecurityScanAgent`
   - Step-by-step implementation:
     ```rust
     use miyabi_agents::BaseAgent;
     use miyabi_types::{Task, AgentResult, MiyabiError};
     use async_trait::async_trait;

     pub struct SecurityScanAgent {
         config: SecurityConfig,
     }

     #[async_trait]
     impl BaseAgent for SecurityScanAgent {
         async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError> {
             // Implementation
             Ok(AgentResult::success(data))
         }
     }
     ```
   - Testing with `cargo test`

3. **Creating Agent Spec** (300 words)
   - Write `.claude/agents/specs/coding/security-scan-agent.md`
   - Define role, responsibilities, success criteria
   - Set escalation rules

4. **Creating Agent Prompt** (300 words)
   - Write `.claude/agents/prompts/coding/security-scan-agent-prompt.md`
   - Include step-by-step instructions
   - Add Worktree context

5. **CLI Integration** (300 words)
   - Register Agent in `miyabi-cli/src/main.rs`
   - Add CLI command: `miyabi agent run security-scan`
   - Test end-to-end

6. **Publishing & Sharing** (100 words)
   - Contribution guidelines
   - PR submission
   - Community feedback

**Success Metrics**:
- ✅ Built and tested custom Agent
- ✅ Agent executes successfully
- ✅ Integrated with CoordinatorAgent
- ✅ Submitted PR to Miyabi repository

**Next Steps**: Tutorial 10 (Production Deployment)

---

#### Tutorial 10: Production Deployment - CI/CD with Miyabi
**Filename**: `tutorials/10-production-deployment.md`
**Estimated Length**: 2,000 words
**Duration**: 70 minutes
**Difficulty**: ⭐⭐⭐ Advanced

**Learning Objectives**:
- Set up GitHub Actions for Miyabi automation
- Configure DeploymentAgent for staging/production
- Implement quality gates and rollback strategies
- Monitor Agent execution in production

**Prerequisites**:
- Completed all previous tutorials
- DevOps experience
- Familiarity with GitHub Actions
- Understanding of CI/CD pipelines

**Content Outline**:
1. **Production Architecture** (300 words)
   - GitHub Actions as execution engine
   - Webhook-driven automation
   - Environment separation (dev/staging/prod)
   - Secret management

2. **GitHub Actions Setup** (500 words)
   - Workflow file: `.github/workflows/miyabi-agent.yml`
   - Trigger on Label: `🤖 trigger:agent-execute`
   - Environment variables and secrets
   - Example workflow:
     ```yaml
     name: Miyabi Agent Execution
     on:
       issues:
         types: [labeled]
     jobs:
       execute-agent:
         if: github.event.label.name == '🤖 trigger:agent-execute'
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - name: Run CoordinatorAgent
             run: cargo run --release --bin miyabi-cli -- agent run coordinator --issue ${{ github.event.issue.number }}
     ```

3. **DeploymentAgent Configuration** (400 words)
   - Staging deployment: `trigger:deploy-staging`
   - Production deployment: `trigger:deploy-production`
   - Deployment strategies: Blue-Green, Canary
   - Rollback automation

4. **Quality Gates** (400 words)
   - ReviewAgent score thresholds (80+ required)
   - Test coverage requirements
   - Security scan integration
   - Manual approval for production

5. **Monitoring & Observability** (300 words)
   - Execution logs in GitHub Actions
   - Slack/Discord notifications
   - Metrics: Success rate, execution time, Agent utilization
   - Dashboards: `.ai/parallel-reports/`

6. **Production Best Practices** (100 words)
   - Rate limiting for API calls
   - Cost monitoring with `💰 cost-watch` Label
   - Disaster recovery procedures
   - Post-mortem for failures

**Success Metrics**:
- ✅ GitHub Actions workflow deployed
- ✅ Automated Issue → PR → Deployment pipeline
- ✅ Quality gates enforced
- ✅ Monitoring and alerting functional

**Next Steps**: Contribute to Miyabi, Build custom Agents, Join community

---

## Task Breakdown for ContentCreationAgent

### Task T1: Beginner Tutorials (3 tutorials)
**Assigned to**: ContentCreationAgent (かくちゃん)
**Estimated Time**: 12-15 hours
**Dependencies**: None

**Deliverables**:
- `tutorials/01-getting-started.md`
- `tutorials/02-understanding-agents.md`
- `tutorials/03-issue-to-pr-workflow.md`

**Success Criteria**:
- Each tutorial 1,000-1,500 words
- Runnable code examples
- Screenshots/diagrams included
- Tested by at least 2 beginners

---

### Task T2: Intermediate Tutorials (4 tutorials)
**Assigned to**: ContentCreationAgent (かくちゃん)
**Estimated Time**: 16-20 hours
**Dependencies**: T1 completed

**Deliverables**:
- `tutorials/04-agent-customization.md`
- `tutorials/05-worktree-parallel-execution.md`
- `tutorials/06-label-system-mastery.md`
- `tutorials/07-mcp-integration.md`

**Success Criteria**:
- Each tutorial 1,700-2,000 words
- Hands-on exercises
- Troubleshooting sections
- Intermediate users can complete independently

---

### Task T3: Advanced Tutorials (3 tutorials)
**Assigned to**: ContentCreationAgent (かくちゃん)
**Estimated Time**: 12-15 hours
**Dependencies**: T2 completed

**Deliverables**:
- `tutorials/08-entity-relation-model.md`
- `tutorials/09-custom-agent-development.md`
- `tutorials/10-production-deployment.md`

**Success Criteria**:
- Each tutorial 2,000+ words
- Architectural depth
- Production-ready examples
- Advanced users gain expertise

---

### Task T4: Tutorial Index & Navigation
**Assigned to**: ContentCreationAgent (かくちゃん)
**Estimated Time**: 2-3 hours
**Dependencies**: T1, T2, T3 completed

**Deliverables**:
- `tutorials/README.md` - Master index
- Navigation links in each tutorial
- Difficulty badges
- Learning path diagrams (Mermaid)

**Success Criteria**:
- Clear learning progression
- Easy navigation between tutorials
- Visual learning paths

---

### Task T5: Review & Testing
**Assigned to**: ReviewAgent (めだまん) + Human reviewers
**Estimated Time**: 8-10 hours
**Dependencies**: T1, T2, T3, T4 completed

**Activities**:
- Technical accuracy review
- Code example testing
- Beginner user testing (3+ testers)
- Feedback incorporation

**Success Criteria**:
- All code examples run successfully
- No major technical errors
- Positive feedback from test users
- 90+ quality score from ReviewAgent

---

## Estimated Timeline

| Week | Tasks | Milestones |
|------|-------|------------|
| **Week 1** | T1 (Beginner) | 3 tutorials published |
| **Week 2** | T2.1-T2.2 (Intermediate 1-2) | 2 tutorials published |
| **Week 3** | T2.3-T2.4 (Intermediate 3-4) | 2 tutorials published |
| **Week 4** | T3.1-T3.2 (Advanced 1-2) | 2 tutorials published |
| **Week 5** | T3.3, T4 (Advanced 3, Index) | 1 tutorial + Index published |
| **Week 6** | T5 (Review & Testing) | All tutorials finalized |

**Total Duration**: 6 weeks (part-time) or 3 weeks (full-time)

---

## Success Metrics & KPIs

### Quantitative Metrics
- **Completion Rate**: 80%+ of users complete at least 5 tutorials
- **Time-to-First-PR**: Reduce from 2 hours to 30 minutes (Tutorial 1)
- **Tutorial Engagement**: Average 10+ minutes per tutorial
- **Code Success Rate**: 95%+ of code examples run without modification

### Qualitative Metrics
- **User Satisfaction**: 4.5+ stars (5-star scale)
- **Community Feedback**: Positive sentiment in GitHub Discussions
- **Support Ticket Reduction**: 30% reduction in basic setup questions
- **Contributor Growth**: 10+ new contributors within 3 months

---

## Content Guidelines

### Writing Style
- **Tone**: Professional but approachable
- **Voice**: Second person ("you will", "you can")
- **Technical Depth**: Match difficulty level
- **Examples**: Real-world, not toy problems

### Code Examples
- **Language**: Primarily Rust, some Bash
- **Formatting**: Use fenced code blocks with language identifiers
- **Testing**: All examples must be tested before publication
- **Comments**: Inline explanations for complex logic

### Diagrams
- **Format**: Mermaid (for Markdown rendering)
- **Types**: Flowcharts, sequence diagrams, architecture diagrams
- **Clarity**: Simple, focused on key concepts
- **Example**:
  ```mermaid
  graph LR
      Issue -->|analyzed by| IssueAgent
      IssueAgent -->|creates| Labels
      Labels -->|trigger| CoordinatorAgent
  ```

### Screenshots
- **Tool**: macOS Terminal, GitHub web UI
- **Resolution**: Retina-friendly (2x scale)
- **Annotations**: Highlight key UI elements
- **Privacy**: Redact sensitive tokens/keys

---

## Distribution Channels

### Primary
1. **GitHub Repository**: `tutorials/` directory
2. **Landing Page**: https://shunsukehayashi.github.io/Miyabi/tutorials.html
3. **README.md**: Link from main README

### Secondary
1. **Blog Posts**: note.com (Japanese), Medium (English)
2. **YouTube**: Video walkthroughs for Tutorial 1-3
3. **Twitter/X**: Thread series for each tutorial
4. **Dev.to**: Cross-posting with canonical URLs

---

## Localization Plan

### Phase 1: English (Priority)
- All 10 tutorials in English
- Target: International developer audience

### Phase 2: Japanese (Q1 2026)
- Translate tutorials 1-5 (Beginner + Intermediate 1-2)
- Leverage existing Japanese spec files (`.claude/agents/specs/`)

### Phase 3: Multilingual (Future)
- Chinese (Simplified)
- Korean
- German

---

## Dependencies & Prerequisites

### Technical Dependencies
- Miyabi v2.0.0+ (Rust Edition)
- Rust 1.70+ (for code examples)
- GitHub account with API token
- Claude Code (for MCP tutorial)

### Content Dependencies
- `.claude/context/*.md` - Architecture documentation
- `.claude/agents/specs/**/*.md` - Agent specifications
- `docs/ENTITY_RELATION_MODEL.md` - Entity model
- `docs/LABEL_SYSTEM_GUIDE.md` - Label system

### External Resources
- Context7 API key (Tutorial 7)
- GitHub Actions runner (Tutorial 10)
- Anthropic API key (for Agent execution)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Code examples break** | Medium | High | Automated testing in CI/CD |
| **Miyabi API changes** | High | High | Version pinning, deprecation warnings |
| **User confusion** | Medium | Medium | User testing, feedback loops |
| **Incomplete tutorials** | Low | High | Strict review process, quality gates |
| **Outdated content** | High | Medium | Quarterly review cycle |

---

## Maintenance Plan

### Quarterly Reviews
- Update code examples for API changes
- Verify all links are valid
- Refresh screenshots
- Incorporate user feedback

### Version Compatibility
- Test tutorials against latest Miyabi release
- Maintain compatibility matrix
- Deprecation warnings for old versions

### Community Contributions
- Accept PRs for tutorial improvements
- Translation contributions welcome
- Bug reports for broken examples

---

## Appendix: Example Tutorial Template

```markdown
# Tutorial X: [Title]

**Estimated Time**: XX minutes
**Difficulty**: ⭐/⭐⭐/⭐⭐⭐
**Prerequisites**: [List]

## Learning Objectives
- Objective 1
- Objective 2
- Objective 3

## Prerequisites
- Prerequisite 1
- Prerequisite 2

## Introduction
[Motivation and context]

## Section 1: [Topic]
[Content with code examples]

```rust
// Code example
```

## Section 2: [Topic]
[Content]

## Hands-On Exercise
[Step-by-step instructions]

## Troubleshooting
| Issue | Solution |
|-------|----------|
| Issue 1 | Solution 1 |

## Success Checklist
- [ ] Criterion 1
- [ ] Criterion 2

## Next Steps
- Tutorial Y (related)
- Documentation Z (reference)

## Resources
- [Link 1]
- [Link 2]
```

---

## Conclusion

This plan provides a comprehensive roadmap for creating 10 high-quality tutorials that will enable developers to master Miyabi's autonomous development capabilities. By following this structured approach, we ensure consistency, completeness, and educational value across all tutorials.

**Next Actions**:
1. Review and approve this plan (CoordinatorAgent → ContentCreationAgent)
2. Assign Task T1 to ContentCreationAgent
3. Set up tutorial directory structure: `mkdir tutorials/`
4. Begin Tutorial 1 development

**Questions for Stakeholders**:
- Should we prioritize any specific tutorial?
- Are there additional topics to cover?
- What is the preferred timeline (6 weeks part-time or 3 weeks full-time)?
- Should we create video companions for all tutorials?

---

**Generated by**: CoordinatorAgent (しきるん)
**Date**: 2025-10-24
**Version**: 1.0.0
