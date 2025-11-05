# miyabi-workflow

Workflow DSL for Miyabi - Define and execute agent workflows with conditional branching and state persistence.

## Features

- **Fluent API** - Build workflows with method chaining
- **Sequential Execution** - `.step()` and `.then()` for sequential steps
- **Parallel Execution** - `.parallel()` for concurrent tasks
- **Conditional Branching** - `.branch()` and `.branch_on()` for dynamic paths
- **State Persistence** - Track execution state with sled database
- **DAG Construction** - Automatic dependency graph generation

## Quick Start

```rust
use miyabi_workflow::{WorkflowBuilder, Condition};
use miyabi_types::agent::AgentType;

// Define a workflow
let workflow = WorkflowBuilder::new("deployment-pipeline")
    .step("analyze", AgentType::IssueAgent)
    .then("test", AgentType::CodeGenAgent)
    .branch_on("quality-gate", vec![
        ("high", Condition::FieldGreaterThan {
            field: "quality_score".into(),
            value: 0.9
        }, "deploy"),
        ("low", Condition::Always, "review"),
    ])
    .step("deploy", AgentType::DeploymentAgent)
    .step("review", AgentType::ReviewAgent);

// Build DAG
let dag = workflow.build_dag()?;
```

## Conditional Branching

### Simple Pass/Fail Branch

```rust
let workflow = WorkflowBuilder::new("test-workflow")
    .step("test", AgentType::CodeGenAgent)
    .branch("quality-check", "deploy", "reject");
```

### Custom Conditions

```rust
use miyabi_workflow::Condition;

let workflow = WorkflowBuilder::new("custom-workflow")
    .step("analyze", AgentType::IssueAgent)
    .branch_on("decision", vec![
        ("high-priority", Condition::FieldEquals {
            field: "priority".into(),
            value: json!("P0")
        }, "fast-track"),
        ("normal", Condition::Always, "standard-review"),
    ]);
```

### Available Conditions

- `Condition::Always` - Always evaluates to true (fallback branch)
- `Condition::FieldEquals { field, value }` - Field equals a specific value
- `Condition::FieldGreaterThan { field, value }` - Numeric field > threshold
- `Condition::FieldLessThan { field, value }` - Numeric field < threshold
- `Condition::FieldExists { field }` - Field exists in context
- `Condition::And(vec![...])` - All conditions must be true
- `Condition::Or(vec![...])` - At least one condition must be true
- `Condition::Not(Box::new(...))` - Negate a condition

## Execution with CoordinatorAgent

```rust
use miyabi_agent_coordinator::CoordinatorAgent;

let coordinator = CoordinatorAgent::new(config);

// Execute workflow with state tracking
let execution_state = coordinator
    .execute_workflow(&workflow, Some("./data/workflow-state"))
    .await?;

println!("Status: {:?}", execution_state.status);
println!("Completed steps: {:?}", execution_state.completed_steps);
```

## State Management

The workflow execution state is automatically persisted:

```rust
use miyabi_workflow::StateStore;

let state_store = StateStore::with_path("./data/workflow-state")?;

// Load execution state
if let Some(state) = state_store.load_execution(&workflow_id)? {
    println!("Workflow status: {:?}", state.status);
    println!("Current step: {:?}", state.current_step);
}
```

## Integration

This crate is designed to work with:
- **miyabi-agent-coordinator** - Execute workflows with agent orchestration
- **miyabi-types** - Task and Agent type definitions
- **miyabi-dag** - DAG-based task graph construction

## License

Apache-2.0
