# Ω Function Phases - θ₁-θ₆ Implementation Guide

**Priority**: ⭐⭐⭐⭐⭐ Essential
**Context Type**: Implementation Guide
**Load**: When implementing SWML phases

---

## Overview

This document provides detailed implementation guidance for each phase of the Ω (Omega) function in the SWML framework.

**Related**: [swml-framework.md](swml-framework.md) - High-level SWML overview

---

## Ω Function Decomposition

```
Ω: I × W → R
Ω = θ₆ ∘ θ₅ ∘ θ₄ ∘ θ₃ ∘ θ₂ ∘ θ₁
```

**Information Flow**:
```
Intent (I) + World (W)
    ↓ θ₁
Abstract Specification
    ↓ θ₂
Generated Code
    ↓ θ₃
Task Graph (DAG)
    ↓ θ₄
Execution Results
    ↓ θ₅
Pull Request
    ↓ θ₆
Updated World (W') + Quality Score (Q)
```

---

## θ₁: Understanding Phase

**Function**: `θ₁: I × W → Spec`
**Purpose**: Transform user intent into abstract specification using Step-back prompting

### Implementation Location
```
/implementation/omega/theta1-understanding/
├── miyabi-agent-core/           # Core agent logic (EXISTS)
├── miyabi-llm/                  # LLM integration (EXISTS)
└── miyabi-step-back/            # 26-step processor (NEW - planned)
```

### Algorithm

**Step-back Prompting** (26 steps):
1. **Abstract Context** (steps 1-6): Extract high-level principles
2. **Reasoning Path** (steps 7-18): Build logical reasoning chain
3. **Specific Solution** (steps 19-26): Derive concrete solution

**Code** (miyabi-step-back/src/lib.rs):
```rust
pub struct StepBackProcessor {
    llm_client: Arc<LLMClient>,
    num_steps: usize, // Default: 26
}

impl StepBackProcessor {
    pub async fn process(&self, intent: Intent, world: World) -> Result<Specification> {
        // Step 1-6: Abstract principles
        let principles = self.extract_principles(&intent, &world).await?;

        // Step 7-18: Reasoning chain
        let reasoning = self.build_reasoning(&principles, &intent).await?;

        // Step 19-26: Concrete solution
        let spec = self.derive_specification(&reasoning, &intent, &world).await?;

        Ok(spec)
    }
}
```

### Inputs
- **Intent (I)**: User's goal
  - Natural language description
  - Priority level
  - Constraints
- **World (W)**: Current state
  - Codebase structure
  - Git history
  - Available resources

### Outputs
- **Specification**:
  - Abstract requirements
  - Technical constraints
  - Success criteria
  - Test requirements

### Quality Metrics
- Clarity: Can specification be understood unambiguously?
- Completeness: Are all requirements captured?
- Testability: Can success be objectively verified?

### Example Usage
```rust
use miyabi_step_back::StepBackProcessor;

let processor = StepBackProcessor::new(llm_client);
let intent = Intent::from_issue(issue_number);
let world = World::current()?;

let spec = processor.process(intent, world).await?;
println!("Generated spec: {:?}", spec);
```

---

## θ₂: Generation Phase

**Function**: `θ₂: Spec → Code`
**Purpose**: Generate code from specification using SELF-DISCOVER framework

### Implementation Location
```
/implementation/omega/theta2-generation/
├── miyabi-agent-codegen/        # Code generation (EXISTS)
└── miyabi-self-discover/        # SELF-DISCOVER (NEW - planned)
```

### Algorithm

**SELF-DISCOVER** (3 stages):
1. **SELECT**: Choose relevant reasoning modules
2. **ADAPT**: Adapt modules to specific task
3. **IMPLEMENT**: Generate structured reasoning plan

**Code** (miyabi-self-discover/src/lib.rs):
```rust
pub struct SelfDiscoverAgent {
    reasoning_modules: Vec<ReasoningModule>,
    llm_client: Arc<LLMClient>,
}

impl SelfDiscoverAgent {
    pub async fn generate(&self, spec: Specification) -> Result<GeneratedCode> {
        // Stage 1: SELECT relevant modules
        let selected = self.select_modules(&spec).await?;

        // Stage 2: ADAPT to task
        let adapted = self.adapt_modules(&selected, &spec).await?;

        // Stage 3: IMPLEMENT reasoning plan
        let code = self.implement_plan(&adapted, &spec).await?;

        Ok(code)
    }
}
```

### Reasoning Modules
1. Critical thinking
2. Step-by-step reasoning
3. Creative solutions
4. Pros-cons analysis
5. Simplification strategies
6. Break down complex problems
7. Think outside the box
8. Analogical reasoning

### Inputs
- **Specification**: From θ₁

### Outputs
- **Generated Code**:
  - Implementation files
  - Test files
  - Documentation comments

### Quality Metrics
- Correctness: Does code match specification?
- Style: Follows Rust/TypeScript conventions?
- Test coverage: >= 80% line coverage?

### Example Usage
```rust
use miyabi_self_discover::SelfDiscoverAgent;

let agent = SelfDiscoverAgent::new(llm_client);
let code = agent.generate(spec).await?;

println!("Generated {} files", code.files.len());
```

---

## θ₃: Allocation Phase

**Function**: `θ₃: Code → TaskGraph`
**Purpose**: Decompose code into parallel executable tasks (DAG)

### Implementation Location
```
/implementation/omega/theta3-allocation/
├── miyabi-orchestrator/         # Task orchestration (EXISTS)
└── miyabi-dag/                  # DAG builder (NEW - planned)
```

### Algorithm

**DAG Construction**:
1. **Analyze dependencies**: Identify file/module dependencies
2. **Topological sort**: Order tasks by dependencies
3. **Parallelization**: Group independent tasks
4. **Resource allocation**: Assign worktrees

**Code** (miyabi-dag/src/lib.rs):
```rust
pub struct DAGBuilder {
    max_parallelism: usize,
}

impl DAGBuilder {
    pub fn build(&self, code: GeneratedCode) -> Result<TaskGraph> {
        // 1. Analyze dependencies
        let deps = self.analyze_dependencies(&code)?;

        // 2. Topological sort
        let sorted = self.topological_sort(&deps)?;

        // 3. Create task graph
        let graph = TaskGraph::from_sorted(sorted, self.max_parallelism);

        Ok(graph)
    }
}
```

### Inputs
- **Generated Code**: From θ₂

### Outputs
- **Task Graph**:
  - Nodes: Individual compilation/test tasks
  - Edges: Dependencies between tasks
  - Levels: Parallelization groups

### Quality Metrics
- Parallelism: How many tasks can run concurrently?
- Efficiency: Minimal total execution time?

### Example Usage
```rust
use miyabi_dag::DAGBuilder;

let builder = DAGBuilder::new(max_parallelism: 4);
let graph = builder.build(code)?;

println!("Graph has {} levels", graph.levels.len());
println!("Max parallelism: {}", graph.max_parallel_tasks());
```

---

## θ₄: Execution Phase

**Function**: `θ₄: TaskGraph → Results`
**Purpose**: Execute tasks in parallel using Git worktrees

### Implementation Location
```
/implementation/omega/theta4-execution/
├── miyabi-worktree/             # Git worktree management (EXISTS)
├── miyabi-pty-manager/          # Process execution (EXISTS)
└── miyabi-session-manager/      # Session state (EXISTS)
```

### Algorithm

**Parallel Execution**:
1. **Create worktrees**: One per parallel task
2. **Execute level-by-level**: Process DAG levels in order
3. **Collect results**: Gather stdout/stderr/exit codes
4. **Handle failures**: Retry or propagate errors

**Code** (miyabi-worktree/src/execution.rs):
```rust
pub struct WorktreeExecutor {
    worktree_manager: WorktreeManager,
    pty_manager: PTYManager,
}

impl WorktreeExecutor {
    pub async fn execute(&self, graph: TaskGraph) -> Result<Vec<TaskResult>> {
        let mut results = Vec::new();

        for level in graph.levels {
            // Execute all tasks in this level in parallel
            let level_results = self.execute_level(&level).await?;
            results.extend(level_results);
        }

        Ok(results)
    }

    async fn execute_level(&self, level: &TaskLevel) -> Result<Vec<TaskResult>> {
        let mut handles = Vec::new();

        for task in &level.tasks {
            // Create worktree
            let worktree = self.worktree_manager.create(task.name()).await?;

            // Execute task in worktree
            let handle = self.pty_manager.spawn(task.command(), worktree.path());
            handles.push(handle);
        }

        // Wait for all tasks to complete
        futures::future::join_all(handles).await
    }
}
```

### Inputs
- **Task Graph**: From θ₃

### Outputs
- **Execution Results**:
  - Per-task exit codes
  - Stdout/stderr output
  - Execution duration
  - Resource usage

### Quality Metrics
- Success rate: % of tasks that passed
- Execution time: Total wall-clock time
- Resource efficiency: CPU/memory usage

### Example Usage
```rust
use miyabi_worktree::WorktreeExecutor;

let executor = WorktreeExecutor::new();
let results = executor.execute(graph).await?;

let success_count = results.iter().filter(|r| r.success()).count();
println!("{}/{} tasks succeeded", success_count, results.len());
```

---

## θ₅: Integration Phase

**Function**: `θ₅: Results → PullRequest`
**Purpose**: Create and merge pull requests with review

### Implementation Location
```
/implementation/omega/theta5-integration/
├── miyabi-github/               # GitHub API (EXISTS)
└── miyabi-agent-pr/             # PR agent (NEW - planned)
```

### Algorithm

**PR Creation & Merge**:
1. **Aggregate results**: Combine all worktree changes
2. **Create branch**: Merge all worktrees into feature branch
3. **Generate PR description**: Summarize changes
4. **Auto-review**: Run quality checks
5. **Merge**: Auto-merge if quality threshold met

**Code** (miyabi-agent-pr/src/lib.rs):
```rust
pub struct PRAgent {
    github_client: GithubClient,
    base_branch: String, // Usually "main"
}

impl PRAgent {
    pub async fn create_and_merge(&self, results: Vec<TaskResult>) -> Result<PullRequest> {
        // 1. Aggregate changes
        let changes = self.aggregate_changes(&results)?;

        // 2. Create feature branch
        let branch = self.create_branch(&changes).await?;

        // 3. Generate PR description
        let description = self.generate_description(&changes, &results);

        // 4. Create PR
        let pr = self.github_client.create_pr(
            &branch.name,
            &self.base_branch,
            &description
        ).await?;

        // 5. Auto-review
        let quality = self.review_quality(&pr).await?;

        // 6. Auto-merge if quality sufficient
        if quality >= 0.80 {
            self.github_client.merge_pr(pr.number).await?;
        }

        Ok(pr)
    }
}
```

### Inputs
- **Execution Results**: From θ₄

### Outputs
- **Pull Request**:
  - PR number
  - Branch name
  - Files changed
  - Merge status

### Quality Metrics
- Review score: Automated code review quality
- Test pass rate: % of tests passing
- Merge time: Time from creation to merge

### Example Usage
```rust
use miyabi_agent_pr::PRAgent;

let agent = PRAgent::new(github_client, "main");
let pr = agent.create_and_merge(results).await?;

println!("PR #{} created and merged", pr.number);
```

---

## θ₆: Learning Phase

**Function**: `θ₆: PullRequest → W' × Q`
**Purpose**: Update world state and calculate quality score

### Implementation Location
```
/implementation/omega/theta6-learning/
├── miyabi-knowledge/            # Knowledge base (EXISTS)
├── miyabi-persistence/          # State persistence (EXISTS)
└── miyabi-feedback-loop/        # Feedback loop (NEW - planned)
```

### Algorithm

**World Update & Quality Calculation**:
1. **Extract knowledge**: Learn from PR changes
2. **Update world state**: Incorporate new information
3. **Calculate quality**: Compute Q(R) metric
4. **Persist state**: Save updated world

**Code** (miyabi-feedback-loop/src/lib.rs):
```rust
pub struct FeedbackLoop {
    knowledge_base: KnowledgeBase,
    persistence: PersistenceManager,
}

impl FeedbackLoop {
    pub async fn process(&self, pr: PullRequest, world: World) -> Result<(World, f64)> {
        // 1. Extract knowledge from PR
        let knowledge = self.extract_knowledge(&pr).await?;

        // 2. Update world state
        let mut updated_world = world.clone();
        updated_world.incorporate(knowledge);

        // 3. Calculate quality score
        let quality = self.calculate_quality(&pr, &updated_world).await?;

        // 4. Persist updated world
        self.persistence.save(&updated_world).await?;

        Ok((updated_world, quality))
    }

    async fn calculate_quality(&self, pr: &PullRequest, world: &World) -> Result<f64> {
        let test_pass_rate = pr.test_results.pass_rate();
        let code_quality = self.analyze_code_quality(pr).await?;
        let correctness = self.verify_correctness(pr, world).await?;
        let style = self.check_style_compliance(pr).await?;

        // Quality formula from SWML paper
        let quality = 0.40 * test_pass_rate
                    + 0.30 * code_quality
                    + 0.20 * correctness
                    + 0.10 * style;

        Ok(quality)
    }
}
```

### Inputs
- **Pull Request**: From θ₅
- **World (W)**: Current state

### Outputs
- **Updated World (W')**:
  - New codebase state
  - Updated knowledge
- **Quality Score (Q)**:
  - Range: [0, 1]
  - Target: Q* = 0.80

### Quality Metrics
- Knowledge retention: How much was learned?
- Quality improvement: ΔQ = Q_new - Q_old
- Convergence progress: |Q - Q*|

### Example Usage
```rust
use miyabi_feedback_loop::FeedbackLoop;

let feedback = FeedbackLoop::new(knowledge_base, persistence);
let (updated_world, quality) = feedback.process(pr, world).await?;

println!("Quality: {:.2}", quality);
println!("Converged: {}", quality >= 0.80);
```

---

## Complete Execution Example

```rust
use miyabi_agent_swml::OmegaFunction;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize Ω function
    let omega = OmegaFunction::new().await?;

    // Input
    let intent = Intent::from_issue(issue_number);
    let world = World::current()?;

    // Execute all 6 phases
    let result = omega.execute(intent, world).await?;

    // Output
    println!("Quality: {:.2}", result.quality());
    println!("PR: #{}", result.pr_number());
    println!("Iterations: {}", result.iteration_count());

    Ok(())
}
```

---

## Convergence Tracking

Track convergence progress across iterations:

```rust
use miyabi_convergence::ConvergenceTracker;

let tracker = ConvergenceTracker::new();

// Predict iterations needed
let predicted = tracker.predict_iterations(initial_quality);
println!("Expected convergence in {} iterations", predicted);

// During execution
for iteration in 1..=10 {
    let (world, quality) = omega.execute_once(intent, world).await?;

    if tracker.has_converged(quality) {
        println!("Converged in {} iterations!", iteration);
        break;
    }
}
```

**Convergence Formula**:
```
|Q_{n+1} - Q*| ≤ (1-α) |Q_n - Q*|
where α = 0.20, Q* = 0.80
```

---

## Performance Metrics

From SWML paper (200 task validation):

| Phase | Avg Time | Success Rate |
|-------|----------|--------------|
| θ₁ Understanding | 0.5 min | 98.5% |
| θ₂ Generation | 1.2 min | 95.0% |
| θ₃ Allocation | 0.1 min | 100% |
| θ₄ Execution | 0.8 min | 94.5% |
| θ₅ Integration | 0.15 min | 97.0% |
| θ₆ Learning | 0.05 min | 100% |
| **Total** | **2.8 min** | **94.5%** |

---

## Further Reading

- [swml-framework.md](swml-framework.md) - High-level SWML overview
- [../guides/SWML_CONVERGENCE.md](../guides/SWML_CONVERGENCE.md) - Convergence tracking guide
- [../guides/SWML_QUALITY_METRICS.md](../guides/SWML_QUALITY_METRICS.md) - Quality metrics guide
- [/miyabi_def/SWML_PAPER.pdf](/miyabi_def/SWML_PAPER.pdf) - Full academic paper

---

**Last Updated**: 2025-11-01
**Status**: ✅ Active
**Maintained by**: Miyabi Team
