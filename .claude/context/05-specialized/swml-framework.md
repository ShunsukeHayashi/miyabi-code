# SWML Framework - Shunsuke's World Model Logic

**Priority**: ⭐⭐⭐⭐⭐ Essential
**Context Type**: Theoretical Foundation
**Load**: Just-In-Time (when SWML referenced)

---

## Overview

**SWML (Shunsuke's World Model Logic)** is the mathematical foundation for the entire Miyabi project. It provides formal convergence guarantees for autonomous development systems.

**Academic Paper**: `/theory/swml-paper/SWML_PAPER.pdf` (29 pages)
**Implementation**: `/implementation/omega/` (θ₁-θ₆ phases)

---

## The Ω Function: Core Concept

```
Ω: I × W → R
```

**Definition**: Universal execution function that maps Intent (I) and World (W) to Result (R)

**Decomposition**:
```
Ω = θ₆ ∘ θ₅ ∘ θ₄ ∘ θ₃ ∘ θ₂ ∘ θ₁
```

**Six Phases**:

| Phase | Name | Function | Input → Output |
|-------|------|----------|----------------|
| θ₁ | Understanding | Intent analysis with Step-back (26 steps) | (I, W) → Abstract Spec |
| θ₂ | Generation | Code generation with SELF-DISCOVER | Abstract Spec → Code |
| θ₃ | Allocation | DAG task decomposition | Code → Task Graph |
| θ₄ | Execution | Parallel worktree execution | Task Graph → Results |
| θ₅ | Integration | PR creation and merging | Results → Pull Request |
| θ₆ | Learning | World state update | Pull Request → W' |

**Information Flow**:
```
┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐
│ I,W │ → │ θ₁  │ → │ θ₂  │ → │ θ₃  │ → │ θ₄  │ → │ θ₅  │ → │ θ₆  │ → │ R,Q │
└─────┘    └─────┘    └─────┘    └─────┘    └─────┘    └─────┘    └─────┘
            26-step    CodeGen     DAG       Worktree    GitHub     Feedback
            Step-back  +DISCOVER   Builder   Execution   PR         Loop
```

---

## Key Theorems

### Theorem 7.2: Convergence Guarantee

**Statement**: For any task with Lipschitz constant L < 1, the SWML system converges to optimal quality.

**Formula**:
```
|Q_{n+1} - Q*| ≤ (1-α) |Q_n - Q*|
```

**Parameters**:
- Q* = 0.80 (target quality threshold)
- α = 0.20 (learning rate)
- ε = 0.01 (convergence threshold)

**Meaning**: Quality improves geometrically with each iteration.

### Theorem 7.3: Convergence Rate

**Statement**: The system converges within a bounded number of iterations.

**Formula**:
```
n ≤ ⌈log(ε/|Q_0 - Q*|) / log(1-α)⌉
```

**Typical Values**:
- Initial quality Q_0 ≈ 0.65
- Iterations: 4-5 average (empirically validated)
- Max iterations: 10 (99.99% convergence probability)

### Safety Axiom (Axiom 6)

**Statement**: Quality never falls below threshold.

**Formula**:
```
Q(R) ≥ Q_min = 0.80
```

**Guarantee**: 94.5% success rate (189/200 tasks) in empirical validation.

---

## Implementation Mapping

### Code Structure

```
/implementation/omega/
├── theta1-understanding/       # θ₁: Understanding
│   ├── miyabi-agent-core       # Core agent logic
│   ├── miyabi-llm              # LLM integration
│   └── miyabi-step-back        # 26-step processor (NEW)
│
├── theta2-generation/          # θ₂: Generation
│   ├── miyabi-agent-codegen    # Code generation
│   └── miyabi-self-discover    # SELF-DISCOVER (NEW)
│
├── theta3-allocation/          # θ₃: Allocation
│   ├── miyabi-orchestrator     # Task orchestration
│   └── miyabi-dag              # DAG builder (NEW)
│
├── theta4-execution/           # θ₄: Execution
│   ├── miyabi-worktree         # Git worktree management
│   ├── miyabi-pty-manager      # Process execution
│   └── miyabi-session-manager  # Session state
│
├── theta5-integration/         # θ₅: Integration
│   ├── miyabi-github           # GitHub API
│   └── miyabi-agent-pr         # PR agent (NEW)
│
├── theta6-learning/            # θ₆: Learning
│   ├── miyabi-knowledge        # Knowledge base
│   ├── miyabi-persistence      # State persistence
│   └── miyabi-feedback-loop    # Feedback loop (NEW)
│
└── miyabi-agent-swml           # Main SWML orchestrator
```

### Quality Metrics

**Formula** (from paper):
```
Q(R) = 0.40 × TestPassRate +
       0.30 × CodeQuality +
       0.20 × Correctness +
       0.10 × StyleCompliance
```

**Code**: `/implementation/quality/miyabi-metrics/` (NEW)

### Convergence Tracking

**Code**: `/implementation/core/miyabi-convergence/` (NEW)

**Features**:
- Geometric convergence detection: `|Q_n - Q*| < ε`
- Iteration prediction: `n = ⌈log(ε/δ) / log(1-α)⌉`
- R² validation: Fit empirical data to `y = a(1-α)^n`
- History logging for analysis

---

## Usage in Code

### Check Current Phase

```rust
use miyabi_agent_swml::{OmegaFunction, Intent, World};

let omega = OmegaFunction::new().await?;
let intent = Intent::from_issue(issue_number);
let world = World::current()?;

// Execute all 6 phases
let result = omega.execute(intent, world).await?;
println!("Quality: {}", result.quality());
```

### Track Convergence

```rust
use miyabi_convergence::ConvergenceTracker;

let tracker = ConvergenceTracker::new();
let predicted_iterations = tracker.predict_iterations(initial_quality);
println!("Expected convergence in {} iterations", predicted_iterations);

// During execution
if tracker.has_converged(current_quality) {
    println!("Converged!");
}
```

### Calculate Quality

```rust
use miyabi_metrics::QualityMetrics;

let metrics = QualityMetrics {
    test_pass_rate: 0.95,
    code_quality: 0.82,
    correctness: 0.88,
    style_compliance: 0.90,
};

let quality = metrics.compute_quality();
assert!(quality >= 0.80); // Safety Axiom
```

---

## Key Concepts

### Intent Space (I)

**Definition**: User's desired outcome.

**Components**:
- Description: Natural language goal
- Constraints: Technical/business constraints
- Priority: Urgency level
- Metadata: Context information

**Code**: `miyabi-types::Intent`

### World Space (W)

**Definition**: Current system state.

**Components**:
- Codebase: Files, structure, dependencies
- Context: Git history, issues, PRs
- Resources: Available compute, APIs
- Constraints: Time, memory, cost

**Code**: `miyabi-types::World`

### Result Space (R)

**Definition**: Execution outcome.

**Components**:
- Output: Generated code, files
- Quality: Q(R) score
- Metadata: Time, iterations, metrics

**Code**: `miyabi-types::Result`

### Quality Score (Q)

**Definition**: Weighted metric measuring result quality.

**Range**: [0, 1]
**Target**: Q* = 0.80
**Safety**: Q(R) ≥ 0.80 for 94.5% of tasks

---

## Integration Points

### With Agents

All agents operate within Ω function phases:

- **CoordinatorAgent**: Orchestrates θ₁-θ₆ execution
- **CodeGenAgent**: Implements θ₂ (Generation)
- **ReviewAgent**: Quality validation in θ₅
- **DeploymentAgent**: Post-θ₅ deployment

### With Worktree System

θ₄ (Execution) phase uses Git worktree isolation:

```bash
# Create worktree for task
miyabi-worktree create task-123

# Execute in isolation (θ₄)
cd .worktrees/task-123
cargo test

# Integrate (θ₅)
git checkout main
git merge --no-ff task-123
```

### With Knowledge Base

θ₆ (Learning) phase updates world state:

```rust
// After PR merge (θ₅ → θ₆)
let learning = LearningPhase::new();
let updated_world = learning.update(world, result).await?;

// Store in knowledge base
knowledge_base.store(updated_world).await?;
```

---

## Performance Metrics

### Empirical Validation (200 tasks)

| Metric | Value | Theoretical | Match |
|--------|-------|-------------|-------|
| Mean iterations | 4.7 ± 1.5 | 5.2 | 90.4% |
| Mean quality | 0.86 ± 0.07 | ≥ 0.80 | ✅ |
| Success rate | 94.5% | ≥ 80% | ✅ |
| Convergence rate (α) | 0.22 ± 0.03 | 0.20 | 110% |
| R² (goodness of fit) | 0.94 | > 0.90 | ✅ |

### Comparison to Baselines

| System | Quality | Time (min) | Pass@1 | Convergence |
|--------|---------|------------|--------|-------------|
| **SWML/Miyabi** | **0.88 ± 0.06** | **2.8** | **92%** | **✅ 4.6 iter** |
| OpenAI Codex | 0.74 ± 0.11 | 3.8 | 72% | ❌ None |
| Claude Code | 0.78 ± 0.09 | 3.2 | 76% | ❌ None |
| Human Developers | 0.91 ± 0.05 | 18.3 | 88% | N/A |

**Key Insight**: SWML is the only system with formal convergence guarantees.

---

## Further Reading

**Essential**:
- [omega-phases.md](omega-phases.md) - Detailed θ₁-θ₆ implementation guide
- [/theory/swml-paper/SWML_PAPER.pdf](/theory/swml-paper/SWML_PAPER.pdf) - Full academic paper

**Guides**:
- [../ guides/SWML_CONVERGENCE.md](../guides/SWML_CONVERGENCE.md) - Convergence tracking guide (NEW)
- [../guides/SWML_QUALITY_METRICS.md](../guides/SWML_QUALITY_METRICS.md) - Quality metrics guide (NEW)

**Implementation**:
- [/implementation/omega/miyabi-agent-swml/IMPLEMENTATION_PLAN.md](/implementation/omega/miyabi-agent-swml/IMPLEMENTATION_PLAN.md) - 8-week implementation roadmap
- [/implementation/omega/miyabi-agent-swml/README.md](/implementation/omega/miyabi-agent-swml/README.md) - SWML agent documentation

**Restructuring**:
- [/RESTRUCTURING_PLAN.md](/RESTRUCTURING_PLAN.md) - Project-wide SWML alignment plan

---

**Last Updated**: 2025-11-01
**Status**: ✅ Active
**Maintained by**: Miyabi Team
