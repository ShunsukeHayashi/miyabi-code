# Tutorial 2: Understanding Agents - The 21 Characters

**Estimated Time**: 45 minutes
**Difficulty**: ⭐ Beginner
**Prerequisites**: Tutorial 1 completed, basic understanding of software development lifecycle

## Learning Objectives

By the end of this tutorial, you will:
- Understand Miyabi's Agent architecture and the BaseAgent pattern
- Know all 7 Coding Agents and their specialized roles
- Learn about the 14 Business Agents for strategy and marketing
- Understand the character naming system (しきるん, つくるん, etc.)
- Know when to use which Agent for different tasks
- Grasp parallel vs. sequential execution rules

## Introduction

In Tutorial 1, you met CoordinatorAgent (しきるん) and CodeGenAgent (つくるん). But Miyabi has 21 autonomous Agents, each with a specialized role in the development lifecycle. Think of them as a highly skilled team where each member excels at a specific task.

What makes Miyabi unique is its friendly Japanese character names. Instead of calling them "CoordinatorAgent", you can use "しきるん" (shikirun - "the one who organizes"). This makes interactions more intuitive and human.

Let's meet the entire team.

## Agent Architecture Overview

All Miyabi Agents follow the same architectural pattern: the **BaseAgent trait**.

### BaseAgent Pattern

```rust
use miyabi_agents::BaseAgent;
use miyabi_types::{Task, AgentResult, MiyabiError};
use async_trait::async_trait;

#[async_trait]
impl BaseAgent for MyAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError> {
        // Agent-specific implementation
        Ok(AgentResult::success(data))
    }
}
```

Every Agent implements this trait, providing:
- **Consistent Interface**: All Agents are called the same way
- **Error Handling**: Standardized error types with `MiyabiError`
- **Async Execution**: Built on Tokio for concurrent operations
- **Result Types**: Structured responses with `AgentResult`

This architecture ensures Agents can be composed, coordinated, and executed in parallel without conflicts.

### Task-Based Execution Model

Agents don't work on entire Issues at once. Instead:

1. **CoordinatorAgent** decomposes an Issue into atomic **Tasks**
2. Each Task is assigned to a specialized Agent
3. Tasks are organized into a **DAG** (Directed Acyclic Graph) based on dependencies
4. Agents execute Tasks in parallel when possible

**Example Flow**:
```
Issue #500: "Build user authentication system"
  └─ CoordinatorAgent breaks it down:
      ├─ T1: Design auth schema (assigned: CodeGenAgent)
      ├─ T2: Implement JWT tokens (assigned: CodeGenAgent)
      ├─ T3: Create login endpoint (assigned: CodeGenAgent)
      ├─ T4: Write unit tests (assigned: CodeGenAgent)
      └─ T5: Review code quality (assigned: ReviewAgent)
```

## The 7 Coding Agents

These Agents handle technical development tasks: code generation, testing, review, deployment, and more.

### 1. CoordinatorAgent (しきるん)

**Role**: Task Orchestration, Planning, DAG Construction

**Character Name**: しきるん (shikirun - "the one who organizes")

**Responsibilities**:
- Analyze GitHub Issues and extract requirements
- Decompose Issues into atomic, executable tasks
- Build task dependency graphs (DAGs) using topological sorting
- Assign tasks to appropriate Agents
- Generate execution plans (`plans.md`, `tasks.json`)
- Coordinate multi-Agent workflows

**Parallel Execution**: ❌ No (Leader Agent - only one Coordinator runs at a time)

**When to Use**:
- Every Issue starts with CoordinatorAgent
- You need a high-level plan before implementation
- Complex Issues require task decomposition

**Example Command**:
```bash
miyabi agent run coordinator --issue 500
```

**Output**: `.ai/plans/issue-500-plans.md` with full execution plan

### 2. CodeGenAgent (つくるん)

**Role**: AI-Driven Code Generation

**Character Name**: つくるん (tsukurun - "the one who creates")

**Responsibilities**:
- Generate Rust code following best practices
- Write comprehensive unit tests
- Create integration tests
- Implement features from task descriptions
- Ensure code compiles with `cargo build`
- Follow Conventional Commits for Git messages

**Parallel Execution**: ✅ Yes (Executor Agent - multiple instances can run in parallel Worktrees)

**When to Use**:
- You need new code written from scratch
- Implementing a feature from a specification
- Generating boilerplate code

**Example Command**:
```bash
miyabi agent run codegen --issue 500
```

**Output**: Generated code files, tests, and Git commits

### 3. ReviewAgent (めだまん)

**Role**: Code Quality Review, Scoring, Feedback

**Character Name**: めだまん (medaman - "the eye" or "the one who watches")

**Responsibilities**:
- Analyze code quality on a 100-point scale
- Check for bugs, security issues, performance problems
- Verify test coverage
- Ensure adherence to Rust best practices
- Generate detailed quality reports
- Provide actionable feedback for improvements

**Parallel Execution**: ✅ Yes (Executor Agent)

**When to Use**:
- Before merging a PR
- You want objective quality assessment
- Learning code improvement opportunities

**Example Command**:
```bash
miyabi agent run review --issue 500
```

**Output**: Quality report with score and improvement suggestions

**Quality Thresholds**:
- **90-100**: Excellent, auto-merge approved
- **80-89**: Good, manual review recommended
- **70-79**: Acceptable, improvements required
- **Below 70**: Needs significant work

### 4. IssueAgent (みつけるん)

**Role**: Issue Analysis, Label Inference, Categorization

**Character Name**: みつけるん (mitsukerun - "the one who finds")

**Responsibilities**:
- Analyze Issue descriptions using AI
- Infer appropriate Labels from Miyabi's 53-label system
- Categorize Issues by type (feature, bug, docs, etc.)
- Assign priority levels (P0-Critical to P3-Low)
- Detect related Issues and dependencies
- Extract actionable requirements

**Parallel Execution**: ✅ Yes (Analyzer Agent)

**When to Use**:
- New Issues created without Labels
- You want AI-powered Issue categorization
- Large batches of Issues need triage

**Example Command**:
```bash
miyabi agent run issue --issue 500
```

**Output**: Labels added to GitHub Issue, analysis report

### 5. PRAgent (まとめるん)

**Role**: Pull Request Automation

**Character Name**: まとめるん (matomerun - "the one who summarizes")

**Responsibilities**:
- Create Pull Requests from Worktree branches
- Generate PR titles following Conventional Commits
- Write comprehensive PR descriptions
- Link PRs to originating Issues ("Closes #500")
- Include quality scores from ReviewAgent
- Add relevant Labels to PRs

**Parallel Execution**: ⚠️ Conditional (Support Agent - limited concurrency)

**When to Use**:
- Code is ready in a Worktree and needs PR creation
- Automating PR workflows
- Ensuring consistent PR formatting

**Example Command**:
```bash
miyabi agent run pr --issue 500
```

**Output**: Draft PR created on GitHub

### 6. DeploymentAgent (はこぶん)

**Role**: CI/CD Deployment Automation

**Character Name**: はこぶん (hakobun - "the one who carries")

**Responsibilities**:
- Trigger CI/CD pipelines (GitHub Actions)
- Deploy to staging environments
- Deploy to production (with approval)
- Monitor deployment status
- Rollback on failure
- Update deployment tracking in Issues

**Parallel Execution**: ⚠️ Conditional (Support Agent)

**When to Use**:
- PR is merged and ready for deployment
- Staging environment needs updating
- Production deployment with safety checks

**Example Command**:
```bash
miyabi agent run deployment --issue 500 --env staging
```

**Output**: Deployment logs, status updates

### 7. RefresherAgent (つなぐん)

**Role**: Issue State Monitoring, Label Updates

**Character Name**: つなぐん (tsunagun - "the one who connects")

**Responsibilities**:
- Monitor Issue state transitions
- Update Labels based on workflow progress
- Sync Issue status with PR status
- Detect stale Issues and add reminders
- Link related Issues and PRs
- Maintain Issue lifecycle integrity

**Parallel Execution**: ✅ Yes (Analyzer Agent)

**When to Use**:
- Automated Issue state management
- Periodic Issue health checks
- Maintaining workflow consistency

**Example Command**:
```bash
miyabi agent run refresher --issue 500
```

**Output**: Updated Labels and Issue comments

## The 14 Business Agents

Beyond coding, Miyabi includes Agents for business strategy, marketing, sales, and analytics. These are particularly useful for founders and solopreneurs building products.

### Strategy & Planning (6 Agents)

#### 1. AIEntrepreneurAgent (あきんどさん)

**Role**: Comprehensive Business Plan Creation

**Character Name**: あきんどさん (akindo-san - "merchant" or "businessperson")

**Responsibilities**:
- Generate complete business plans
- Define vision, mission, values
- Conduct SWOT analysis
- Create financial projections
- Develop go-to-market strategies

**Parallel Execution**: ❌ No (Leader Agent)

**When to Use**: Starting a new business or product

#### 2. ProductConceptAgent (けいかくん)

**Role**: USP Definition, Revenue Model Design

**Character Name**: けいかくん (keikakun - "the one who plans")

**Responsibilities**:
- Define Unique Selling Propositions
- Design pricing strategies
- Create revenue models
- Identify target market segments

**Parallel Execution**: ✅ Yes

#### 3. ProductDesignAgent (つくるん2号)

**Role**: Service Detail Design

**Character Name**: つくるん2号 (tsukurun 2-gou - "creator #2")

**Responsibilities**:
- Design 6-month service roadmaps
- Create content delivery schedules
- Define feature priorities
- Plan phased rollouts

**Parallel Execution**: ✅ Yes

#### 4. FunnelDesignAgent (みちしるべん)

**Role**: Customer Journey Optimization

**Character Name**: みちしるべん (michishiruben - "guide" or "signpost")

**Responsibilities**:
- Design customer acquisition funnels
- Optimize conversion paths
- Create lead magnets
- Plan email sequences

**Parallel Execution**: ✅ Yes

#### 5. PersonaAgent (よみとるん)

**Role**: Target Customer Persona Development

**Character Name**: よみとるん (yomitorun - "the one who reads/understands")

**Responsibilities**:
- Create detailed buyer personas
- Define pain points and motivations
- Identify customer demographics
- Map customer decision-making processes

**Parallel Execution**: ✅ Yes

#### 6. SelfAnalysisAgent (しらべるん)

**Role**: Career & Skill Analysis

**Character Name**: しらべるん (shiraberun - "the one who investigates")

**Responsibilities**:
- Analyze personal strengths and weaknesses
- Identify skill gaps
- Recommend learning paths
- Career trajectory planning

**Parallel Execution**: ✅ Yes

### Marketing (5 Agents)

#### 7. MarketResearchAgent (しらべるん2号)

**Role**: Market Research, Competitor Analysis

**Parallel Execution**: ✅ Yes

**Responsibilities**: TAM/SAM/SOM calculation, trend identification, competitor SWOT

#### 8. MarketingAgent (ひろめるん)

**Role**: Advertising, SEO, SNS Strategy

**Parallel Execution**: ✅ Yes

**Responsibilities**: Ad campaign planning, SEO optimization, content marketing

#### 9. ContentCreationAgent (かくちゃん)

**Role**: Content Production Planning

**Parallel Execution**: ✅ Yes

**Responsibilities**: Video scripts, blog posts, tutorial creation (like this one!)

#### 10. SNSStrategyAgent (つぶやくん)

**Role**: Social Media Strategy

**Parallel Execution**: ✅ Yes

**Responsibilities**: Twitter/X, Instagram, LinkedIn content calendars

#### 11. YouTubeAgent (どうがくん)

**Role**: YouTube Channel Optimization

**Parallel Execution**: ✅ Yes

**Responsibilities**: Video SEO, thumbnail design, channel growth strategies

### Sales & CRM (3 Agents)

#### 12. SalesAgent (うるん)

**Role**: Sales Process Optimization

**Parallel Execution**: ✅ Yes

**Responsibilities**: Lead qualification, sales funnel design, closing strategies

#### 13. CRMAgent (ささえるん)

**Role**: Customer Relationship Management

**Parallel Execution**: ✅ Yes

**Responsibilities**: Customer satisfaction, retention strategies, LTV maximization

#### 14. AnalyticsAgent (かぞえるん)

**Role**: Data Analysis, PDCA Cycles

**Parallel Execution**: ✅ Yes

**Responsibilities**: KPI tracking, growth metrics, A/B testing, dashboards

## Character Name System

Miyabi's character names follow a color-coded role system:

### Color-Coded Roles

| Color | Role Type | Parallel Execution | Examples |
|-------|-----------|-------------------|----------|
| 🔴 **Red** | Leaders | ❌ No (sequential only) | しきるん, あきんどさん |
| 🟢 **Green** | Executors | ✅ Yes (full parallel) | つくるん, めだまん |
| 🔵 **Blue** | Analyzers | ✅ Yes (full parallel) | みつけるん, しらべるん |
| 🟡 **Yellow** | Supporters | ⚠️ Conditional | まとめるん, はこぶん |

### Naming Convention

Most character names end in ん (n), which is a friendly suffix in Japanese:
- **しきるん**: しきる (to organize) + ん
- **つくるん**: つくる (to create) + ん
- **めだまん**: め玉 (eyeball) + ん
- **みつけるん**: みつける (to find) + ん

This makes Agents feel like friendly team members rather than cold automation tools.

### Using Character Names

You can use character names interchangeably with technical names:

```bash
# These are equivalent
miyabi agent run coordinator --issue 500
miyabi agent run しきるん --issue 500

# These are equivalent
miyabi agent run codegen --issue 500
miyabi agent run つくるん --issue 500
```

## Parallel vs. Sequential Execution Rules

Understanding when Agents can run in parallel is crucial for efficient workflows.

### Parallel Execution (✅)

**Executor Agents** and **Analyzer Agents** can run simultaneously in separate Worktrees:

```bash
# Run 3 Issues in parallel
miyabi agent run coordinator --issues 500,501,502 --concurrency 3
```

**Example**: CodeGenAgent, ReviewAgent, and IssueAgent can all run at the same time on different Issues because they work in isolated Worktrees.

### Sequential Execution (❌)

**Leader Agents** like CoordinatorAgent and AIEntrepreneurAgent must run one at a time:

```bash
# These will run sequentially, not in parallel
miyabi agent run coordinator --issue 500
miyabi agent run coordinator --issue 501
```

**Reason**: Leader Agents make high-level decisions that affect the entire workflow. Running multiple Leaders simultaneously could cause conflicting plans.

### Conditional Execution (⚠️)

**Support Agents** like PRAgent and DeploymentAgent have limited concurrency:

- **PRAgent**: Can create multiple PRs, but limited to avoid GitHub rate limits
- **DeploymentAgent**: Can deploy to staging in parallel, but production is sequential

## Hands-On Exercise: Run Multiple Agents

Let's practice using different Agents:

### Exercise 1: Full Workflow

Create an Issue and run the complete workflow:

```bash
# Step 1: Analyze and plan
miyabi agent run coordinator --issue 503

# Step 2: Generate code
miyabi agent run codegen --issue 503

# Step 3: Review quality
miyabi agent run review --issue 503

# Step 4: Create PR
miyabi agent run pr --issue 503
```

### Exercise 2: Parallel Execution

Create 3 small Issues and run them in parallel:

```bash
miyabi agent run coordinator --issues 504,505,506 --concurrency 3
```

Observe how Miyabi creates 3 separate Worktrees and executes tasks simultaneously.

### Exercise 3: Business Agent

Try a Business Agent (requires Issue with business context):

```bash
miyabi agent run persona --issue 507
```

This will generate a detailed customer persona based on your Issue description.

## Agent Selection Guide

**When to use which Agent**:

| Scenario | Agent | Command |
|----------|-------|---------|
| New Issue, need plan | CoordinatorAgent | `miyabi agent run coordinator` |
| Write new code | CodeGenAgent | `miyabi agent run codegen` |
| Review code quality | ReviewAgent | `miyabi agent run review` |
| Categorize Issues | IssueAgent | `miyabi agent run issue` |
| Create Pull Request | PRAgent | `miyabi agent run pr` |
| Deploy to staging | DeploymentAgent | `miyabi agent run deployment --env staging` |
| Update Issue status | RefresherAgent | `miyabi agent run refresher` |
| Create business plan | AIEntrepreneurAgent | `miyabi agent run ai-entrepreneur` |
| Design customer persona | PersonaAgent | `miyabi agent run persona` |
| Analyze market | MarketResearchAgent | `miyabi agent run market-research` |

## Troubleshooting

### Issue: "Agent not found"

**Solution**: Verify Agent name spelling:
```bash
miyabi agent list
```

### Issue: "Concurrency limit exceeded"

**Solution**: Reduce concurrency level:
```bash
miyabi agent run coordinator --issues 500,501 --concurrency 2
```

Max concurrency is typically 5, depending on your system resources.

### Issue: "Agent execution failed"

**Solution**: Check Agent logs:
```bash
ls .ai/logs/
cat .ai/logs/2025-10-24_codegen_issue-500.md
```

Logs contain detailed error messages and stack traces.

## Success Checklist

Before moving to the next tutorial, verify:

- [ ] You understand the BaseAgent trait pattern
- [ ] You can name all 7 Coding Agents and their roles
- [ ] You know the difference between Leader, Executor, Analyzer, and Support Agents
- [ ] You've successfully run at least 3 different Agents
- [ ] You understand parallel vs. sequential execution rules
- [ ] You can use Japanese character names for Agents
- [ ] You know when to use which Agent for different tasks

## Next Steps

Congratulations! You now understand Miyabi's Agent system, including:
- All 21 Agents and their specialized roles
- The friendly character naming system
- Parallel execution rules and Worktree isolation
- How to choose the right Agent for each task

**Next Tutorial**: [Tutorial 3: Issue-to-PR Workflow - Autonomous Development Cycle](./03-issue-to-pr-workflow.md)

In the next tutorial, you'll learn the complete Issue-to-PR workflow, including Label-driven state transitions, Conventional Commits integration, and end-to-end autonomous development.

## Additional Resources

- **Agent Specifications**: `.claude/agents/specs/` in the repository
- **Agent Character Guide**: `.claude/agents/AGENT_CHARACTERS.md`
- **Rust Agent Implementation**: `crates/miyabi-agents/src/`
- **BaseAgent Trait**: `crates/miyabi-agents/src/base.rs`

---

**Tutorial 2 Complete!** You're now an Agent expert. Ready to master the workflow? Proceed to Tutorial 3.
