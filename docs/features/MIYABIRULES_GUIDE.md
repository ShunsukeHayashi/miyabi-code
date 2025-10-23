# .miyabirules - Project-specific Custom Rules Guide

**Version**: 1.0.0  
**Status**: ✅ Implemented (Issue #497 - Phase 2)

## 📋 Overview

`.miyabirules` is Miyabi's answer to project-specific customization, inspired by Cline's `.clinerules`. It allows you to define:

- **Coding standards** - Project-specific rules and conventions
- **Agent preferences** - Customize behavior for each agent type
- **Project context** - Tech stack, architecture, and domain knowledge
- **Escalation rules** - When to escalate to human review

## 🚀 Quick Start

### 1. Create `.miyabirules` in your project root

```bash
# Copy the example file
cp .miyabirules.example .miyabirules

# Edit to match your project
vim .miyabirules
```

### 2. Basic Example

```yaml
version: 1

rules:
  - name: "Use async-trait for traits"
    pattern: "trait.*\\{"
    suggestion: "Add #[async_trait] for async methods in traits"
    severity: "warning"
    enabled: true

agent_preferences:
  codegen:
    style: "idiomatic"
    error_handling: "thiserror"
    generate_tests: true
    generate_docs: true

  review:
    min_score: 85
    clippy_strict: true
    require_tests: true
```

### 3. Run Agents

Agents automatically load `.miyabirules` when executing:

```bash
# CodeGenAgent will use preferences from .miyabirules
miyabi agent codegen --issue 270

# ReviewAgent will apply min_score: 85 from .miyabirules
miyabi agent review --issue 270
```

## 🔧 API Usage

### Rust API

```rust
use miyabi_agent_core::RulesContext;
use std::path::PathBuf;

// Load rules from project root
let context = RulesContext::new(PathBuf::from("."));

// Check if rules are loaded
if context.has_rules() {
    // Get agent preferences
    let style = context.get_style("codegen");
    let min_score = context.get_min_score("review");

    // Format preferences for prompt injection
    let prompt_additions = context.format_preferences_for_prompt("codegen");
    println!("{}", prompt_additions);
}
```

## 🔗 Related

- **Issue #497**: Implement Cline learnings (Phase 2)
- **Cline's .clinerules**: https://github.com/cline/cline
- **RulesLoader API**: `crates/miyabi-core/src/rules.rs`
- **RulesContext API**: `crates/miyabi-agent-core/src/rules_context.rs`
- **Example file**: `.miyabirules.example`

---

**Implementation Status**: ✅ Complete (Issue #497 - Phase 2)  
**Last Updated**: 2025-10-24  
**Maintainer**: Claude Code (AI Assistant)
