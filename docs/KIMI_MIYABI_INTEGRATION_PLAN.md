# 🌙 Kimi CLI × Miyabi Integration Plan

**Version**: 1.0.0
**Date**: 2025-10-24
**Status**: 📋 Planning Phase
**Target Completion**: 2025-11-24 (4 weeks)

---

## 🎯 Executive Summary

This document outlines the comprehensive integration plan for incorporating Kimi CLI's architectural patterns into Miyabi's Adaptive Modes System. The integration will enhance Miyabi's configurability, tool management, and agent orchestration capabilities.

**Key Objectives**:
1. ✅ Extend YAML-based mode configuration with tool specifications
2. ✅ Implement dynamic prompt template system with variables
3. ✅ Add subagent task delegation framework
4. ✅ Create internal reasoning tools (Think, TodoList)
5. ✅ Maintain 100% Rust implementation (no Python dependencies)

---

## 📊 Current State Analysis

### Miyabi Architecture (As of 2025-10-24)

**Total Crates**: 25

| Category | Crates | Status |
|----------|--------|--------|
| **Core** | miyabi-types, miyabi-core | ✅ Stable |
| **Agents** | miyabi-agents, miyabi-agent-* (7 crates) | ✅ Stable |
| **Modes** | miyabi-modes | 🆕 Phase 1 Complete |
| **Infrastructure** | miyabi-cli, miyabi-worktree, miyabi-github | ✅ Stable |
| **LLM** | miyabi-llm | ✅ Stable |
| **Web** | miyabi-web-api, miyabi-webhook | ✅ Stable |
| **MCP** | miyabi-mcp-server, miyabi-discord-mcp-server | ✅ Stable |
| **Orchestration** | miyabi-orchestrator | ✅ Stable |
| **Testing** | miyabi-e2e-tests, miyabi-benchmark | ✅ Stable |

### miyabi-modes Current Schema (v0.1.0)

```yaml
slug: codegen
name: "🛠️ Code Generator"
character: "つくるん"
roleDefinition: "..."
whenToUse: "..."
groups:
  - read
  - edit
  - command
  - git
customInstructions: "..."
source: "miyabi-core"
fileRegex: ".*\\.rs$"
description: "..."
```

**Limitations**:
- ❌ No per-tool configuration (timeout, parameters)
- ❌ No template variable system (${MIYABI_*})
- ❌ No subagent delegation mechanism
- ❌ No internal reasoning tools

---

## 🏗️ Unified Configuration Schema (v2.0.0)

### Enhanced Mode Definition

```yaml
version: 2
slug: codegen
name: "🛠️ Code Generator"
character: "つくるん"

# Phase 1 fields (existing)
roleDefinition: |-
  You are Miyabi CodeGen Agent working in ${MIYABI_WORK_DIR}.

  Current time: ${MIYABI_NOW}

  Project structure:
  ```
  ${MIYABI_WORK_DIR_LS}
  ```

  Project documentation:
  ${MIYABI_AGENTS_MD}

whenToUse: "..."
source: "miyabi-core"
fileRegex: ".*\\.(rs|toml)$"
description: "..."

# Phase 2: Template Variables (Kimi-inspired)
systemPromptArgs:
  ROLE_ADDITIONAL: ""
  MAX_CONTEXT_LENGTH: "32000"

# Phase 3: Tool Configuration (Kimi-inspired)
tools:
  - name: bash
    module: "miyabi_tools::bash::Bash"
    enabled: true
    config:
      timeout_ms: 120000
      allowed_commands: ["cargo", "git", "rustfmt", "clippy"]
      working_dir: "${MIYABI_WORK_DIR}"

  - name: read_file
    module: "miyabi_tools::file::ReadFile"
    enabled: true
    config:
      max_lines: 2000
      allowed_extensions: [".rs", ".toml", ".md"]

  - name: write_file
    module: "miyabi_tools::file::WriteFile"
    enabled: true
    config:
      max_size_kb: 1024
      backup: true

  - name: grep
    module: "miyabi_tools::file::Grep"
    enabled: true
    config:
      output_mode: "content"
      context_lines: 3
      case_insensitive: false

  - name: git
    module: "miyabi_tools::git::Git"
    enabled: true
    config:
      allowed_operations: ["status", "diff", "add", "commit", "push"]

  - name: think
    module: "miyabi_tools::reasoning::Think"
    enabled: true
    config:
      log_level: "debug"

  - name: todo_list
    module: "miyabi_tools::task::TodoList"
    enabled: true
    config:
      max_items: 50

# Phase 4: Subagent Configuration (Kimi-inspired)
subagents:
  review:
    mode: "review"
    description: "Code quality review after generation"
    auto_trigger: true
    trigger_conditions:
      - event: "code_written"
        file_pattern: ".*\\.rs$"

  deployment:
    mode: "deployment"
    description: "Deploy to production after review passes"
    auto_trigger: false
    requires:
      - agent: "review"
        status: "success"
        min_score: 85

# Phase 5: Multi-Agent Security Review (from whitehack analysis)
security_review:
  enabled: true
  parallel_agents: 5
  roles:
    - name: "offensive_web"
      focus: ["sqli", "xss", "csrf"]
    - name: "offensive_auth"
      focus: ["jwt", "session", "oauth"]
    - name: "offensive_api"
      focus: ["rate_limit", "authorization"]
    - name: "defensive_review"
      focus: ["clippy", "audit", "unsafe"]
    - name: "defensive_mitigation"
      focus: ["fixes", "patches"]
```

---

## 📐 Architecture Design

### Phase 2 Schema: Rust Types

```rust
// crates/miyabi-modes/src/mode_v2.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Mode configuration v2.0 with Kimi CLI integration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MiyabiModeV2 {
    /// Schema version (always "2")
    pub version: u8,

    // Phase 1 fields (backward compatible)
    pub slug: String,
    pub name: String,
    pub character: String,

    #[serde(rename = "roleDefinition")]
    pub role_definition: String,

    #[serde(rename = "whenToUse")]
    pub when_to_use: String,

    pub source: String,

    #[serde(rename = "fileRegex", default, skip_serializing_if = "Option::is_none")]
    pub file_regex: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    // Phase 2: Template variables
    #[serde(rename = "systemPromptArgs", default)]
    pub system_prompt_args: HashMap<String, String>,

    // Phase 3: Tool configuration
    #[serde(default)]
    pub tools: Vec<ToolConfig>,

    // Phase 4: Subagent configuration
    #[serde(default)]
    pub subagents: HashMap<String, SubagentConfig>,

    // Phase 5: Multi-agent security review
    #[serde(rename = "securityReview", default, skip_serializing_if = "Option::is_none")]
    pub security_review: Option<SecurityReviewConfig>,
}

/// Tool configuration with parameters
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ToolConfig {
    pub name: String,
    pub module: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub config: serde_json::Value,
}

/// Subagent delegation configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SubagentConfig {
    pub mode: String,
    pub description: String,
    #[serde(rename = "autoTrigger", default)]
    pub auto_trigger: bool,
    #[serde(rename = "triggerConditions", default)]
    pub trigger_conditions: Vec<TriggerCondition>,
    #[serde(default)]
    pub requires: Vec<AgentDependency>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TriggerCondition {
    pub event: String,
    #[serde(rename = "filePattern", default)]
    pub file_pattern: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AgentDependency {
    pub agent: String,
    pub status: String,
    #[serde(rename = "minScore", default)]
    pub min_score: Option<u8>,
}

/// Multi-agent security review configuration
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SecurityReviewConfig {
    pub enabled: bool,
    #[serde(rename = "parallelAgents")]
    pub parallel_agents: usize,
    pub roles: Vec<SecurityRole>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SecurityRole {
    pub name: String,
    pub focus: Vec<String>,
}

fn default_true() -> bool {
    true
}

/// Backward compatibility: Convert v1 to v2
impl From<crate::mode::MiyabiMode> for MiyabiModeV2 {
    fn from(v1: crate::mode::MiyabiMode) -> Self {
        Self {
            version: 2,
            slug: v1.slug,
            name: v1.name,
            character: v1.character,
            role_definition: v1.role_definition,
            when_to_use: v1.when_to_use,
            source: v1.source,
            file_regex: v1.file_regex,
            description: v1.description,
            system_prompt_args: HashMap::new(),
            tools: Vec::new(), // Will be populated from groups
            subagents: HashMap::new(),
            security_review: None,
        }
    }
}
```

---

## 🚀 Implementation Phases

### Phase 2.1: Template Variable System (Week 1)

**Deliverables**:
- [ ] `crates/miyabi-modes/src/template.rs` - Variable renderer
- [ ] Support for `${MIYABI_NOW}`, `${MIYABI_WORK_DIR}`, `${MIYABI_WORK_DIR_LS}`, `${MIYABI_AGENTS_MD}`
- [ ] Integration tests with mock file system
- [ ] CLI command: `miyabi mode render <slug>`

**Code Structure**:
```rust
// crates/miyabi-modes/src/template.rs
pub struct TemplateRenderer {
    work_dir: PathBuf,
    cache: Arc<RwLock<HashMap<String, String>>>,
}

impl TemplateRenderer {
    pub fn render(&self, template: &str, args: &HashMap<String, String>) -> Result<String> {
        let mut rendered = template.to_string();

        // Built-in variables
        rendered = self.replace_builtin_vars(&rendered)?;

        // Custom variables from systemPromptArgs
        for (key, value) in args {
            rendered = rendered.replace(&format!("${{{}}}", key), value);
        }

        Ok(rendered)
    }

    fn replace_builtin_vars(&self, template: &str) -> Result<String> {
        let now = chrono::Utc::now().to_rfc3339();
        let work_dir = self.work_dir.display().to_string();
        let work_dir_ls = self.get_cached_ls()?;
        let agents_md = self.get_cached_agents_md()?;

        Ok(template
            .replace("${MIYABI_NOW}", &now)
            .replace("${MIYABI_WORK_DIR}", &work_dir)
            .replace("${MIYABI_WORK_DIR_LS}", &work_dir_ls)
            .replace("${MIYABI_AGENTS_MD}", &agents_md))
    }
}
```

**Testing**:
```rust
#[tokio::test]
async fn test_template_rendering() {
    let template = "Working in ${MIYABI_WORK_DIR} at ${MIYABI_NOW}";
    let renderer = TemplateRenderer::new(Path::new("/tmp/test"));
    let rendered = renderer.render(template, &HashMap::new()).unwrap();

    assert!(rendered.contains("/tmp/test"));
    assert!(rendered.contains("2025-"));
}
```

---

### Phase 2.2: Tool Configuration System (Week 2)

**Deliverables**:
- [ ] `crates/miyabi-modes/src/tool_config.rs` - Tool loader
- [ ] Dynamic tool instantiation from YAML
- [ ] Tool parameter validation
- [ ] CLI command: `miyabi mode tools <slug>`

**Code Structure**:
```rust
// crates/miyabi-modes/src/tool_config.rs
pub struct ToolLoader {
    registry: Arc<RwLock<HashMap<String, Box<dyn Tool>>>>,
}

impl ToolLoader {
    pub fn load_tool(&self, config: &ToolConfig) -> Result<Box<dyn Tool>> {
        if !config.enabled {
            return Err(ModeError::ToolDisabled(config.name.clone()));
        }

        // Dynamic loading based on module path
        match config.module.as_str() {
            "miyabi_tools::bash::Bash" => {
                let tool = BashTool::from_config(&config.config)?;
                Ok(Box::new(tool))
            }
            "miyabi_tools::file::ReadFile" => {
                let tool = ReadFileTool::from_config(&config.config)?;
                Ok(Box::new(tool))
            }
            // ... more tools
            _ => Err(ModeError::UnknownTool(config.module.clone())),
        }
    }
}

/// Unified tool trait
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn execute(&self, params: &serde_json::Value) -> Result<ToolOutput>;
}
```

---

### Phase 2.3: Subagent Delegation (Week 3)

**Deliverables**:
- [ ] `crates/miyabi-agents/src/tools/task.rs` - Task delegation
- [ ] Worktree-isolated subagent execution
- [ ] Event-driven auto-trigger system
- [ ] CLI command: `miyabi mode delegate <parent-slug> <sub-slug> --task "..."`

**Code Structure**:
```rust
// crates/miyabi-agents/src/tools/task.rs
pub struct TaskDelegationTool {
    registry: Arc<ModeRegistry>,
    worktree_manager: Arc<WorktreeManager>,
    event_bus: Arc<EventBus>,
}

impl TaskDelegationTool {
    pub async fn delegate(
        &self,
        subagent_slug: &str,
        task: &str,
        parent_context: &Context,
    ) -> Result<DelegationResult> {
        // 1. Load subagent mode
        let mode = self.registry.get(subagent_slug)?;

        // 2. Create isolated worktree
        let worktree = self.worktree_manager
            .create_temp(&format!("subagent-{}", subagent_slug))
            .await?;

        // 3. Execute subagent
        let result = self.execute_in_worktree(&mode, task, &worktree, parent_context).await?;

        // 4. Emit completion event
        self.event_bus.emit(Event::SubagentCompleted {
            slug: subagent_slug.to_string(),
            result: result.clone(),
        }).await?;

        // 5. Cleanup
        self.worktree_manager.remove(&worktree).await?;

        Ok(result)
    }
}
```

---

### Phase 2.4: Internal Reasoning Tools (Week 3)

**Deliverables**:
- [ ] `crates/miyabi-agents/src/tools/think.rs` - Internal reasoning
- [ ] `crates/miyabi-agents/src/tools/todo.rs` - Enhanced TodoList
- [ ] Integration with tracing for reasoning logs
- [ ] CLI command: `miyabi mode trace <slug>`

**Code Structure**:
```rust
// crates/miyabi-agents/src/tools/think.rs
pub struct ThinkTool;

impl Tool for ThinkTool {
    fn name(&self) -> &str {
        "think"
    }

    fn execute(&self, params: &serde_json::Value) -> Result<ToolOutput> {
        let thoughts = params["thoughts"].as_str()
            .ok_or(ToolError::MissingParameter("thoughts"))?;

        // Log to tracing with special target
        tracing::info!(target: "agent_reasoning", "{}", thoughts);

        Ok(ToolOutput::success(json!({
            "recorded": true,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        })))
    }
}
```

---

### Phase 2.5: Multi-Agent Security Review (Week 4)

**Deliverables**:
- [ ] `crates/miyabi-modes/src/security.rs` - Security review orchestration
- [ ] 5-agent parallel execution framework
- [ ] Consensus matrix generation
- [ ] Security report template
- [ ] Mode: `.miyabi/modes/system/security-review.yaml`

**Code Structure**:
```rust
// crates/miyabi-modes/src/security.rs
pub struct SecurityReviewOrchestrator {
    config: SecurityReviewConfig,
    llm: Arc<LlmClient>,
    event_bus: Arc<EventBus>,
}

impl SecurityReviewOrchestrator {
    pub async fn run_parallel_review(&self, target: &Path) -> Result<SecurityReport> {
        let mut agents = Vec::new();

        // Create 5 specialized agents
        for role in &self.config.roles {
            let agent = self.create_security_agent(role).await?;
            agents.push(agent);
        }

        // Execute in parallel
        let mut tasks = JoinSet::new();
        for agent in agents {
            let target = target.to_path_buf();
            tasks.spawn(async move {
                agent.execute(&target).await
            });
        }

        // Collect results
        let mut results = Vec::new();
        while let Some(res) = tasks.join_next().await {
            results.push(res??);
        }

        // Generate consensus
        self.generate_consensus_report(results).await
    }
}
```

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Configuration Flexibility** | +200% | Number of customizable parameters |
| **Mode Loading Time** | < 50ms | Benchmark test |
| **Tool Instantiation** | < 10ms per tool | Unit test |
| **Template Rendering** | < 5ms | Unit test |
| **Subagent Delegation** | < 500ms overhead | Integration test |
| **Security Review Coverage** | > 90% | Vulnerability detection rate |
| **Backward Compatibility** | 100% | v1 modes still work |
| **Test Coverage** | > 90% | cargo-tllvm-cov |
| **Documentation** | 100% | All public APIs documented |

---

## 🧪 Validation Criteria

### Phase 2.1: Template System
- [ ] All built-in variables render correctly
- [ ] Custom variables from `systemPromptArgs` work
- [ ] AGENTS.md file is parsed and cached
- [ ] `ls -la` output is cached and refreshed

### Phase 2.2: Tool Configuration
- [ ] Tools load dynamically from YAML
- [ ] Tool parameters are validated
- [ ] Disabled tools are skipped
- [ ] Unknown tools throw clear errors

### Phase 2.3: Subagent Delegation
- [ ] Subagents execute in isolated worktrees
- [ ] Parent context is passed correctly
- [ ] Events trigger auto-delegation
- [ ] Dependencies are resolved in order

### Phase 2.4: Internal Reasoning
- [ ] Think tool logs are captured
- [ ] TodoList maintains state across calls
- [ ] Reasoning logs appear in trace output

### Phase 2.5: Security Review
- [ ] 5 agents execute in parallel
- [ ] Consensus matrix is generated
- [ ] Vulnerabilities are ranked by severity
- [ ] Report is formatted in Markdown

---

## 📅 Timeline & Milestones

```
Week 1 (2025-10-25 to 2025-10-31):
├── Phase 2.1 Start: Template Variable System
├── Milestone M1: Template rendering works
└── PR #1: Template system implementation

Week 2 (2025-11-01 to 2025-11-07):
├── Phase 2.2 Start: Tool Configuration System
├── Milestone M2: Dynamic tool loading works
└── PR #2: Tool configuration implementation

Week 3 (2025-11-08 to 2025-11-14):
├── Phase 2.3 Start: Subagent Delegation
├── Phase 2.4 Start: Internal Reasoning Tools
├── Milestone M3: Subagent delegation works
├── Milestone M4: Think and TodoList tools work
└── PR #3: Delegation and reasoning tools

Week 4 (2025-11-15 to 2025-11-24):
├── Phase 2.5 Start: Multi-Agent Security Review
├── Integration Testing
├── Documentation
├── Milestone M5: Security review orchestration works
├── Milestone M6: All tests pass
└── PR #4: Security review + final integration
```

---

## 🎯 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Backward incompatibility** | Low | High | Maintain v1 schema support |
| **Performance degradation** | Medium | Medium | Aggressive caching, benchmarking |
| **Tool loading errors** | Medium | High | Clear error messages, fallback |
| **Subagent deadlock** | Low | High | Timeout mechanisms, circuit breaker |
| **Security review false positives** | High | Low | Consensus threshold (3/5 agents) |
| **Complex YAML configs** | High | Medium | Validation, examples, CLI help |

---

## 📚 Documentation Plan

### User Documentation
- [ ] **Getting Started**: Mode configuration guide
- [ ] **Tutorial**: Creating custom tools
- [ ] **Reference**: All configuration options
- [ ] **Examples**: 10+ real-world mode configs
- [ ] **Migration Guide**: v1 to v2 upgrade path

### Developer Documentation
- [ ] **Architecture**: System design overview
- [ ] **API Reference**: All public APIs
- [ ] **Contributing**: Code style, testing
- [ ] **Troubleshooting**: Common issues

---

## 💰 Resource Estimation

| Phase | Effort (hours) | Complexity |
|-------|---------------|------------|
| Phase 2.1: Templates | 16h | Medium |
| Phase 2.2: Tool Config | 24h | High |
| Phase 2.3: Delegation | 20h | High |
| Phase 2.4: Reasoning | 12h | Low |
| Phase 2.5: Security | 28h | High |
| **Total** | **100h** | |

**Team**: 1 Senior Rust Developer (25h/week) = 4 weeks

---

## 🎊 Conclusion

This integration plan combines the best of Kimi CLI's configurability with Miyabi's Rust-native performance and safety. Upon completion, Miyabi will have:

1. ✅ **Most flexible agent configuration** in the Rust ecosystem
2. ✅ **Industry-leading security review** capabilities
3. ✅ **Best-in-class developer experience** with clear YAML configs
4. ✅ **100% Rust implementation** - no Python dependencies

**Next Step**: Begin Phase 2.1 implementation (Template Variable System)

---

**Approved By**: [Pending]
**Last Updated**: 2025-10-24
