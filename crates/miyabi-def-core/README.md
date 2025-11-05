# miyabi-def-core

**Miyabi Definition System - Core Library**

Machine-readable source of truth for the Miyabi project, providing structured access to entities, relations, labels, workflows, and agents defined in YAML format.

## Overview

`miyabi-def-core` is the Rust library for accessing Miyabi definitions from `miyabi_def/` directory. It provides type-safe access to:

- **14 Core Entities** (E1-E14): Issue, Task, Agent, PR, Label, etc.
- **39 Relations** (R1-R39): Entity relationships with cardinality notation
- **57 Labels** (11 categories): STATE, PRIORITY, AGENT, TYPE, etc.
- **5 Core Workflows** (W1-W5): Issue lifecycle workflows
- **21 Agents**: 7 Coding agents + 14 Business agents

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-def-core = { version = "0.1.1", path = "../miyabi-def-core" }
```

## Quick Start

```rust
use miyabi_def_core::MiyabiDef;

fn main() -> anyhow::Result<()> {
    // Load definitions from default location
    let def = MiyabiDef::load_default()?;

    // Access entities
    println!("Total entities: {}", def.entities().len());
    if let Some(issue) = def.entity("E1_Issue") {
        println!("Issue entity: {}", issue.name);
    }

    // Access labels
    println!("Total labels: {}", def.labels().len());
    if let Some(label) = def.label("state:pending") {
        println!("Label: {} - {}", label.name, label.description);
    }

    // Access agents
    println!("Total agents: {}", def.agents().len());
    for agent in def.agents().values() {
        if agent.is_coding_agent() {
            println!("Coding agent: {}", agent.name);
        }
    }

    Ok(())
}
```

## Features

### Entity Definitions

```rust
use miyabi_def_core::MiyabiDef;

let def = MiyabiDef::load_default()?;

// Get all entities
for (id, entity) in def.entities() {
    println!("{}: {} ({})", entity.id, entity.name, entity.entity_type);
}

// Get specific entity
if let Some(task) = def.entity("E2_Task") {
    println!("Task entity: {:?}", task);
}
```

### Relation Definitions

```rust
// Get all relations
for (id, relation) in def.relations() {
    println!("{}: {} --{}→ {}",
        relation.id,
        relation.from,
        relation.name,
        relation.to
    );
}

// Check relation cardinality
if let Some(rel) = def.relation("R1_Issue_AnalyzedBy_Agent") {
    if rel.is_one_to_one() {
        println!("This is a 1:1 relation");
    }
}
```

### Label Definitions

```rust
// Get all labels in a category
for (name, label) in def.labels() {
    if label.is_state_label() {
        println!("State label: {} ({})", label.name, label.emoji.as_deref().unwrap_or(""));
    }
}

// Get specific label
if let Some(label) = def.label("P0-Critical") {
    println!("Priority: {} - Color: {}", label.name, label.color.as_deref().unwrap_or("N/A"));
}
```

### Workflow Definitions

```rust
// Get all workflows
for (id, workflow) in def.workflows() {
    println!("Workflow {}: {} ({})",
        workflow.id,
        workflow.name,
        workflow.duration.as_deref().unwrap_or("N/A")
    );
}
```

### Agent Definitions

```rust
// Filter coding agents
let coding_agents: Vec<_> = def.agents()
    .values()
    .filter(|a| a.is_coding_agent())
    .collect();

println!("Coding agents: {}", coding_agents.len());

// Filter business agents
let business_agents: Vec<_> = def.agents()
    .values()
    .filter(|a| a.is_business_agent())
    .collect();

println!("Business agents: {}", business_agents.len());
```

## Environment Variables

### `MIYABI_DEF_PATH`

Override the default miyabi_def location:

```bash
export MIYABI_DEF_PATH=/custom/path/to/miyabi_def
```

```rust
// Will use MIYABI_DEF_PATH if set
let def = MiyabiDef::load_default()?;
```

## Architecture

### Directory Structure

```
miyabi_def/
├── generated/           # Generated YAML files (loaded by this crate)
│   ├── entities.yaml    # 14 entities
│   ├── relations.yaml   # 39 relations
│   ├── labels.yaml      # 57 labels
│   ├── workflows.yaml   # 5 workflows
│   └── agents.yaml      # 21 agents
├── variables/           # Source YAML variables
└── templates/           # Jinja2 templates
```

### Type Hierarchy

```rust
MiyabiDef
├── entities: HashMap<String, EntityDef>
├── relations: HashMap<String, RelationDef>
├── labels: HashMap<String, LabelDef>
├── workflows: HashMap<String, WorkflowDef>
├── agents: HashMap<String, AgentDef>
└── metadata: Metadata
```

## Error Handling

```rust
use miyabi_def_core::{MiyabiDef, Error};

match MiyabiDef::load_default() {
    Ok(def) => println!("Loaded {} entities", def.entities().len()),
    Err(Error::PathNotFound(path)) => {
        eprintln!("miyabi_def not found at: {:?}", path);
    }
    Err(Error::YamlParse(e)) => {
        eprintln!("YAML parse error: {}", e);
    }
    Err(e) => {
        eprintln!("Error: {}", e);
    }
}
```

## Testing

```bash
# Run unit tests
cargo test --package miyabi-def-core

# Run integration tests (requires miyabi_def/)
cargo test --package miyabi-def-core -- --ignored

# Run with verbose output
cargo test --package miyabi-def-core -- --nocapture
```

## Integration with Other Crates

### Example: Agent Execution

```rust
use miyabi_def_core::MiyabiDef;

fn get_agent_config(agent_name: &str) -> anyhow::Result<()> {
    let def = MiyabiDef::load_default()?;

    if let Some(agent) = def.agent(agent_name) {
        println!("Agent: {}", agent.name);
        println!("Type: {:?}", agent.agent_type);
        println!("Responsibilities: {:?}", agent.responsibilities);
        println!("Authority: {:?}", agent.authority);
    }

    Ok(())
}
```

### Example: Label Validation

```rust
use miyabi_def_core::MiyabiDef;

fn validate_labels(labels: &[String]) -> anyhow::Result<Vec<String>> {
    let def = MiyabiDef::load_default()?;

    let invalid: Vec<_> = labels.iter()
        .filter(|label| def.label(label).is_none())
        .cloned()
        .collect();

    Ok(invalid)
}
```

## Performance

- **Load time**: ~50ms (cold start), ~5ms (cached)
- **Memory usage**: ~2MB for all definitions
- **YAML parsing**: Uses `serde_yaml` for efficient deserialization

## Roadmap

### Phase 1 ✅ (Current)
- [x] Load entities, relations, labels, workflows, agents
- [x] Type-safe access API
- [x] Error handling
- [x] Documentation

### Phase 2 (Future)
- [ ] Validation rules (e.g., relation cardinality checks)
- [ ] Query DSL for complex lookups
- [ ] Cache layer for faster repeated access
- [ ] Watch mode for hot-reload during development

### Phase 3 (Future)
- [ ] Code generation from definitions
- [ ] GraphQL schema generation
- [ ] Integration with miyabi-github for label sync

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache-2.0

## Links

- **Project**: [Miyabi](https://github.com/ShunsukeHayashi/Miyabi)
- **Documentation**: [miyabi_def/README.md](../../miyabi_def/README.md)
- **Entity-Relation Model**: [docs/ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md)
- **Label System**: [docs/LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md)

---

**Version**: 0.1.1 | **Status**: Phase 1 Complete ✅ | **Maintained by**: Miyabi Team
