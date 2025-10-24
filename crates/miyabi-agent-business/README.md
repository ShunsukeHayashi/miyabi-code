# miyabi-agent-business

**14 specialized AI agents for business strategy, marketing, and operations in the Miyabi framework.**

[![Crates.io](https://img.shields.io/crates/v/miyabi-agent-business.svg)](https://crates.io/crates/miyabi-agent-business)
[![Documentation](https://docs.rs/miyabi-agent-business/badge.svg)](https://docs.rs/miyabi-agent-business)
[![License](https://img.shields.io/crates/l/miyabi-agent-business.svg)](../../LICENSE)

## 📋 Overview

`miyabi-agent-business` provides a comprehensive suite of 14 AI-powered business agents that cover the entire startup lifecycle, from ideation and strategy to marketing execution and customer operations. Each agent leverages LLM capabilities (via `miyabi-llm`) to generate data-driven insights, strategic plans, and actionable recommendations.

**Key Capabilities**:
- 🚀 **End-to-End Business Automation**: From self-analysis to scaling strategies
- 🧠 **LLM-Powered Decision Making**: GPT-OSS-20B integration for intelligent insights
- 📊 **Data-Driven Strategies**: Market research, competitor analysis, and analytics
- 🎯 **Target Audience Optimization**: Persona development and funnel design
- 📈 **Growth Focus**: Marketing, sales, CRM, and analytics for sustainable growth
- 💼 **Professional-Grade Output**: JSON-structured reports ready for implementation

## 🤖 14 Agents Overview

### 🎯 Strategy Agents (6)

| Agent | Purpose | Output |
|-------|---------|--------|
| **AIEntrepreneurAgent** | 8-phase comprehensive business plan | Business plan, funding strategy, financial projections |
| **ProductConceptAgent** | Product concept and business model design | USP, revenue model, business model canvas |
| **ProductDesignAgent** | Service detail design and technical stack | 6-month roadmap, MVP definition, tech stack |
| **FunnelDesignAgent** | Customer journey optimization (認知→購入→LTV) | Conversion funnel, touchpoint mapping |
| **PersonaAgent** | Target customer persona creation (3-5 personas) | Detailed personas, customer journey maps |
| **SelfAnalysisAgent** | Career, skills, and achievements analysis | Skill matrix, career trajectory, strengths |

### 📢 Marketing Agents (5)

| Agent | Purpose | Output |
|-------|---------|--------|
| **MarketResearchAgent** | Market trend analysis (20+ competitors) | TAM/SAM/SOM, competitor landscape, trends |
| **MarketingAgent** | Marketing strategy (Ads, SEO, SNS) | Go-to-market plan, budget allocation |
| **ContentCreationAgent** | Content production (blog, video, tutorials) | Editorial calendar, content themes |
| **SNSStrategyAgent** | Social media strategy (Twitter/Instagram/LinkedIn) | Posting calendar, engagement tactics |
| **YouTubeAgent** | YouTube channel optimization (13 workflows) | Content plan, SEO strategy, monetization |

### 💼 Operations Agents (3)

| Agent | Purpose | Output |
|-------|---------|--------|
| **SalesAgent** | Sales process optimization (Lead→Customer) | Sales funnel, conversion tactics |
| **CRMAgent** | Customer relationship management (LTV maximization) | Customer success plan, churn reduction |
| **AnalyticsAgent** | Data analysis and PDCA cycle | KPI dashboards, growth metrics, A/B test plans |

## 🚀 Features

### LLM Integration
- **Multi-Provider Fallback**: LAN → Tailscale → Groq API (resilient)
- **Structured JSON Output**: All agents return JSON-formatted responses
- **Contextual Prompts**: Task-specific prompt templates for each agent
- **Conversation History**: Multi-turn conversations for iterative refinement

### Business Strategy
- **8-Phase Business Planning**: Market analysis → Financial projections → Funding strategy
- **Competitive Intelligence**: Analyze 20+ competitors with SWOT analysis
- **Revenue Modeling**: Subscription, freemium, transaction-based models
- **Risk Assessment**: Identify and mitigate business risks

### Marketing Automation
- **Multi-Channel Strategy**: SEO, PPC, social media, content marketing
- **Audience Segmentation**: Behavioral, demographic, and psychographic targeting
- **Content Calendar**: 6-month editorial calendar with themes and KPIs
- **Performance Tracking**: CAC, LTV, NRR, churn rate monitoring

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-agent-business = "0.1.0"
```

Or install the CLI:

```bash
cargo install miyabi-cli
```

## 🔧 Usage

### AIEntrepreneurAgent Example

```rust
use miyabi_agent_business::AIEntrepreneurAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task, TaskType};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = AgentConfig {
        device_identifier: "macbook-pro".to_string(),
        ..Default::default()
    };

    let entrepreneur = AIEntrepreneurAgent::new(config);

    let task = Task {
        id: "task-001".to_string(),
        title: "AI-powered code review SaaS".to_string(),
        description: "Target market: Developer teams (10-100 engineers)".to_string(),
        task_type: TaskType::Feature,
        ..Default::default()
    };

    // Generates 8-phase business plan:
    // 1. Executive Summary
    // 2. Market Analysis (TAM/SAM/SOM)
    // 3. Competitive Landscape (20+ competitors)
    // 4. Product Strategy (MVP roadmap)
    // 5. Revenue Model (Subscription pricing)
    // 6. Financial Projections (5-year forecast)
    // 7. Funding Strategy (Seed → Series A)
    // 8. Risk Analysis & Mitigation

    let result = entrepreneur.execute(&task).await?;

    if let Some(data) = result.data {
        let business_plan: serde_json::Value = serde_json::from_value(data)?;
        println!("Business Plan Generated:");
        println!("{}", serde_json::to_string_pretty(&business_plan)?);
    }

    Ok(())
}
```

### YouTubeAgent Example

```rust
use miyabi_agent_business::YouTubeAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = AgentConfig::default();
    let youtube_agent = YouTubeAgent::new(config);

    let task = Task {
        id: "youtube-001".to_string(),
        title: "Rust Tutorial Channel".to_string(),
        description: "Target audience: Junior to mid-level Rust developers".to_string(),
        ..Default::default()
    };

    // Generates comprehensive YouTube strategy:
    // - Channel concept and branding
    // - Content pillar topics (tutorials, live coding, project walkthroughs)
    // - SEO keywords and tags
    // - Thumbnail design principles
    // - Publishing schedule (2x/week)
    // - Monetization strategy (AdSense + sponsorships)
    // - Engagement tactics (comments, community posts)
    // - Analytics tracking (CTR, watch time, subscriber growth)

    let result = youtube_agent.execute(&task).await?;

    println!("YouTube Strategy: {:?}", result.data);
    Ok(())
}
```

### MarketResearchAgent Example

```rust
use miyabi_agent_business::MarketResearchAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = AgentConfig::default();
    let market_research = MarketResearchAgent::new(config);

    let task = Task {
        id: "market-001".to_string(),
        title: "AI Code Review Market Analysis".to_string(),
        description: "Analyze market for automated code review tools".to_string(),
        ..Default::default()
    };

    // Generates market research report:
    // - TAM/SAM/SOM calculation ($10B / $1B / $50M)
    // - Competitor analysis (20+ companies)
    //   - GitHub Copilot, Tabnine, CodeRabbit, Sourcery, SonarQube, etc.
    // - Market trends (AI adoption, remote work, DevSecOps)
    // - Customer needs assessment (pain points, willingness to pay)
    // - Growth opportunities (enterprise sales, API integrations)

    let result = market_research.execute(&task).await?;

    println!("Market Research: {:?}", result.data);
    Ok(())
}
```

## 📊 Agent Output Formats

All agents return structured JSON for easy integration:

### AIEntrepreneurAgent Output
```json
{
  "business_plan": {
    "executive_summary": "...",
    "market_analysis": {
      "tam": 10000000000,
      "sam": 1000000000,
      "som": 50000000,
      "trends": ["AI adoption", "DevOps automation"]
    },
    "competitive_landscape": [...],
    "product_strategy": {...},
    "revenue_model": {
      "pricing_tiers": ["Free", "Pro ($49/mo)", "Enterprise ($299/mo)"],
      "target_arr": 5000000
    },
    "financial_projections": {...},
    "funding_strategy": {...},
    "risk_analysis": [...]
  }
}
```

### PersonaAgent Output
```json
{
  "personas": [
    {
      "name": "Tech Lead Tom",
      "age": 35,
      "role": "Engineering Manager",
      "company_size": "50-200 employees",
      "pain_points": ["Code review bottlenecks", "Onboarding new developers"],
      "goals": ["Ship faster", "Improve code quality"],
      "tech_stack": ["Python", "Go", "React"],
      "budget": "$500-2000/month",
      "decision_criteria": ["Integration ease", "Accuracy", "Speed"]
    }
  ]
}
```

## 🏗️ Architecture

### LLM Interaction Flow

```
Task → Agent → LLMContext
                  ↓
            LLMConversation
                  ↓
         LLMPromptTemplate
                  ↓
    GPTOSSProvider (Fallback Chain)
      ├── Mac Mini LAN (primary)
      ├── Mac Mini Tailscale (backup)
      └── Groq API (fallback)
                  ↓
            JSON Response
                  ↓
        Structured Business Data
```

### Common Agent Pattern

```rust
async fn generate_strategy(&self, task: &Task) -> Result<StrategyOutput> {
    // 1. Initialize LLM provider with fallback
    let provider = GPTOSSProvider::new_mac_mini_lan()
        .or_else(|_| GPTOSSProvider::new_mac_mini_tailscale())
        .or_else(|_| {
            let groq_key = env::var("GROQ_API_KEY")?;
            GPTOSSProvider::new_groq(&groq_key)
        })?;

    // 2. Create context from task
    let context = LLMContext::from_task(task);

    // 3. Create conversation with prompt template
    let mut conversation = LLMConversation::new(Box::new(provider), context);
    let template = LLMPromptTemplate::new(
        "You are a [role] with [expertise]...",
        "Generate [output] as JSON...",
        ResponseFormat::Json { schema: None },
    );

    // 4. Execute and parse response
    let response = conversation.ask_with_template(&template).await?;
    let strategy: StrategyOutput = serde_json::from_str(&response)?;

    Ok(strategy)
}
```

## 🧪 Testing

```bash
# Run all tests
cargo test --package miyabi-agent-business

# Test specific agent
cargo test --package miyabi-agent-business ai_entrepreneur
cargo test --package miyabi-agent-business youtube
cargo test --package miyabi-agent-business market_research

# Integration tests (requires LLM access)
GROQ_API_KEY=xxx cargo test --package miyabi-agent-business --test integration
```

## 🔗 Dependencies

- **Core**: `miyabi-agent-core`, `miyabi-types`, `miyabi-core`
- **LLM**: `miyabi-llm` (GPT-OSS-20B integration)
- **Runtime**: `tokio`, `async-trait`
- **Serialization**: `serde`, `serde_json`
- **Utilities**: `chrono`, `thiserror`, `tracing`

## 📚 Related Crates

- [`miyabi-llm`](../miyabi-llm) - LLM abstraction layer (GPT-OSS-20B, Groq, vLLM, Ollama)
- [`miyabi-agent-coordinator`](../miyabi-agent-coordinator) - Task orchestration
- [`miyabi-agent-codegen`](../miyabi-agent-codegen) - AI-powered code generation
- [`miyabi-types`](../miyabi-types) - Shared type definitions
- [`miyabi-agent-core`](../miyabi-agent-core) - Base agent traits

## 🎯 Use Cases

### Startup Founders
- **Self-Analysis**: Identify strengths and gaps
- **Market Research**: Validate product-market fit
- **Business Planning**: Comprehensive 8-phase plan
- **Funding Strategy**: Pitch deck and financial projections

### Product Managers
- **Product Concept**: Define USP and value proposition
- **Persona Development**: Deep customer understanding
- **Funnel Design**: Optimize conversion rates
- **Content Strategy**: Plan editorial calendar

### Marketing Teams
- **Go-to-Market**: Launch strategy and channel mix
- **Content Creation**: 6-month content roadmap
- **Social Media**: Multi-platform posting calendar
- **Analytics**: Track CAC, LTV, NRR, churn

### Sales & CS Teams
- **Sales Process**: Optimize lead-to-customer conversion
- **CRM Strategy**: Maximize customer lifetime value
- **Churn Reduction**: Proactive customer success
- **Upselling**: Identify expansion opportunities

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

## 🔖 Version History

- **v0.1.0** (2025-10-25): Initial release
  - 14 business agents (6 strategy, 5 marketing, 3 operations)
  - LLM integration via `miyabi-llm`
  - JSON-structured output for all agents
  - Multi-provider fallback (LAN → Tailscale → Groq)

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform
