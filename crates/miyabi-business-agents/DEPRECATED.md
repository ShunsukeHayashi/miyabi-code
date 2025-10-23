# ⚠️ DEPRECATED: miyabi-business-agents

**Status**: Deprecated as of v0.1.1
**Replacement**: `miyabi-agents/business` module
**Removal Target**: v0.2.0

---

## 📢 Deprecation Notice

The `miyabi-business-agents` crate has been **deprecated** and replaced by the unified `miyabi-agents` crate with the `business` module.

### Reasons for Deprecation

1. **Code Duplication**: AIEntrepreneurAgent and other business agents were implemented twice
2. **Architecture Inconsistency**: Direct Claude API usage instead of miyabi-llm abstraction layer
3. **Maintenance Burden**: Maintaining two separate implementations increased complexity
4. **Lack of Provider Flexibility**: No fallback chain for LLM providers (Mac mini LAN → Tailscale → Groq)

---

## 🔄 Migration Guide

### Before (Deprecated)

```rust
use miyabi_business_agents::strategy::ai_entrepreneur::AIEntrepreneurAgent;
use miyabi_business_agents::traits::BusinessAgent;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Old implementation with direct Claude API
    let agent = AIEntrepreneurAgent::new()?;
    let plan = agent.generate_business_plan(input).await?;
    Ok(())
}
```

### After (Recommended)

```rust
use miyabi_agents::business::ai_entrepreneur::AIEntrepreneurAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // New implementation with miyabi-llm abstraction
    let config = AgentConfig::default();
    let agent = AIEntrepreneurAgent::new(config);

    let task = Task::new("Generate business plan for AI startup");
    let result = agent.execute(&task).await?;

    Ok(())
}
```

---

## 🎯 Key Differences

| Feature | miyabi-business-agents (Old) | miyabi-agents (New) |
|---------|------------------------------|---------------------|
| **LLM Provider** | Claude API only | miyabi-llm (GPTOSSProvider) |
| **Fallback Chain** | ❌ None | ✅ Mac mini LAN → Tailscale → Groq |
| **Configuration** | Hardcoded | AgentConfig-driven |
| **Trait System** | Custom BusinessAgent trait | Unified BaseAgent trait |
| **Error Handling** | Custom errors | Unified MiyabiError |
| **Testing** | Limited mocking | Full LLM provider mocking |

---

## 📦 Affected Agents

The following 14 Business Agents have been migrated:

### Strategy Agents (6)
1. ✅ **AIEntrepreneurAgent** - 8-phase business planning
2. ✅ **ProductConceptAgent** - Product concept design
3. ✅ **ProductDesignAgent** - Product design specifications
4. ✅ **FunnelDesignAgent** - Customer funnel optimization
5. ✅ **PersonaAgent** - Target persona creation
6. ✅ **SelfAnalysisAgent** - Founder/team analysis

### Marketing Agents (5)
7. ✅ **MarketResearchAgent** - Market research & analysis
8. ✅ **MarketingAgent** - Marketing strategy
9. ✅ **ContentCreationAgent** - Content generation
10. ✅ **SNSStrategyAgent** - Social media strategy
11. ✅ **YouTubeAgent** - YouTube channel optimization

### Sales & Analytics Agents (3)
12. ✅ **SalesAgent** - Sales process optimization
13. ✅ **CRMAgent** - Customer relationship management
14. ✅ **AnalyticsAgent** - Data analysis & KPI tracking

---

## 🛠️ Migration Steps

### Step 1: Update Dependencies

**Cargo.toml**:
```toml
[dependencies]
# Remove old dependency
# miyabi-business-agents = "0.1.0"

# Add new dependency
miyabi-agents = { path = "../miyabi-agents", version = "0.1.1" }
miyabi-agent-core = { path = "../miyabi-agent-core", version = "0.1.1" }
```

### Step 2: Update Imports

Replace:
```rust
use miyabi_business_agents::strategy::ai_entrepreneur::AIEntrepreneurAgent;
use miyabi_business_agents::traits::BusinessAgent;
```

With:
```rust
use miyabi_agents::business::ai_entrepreneur::AIEntrepreneurAgent;
use miyabi_agent_core::BaseAgent;
```

### Step 3: Update Agent Initialization

Replace:
```rust
let agent = AIEntrepreneurAgent::new()?;
```

With:
```rust
let config = AgentConfig::default();
let agent = AIEntrepreneurAgent::new(config);
```

### Step 4: Update Execution Pattern

Replace:
```rust
let result = agent.generate_business_plan(input).await?;
```

With:
```rust
let task = Task::new("Generate business plan");
let result = agent.execute(&task).await?;
```

---

## 🔗 New Architecture Benefits

### 1. **LLM Provider Abstraction**
```rust
// Automatic fallback chain
let provider = GPTOSSProvider::new_mac_mini_lan()
    .or_else(|_| GPTOSSProvider::new_mac_mini_tailscale())
    .or_else(|_| GPTOSSProvider::new_groq(&groq_key))?;
```

### 2. **Unified Configuration**
```rust
let config = AgentConfig {
    max_retries: 3,
    timeout: Duration::from_secs(300),
    llm_provider: "groq",
    ..Default::default()
};
```

### 3. **Consistent Error Handling**
```rust
use miyabi_types::error::{MiyabiError, AgentError};

match agent.execute(&task).await {
    Ok(result) => println!("Success: {:?}", result),
    Err(MiyabiError::Agent(AgentError::LLMProviderUnavailable)) => {
        eprintln!("All LLM providers unavailable");
    }
    Err(e) => eprintln!("Error: {}", e),
}
```

---

## 📚 Documentation

- **New Implementation**: `crates/miyabi-agents/src/business/README.md`
- **API Reference**: [docs.rs/miyabi-agents](https://docs.rs/miyabi-agents)
- **Migration Examples**: `crates/miyabi-agents/examples/business/`

---

## ⏰ Timeline

- **v0.1.1** (Current): miyabi-business-agents deprecated, warnings added
- **v0.1.2**: Final migration window, deprecation warnings in CI
- **v0.2.0**: miyabi-business-agents removed from workspace

---

## 💬 Support

If you encounter issues during migration:

1. **Check Examples**: `crates/miyabi-agents/examples/business/`
2. **Read Docs**: `crates/miyabi-agents/src/business/README.md`
3. **Open Issue**: [GitHub Issues](https://github.com/ShunsukeHayashi/Miyabi/issues)

---

**Deprecated**: 2025-10-24
**Last Updated**: 2025-10-24
**Maintainer**: Claude Code
