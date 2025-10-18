# Miyabi Business Agents - Usage Guide

**14 AI Business Automation Agents for SaaS Operations**

This guide explains how to use Miyabi Business Agents to generate comprehensive business plans, marketing strategies, and sales automation.

---

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-business-agents = "1.0.0"
```

---

## 🔑 API Key Setup

Miyabi Business Agents use Anthropic's Claude API. Set your API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

You can obtain an API key from: https://console.anthropic.com/

---

## 🚀 Quick Start Example

### AIEntrepreneurAgent (8-Phase Business Plan)

```rust
use miyabi_business_agents::strategy::AIEntrepreneurAgent;
use miyabi_business_agents::types::BusinessInput;
use miyabi_business_agents::traits::BusinessAgent;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Create agent
    let agent = AIEntrepreneurAgent::new()?;

    // Prepare input
    let input = BusinessInput {
        industry: "SaaS".to_string(),
        target_market: "SMB developers".to_string(),
        budget: 100_000,
        geography: Some("North America".to_string()),
        timeframe_months: Some(12),
        context: Some("AI-powered DevOps automation platform".to_string()),
    };

    // Generate business plan
    let plan = agent.generate_plan(&input).await?;

    // Display results
    println!("Title: {}", plan.title);
    println!("Summary: {}", plan.summary);
    println!("Recommendations: {}", plan.recommendations.len());
    println!("KPIs: {}", plan.kpis.len());

    // Validate plan quality
    let validation = agent.validate_output(&plan).await?;
    println!("Quality Score: {}/100", validation.quality_score);

    Ok(())
}
```

---

## 📊 Available Agents

### Strategy & Planning Agents (6)

#### 1. AIEntrepreneurAgent
**8-Phase Business Plan Generator**
```rust
use miyabi_business_agents::strategy::AIEntrepreneurAgent;

let agent = AIEntrepreneurAgent::new()?;
```

**Generates**:
- Phase 1: Market Opportunity Analysis (TAM/SAM/SOM)
- Phase 2: Value Proposition Design
- Phase 3: Business Model Canvas
- Phase 4: Go-to-Market Strategy
- Phase 5: Financial Projections (3-year)
- Phase 6: Team & Organization
- Phase 7: Risk Assessment
- Phase 8: Implementation Roadmap

**Use Cases**: Startup pitch decks, investor presentations, strategic planning

---

#### 2. ProductConceptAgent
**MVP Design & Product Strategy**
```rust
use miyabi_business_agents::strategy::ProductConceptAgent;

let agent = ProductConceptAgent::new()?;
```

**Generates**:
- MVP feature prioritization (must-have vs nice-to-have)
- Value proposition design
- Differentiation strategy
- Success metrics & KPIs
- 90-day product roadmap

**Use Cases**: MVP planning, product launches, feature prioritization

---

#### 3. ProductDesignAgent
**Technical Architecture & Specifications**
```rust
use miyabi_business_agents::strategy::ProductDesignAgent;

let agent = ProductDesignAgent::new()?;
```

**Generates**:
- Frontend architecture (React/Vue/Svelte)
- Backend architecture (Node/Python/Rust/Go)
- Database schema design
- API design (REST/GraphQL/gRPC)
- Development roadmap with sprints

**Use Cases**: Technical planning, architecture reviews, sprint planning

---

#### 4. FunnelDesignAgent
**AARRR Metrics & Conversion Optimization**
```rust
use miyabi_business_agents::strategy::FunnelDesignAgent;

let agent = FunnelDesignAgent::new()?;
```

**Generates**:
- Acquisition: Customer acquisition channels & CAC targets
- Activation: Onboarding flow optimization
- Retention: Engagement loops & churn prevention
- Referral: Viral mechanisms & K-factor targets
- Revenue: Pricing strategy & LTV optimization

**Use Cases**: Growth hacking, conversion optimization, pirate metrics analysis

---

#### 5. PersonaAgent
**Customer Persona & Segmentation**
```rust
use miyabi_business_agents::strategy::PersonaAgent;

let agent = PersonaAgent::new()?;
```

**Generates**:
- Demographics & psychographics (3-5 personas)
- Behavioral patterns & technology adoption
- Needs & pain points (JTBD framework)
- Customer journey mapping
- Segmentation strategy & prioritization

**Use Cases**: Marketing campaigns, product positioning, customer research

---

#### 6. SelfAnalysisAgent
**SWOT Analysis & Business Strategy**
```rust
use miyabi_business_agents::strategy::SelfAnalysisAgent;

let agent = SelfAnalysisAgent::new()?;
```

**Generates**:
- SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
- Skill inventory & capability assessment
- Resource evaluation (financial, human, technology)
- Risk tolerance assessment
- Strategic recommendations (short/medium/long-term)

**Use Cases**: Strategic planning, self-assessment, capability analysis

---

### Marketing Agents (5)

#### 7. MarketResearchAgent
**Market Analysis & Competitive Intelligence**
```rust
use miyabi_business_agents::marketing::MarketResearchAgent;

let agent = MarketResearchAgent::new()?;
```

**Generates**:
- Market size estimation (TAM/SAM/SOM)
- Competitive landscape analysis
- Industry trends & growth projections
- Customer needs analysis
- Market entry strategy

**Use Cases**: Market research, competitive analysis, industry reports

---

#### 8. MarketingStrategyAgent
**Marketing Strategy & Campaign Planning**
```rust
use miyabi_business_agents::marketing::MarketingStrategyAgent;

let agent = MarketingStrategyAgent::new()?;
```

**Generates**:
- Marketing Mix (4Ps: Product, Price, Place, Promotion)
- Campaign planning (objectives, audience, messaging, creative)
- Channel strategy (digital/traditional with budget allocation)
- Brand positioning & messaging hierarchy
- Acquisition & retention marketing

**Use Cases**: Marketing campaigns, brand positioning, channel strategy

---

#### 9. ContentCreationAgent
**Content Strategy & Production Planning**
```rust
use miyabi_business_agents::marketing::ContentCreationAgent;

let agent = ContentCreationAgent::new()?;
```

**Generates**:
- Content types (blog, whitepaper, case study, video, infographic)
- Content calendar and publishing schedule
- SEO optimization and keyword strategy
- Content distribution and amplification
- Content performance metrics and analytics

**Use Cases**: Blog strategy, lead magnets, thought leadership content

---

#### 10. SNSStrategyAgent
**Social Media Strategy & Operations**
```rust
use miyabi_business_agents::marketing::SNSStrategyAgent;

let agent = SNSStrategyAgent::new()?;
```

**Generates**:
- Platform selection and optimization (Twitter, LinkedIn, GitHub, Reddit)
- Content strategy per platform
- Community management and engagement
- Influencer partnerships and campaigns
- Social media advertising and paid promotion

**Use Cases**: Social media marketing, community building, developer advocacy

---

#### 11. YouTubeAgent
**YouTube Strategy & Video Content Planning**
```rust
use miyabi_business_agents::marketing::YouTubeAgent;

let agent = YouTubeAgent::new()?;
```

**Generates**:
- Channel optimization and branding
- Video content strategy and series planning
- SEO and keyword optimization for YouTube
- Video production workflow and equipment
- Monetization and growth strategies

**Use Cases**: YouTube channel growth, video marketing, educational content

---

### Sales Agents (3)

#### 12. SalesStrategyAgent
**Sales Strategy & Process Optimization**
```rust
use miyabi_business_agents::sales::SalesStrategyAgent;

let agent = SalesStrategyAgent::new()?;
```

**Generates**:
- Sales funnel design and optimization (TOFU/MOFU/BOFU)
- Sales process automation and workflows
- Sales team structure and hiring (SDR/AE/CSM)
- Sales enablement and training
- Sales forecasting and pipeline management

**Use Cases**: B2B SaaS sales, sales operations, revenue optimization

---

#### 13. CRMAgent
**Customer Relationship Management & Segmentation**
```rust
use miyabi_business_agents::sales::CRMAgent;

let agent = CRMAgent::new()?;
```

**Generates**:
- Customer segmentation and persona targeting
- Lifecycle marketing and engagement
- Retention and churn prevention strategies
- Customer success workflows
- CRM data management and hygiene

**Use Cases**: Customer retention, lifecycle marketing, churn reduction

---

#### 14. AnalyticsAgent
**Data Analytics & Business Intelligence**
```rust
use miyabi_business_agents::sales::AnalyticsAgent;

let agent = AnalyticsAgent::new()?;
```

**Generates**:
- Data warehouse and ETL architecture
- KPI dashboards and reporting
- Predictive analytics and forecasting
- A/B testing and experimentation
- Data-driven decision making culture

**Use Cases**: BI dashboards, data infrastructure, predictive analytics

---

## 🎬 Running the Example

Run the AIEntrepreneurAgent demo:

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# Run example (from miyabi-business-agents directory)
cargo run --example ai_entrepreneur_demo

# Or from workspace root
cargo run -p miyabi-business-agents --example ai_entrepreneur_demo
```

**Expected Output**:
```
🌸 Miyabi AIEntrepreneurAgent Demo
============================================================

📦 Creating AIEntrepreneurAgent...
   Agent Type: ai-entrepreneur
   Description: Generates comprehensive 8-phase business plans
   Estimated Duration: 45 seconds

📋 Preparing Business Input...
   Industry: SaaS
   Target Market: AI開発者向け自動化ツール
   Budget: $100,000
   Geography: 日本・北米
   Timeframe: 12 months

🚀 Generating 8-Phase Business Plan...
   (This may take 30-45 seconds)

✅ Business Plan Generated!
============================================================

📊 **AI-Powered DevOps Automation Platform - Business Plan**

## Executive Summary

[Generated 2-3 paragraph summary...]

## Recommendations (8)

1. **Market Entry Strategy** (Priority: 1)
   Description: Launch with GitHub-native integration...
   Estimated Cost: $25,000
   Expected ROI: 3.5x

[... more recommendations ...]

## Key Performance Indicators (5)

1. **Monthly Recurring Revenue (MRR)**
   Baseline: 0 USD
   Target: 50000 USD
   Frequency: monthly

[... more KPIs ...]

## Timeline Milestones (6)

1. **MVP Launch**
   Target Date: 2026-03-31
   Deliverables:
     - GitHub App integration
     - 7 Coding Agents implementation
   Success Criteria:
     - 100 beta users acquired
     - 80% issue automation rate

[... more milestones ...]

## Risk Assessment (5)

1. **GitHub API Rate Limiting**
   Severity: 4/5
   Probability: 60%
   Mitigation:
     - Implement caching strategy
     - Use GitHub App OAuth for distributed limits

[... more risks ...]

## Next Steps (8)

1. Set up GitHub App and API integration
2. Implement CoordinatorAgent & CodeGenAgent
3. Launch beta program with 100 users
[... more steps ...]

🔍 Validating Business Plan...

Quality Score: 92/100
Valid: ✅ Yes

💡 Suggestions:
   - Add more detailed financial projections for Years 2-3
   - Consider additional international markets

🎉 Demo Complete!

Generated at: 2025-10-18 19:30:45 UTC
Validated at: 2025-10-18 19:30:48 UTC
```

---

## 📝 BusinessInput Type

All agents accept a `BusinessInput` struct:

```rust
pub struct BusinessInput {
    /// Industry (e.g., "SaaS", "E-commerce", "Fintech")
    pub industry: String,

    /// Target market description (e.g., "SMB developers", "Enterprise CIOs")
    pub target_market: String,

    /// Initial budget in USD
    pub budget: u32,

    /// Geographic focus (optional, default: "Global")
    pub geography: Option<String>,

    /// Timeframe in months (optional, default: 12)
    pub timeframe_months: Option<u32>,

    /// Additional context (optional)
    pub context: Option<String>,
}

impl Default for BusinessInput {
    fn default() -> Self {
        Self {
            industry: "SaaS".to_string(),
            target_market: "SMB developers".to_string(),
            budget: 50_000,
            geography: None,
            timeframe_months: Some(6),
            context: None,
        }
    }
}
```

---

## 📤 BusinessPlan Output

All agents return a `BusinessPlan` struct:

```rust
pub struct BusinessPlan {
    /// Plan title
    pub title: String,

    /// Executive summary (2-3 paragraphs)
    pub summary: String,

    /// Strategic recommendations
    pub recommendations: Vec<Recommendation>,

    /// Key Performance Indicators
    pub kpis: Vec<KPI>,

    /// Implementation timeline
    pub timeline: Timeline,

    /// Risk assessment
    pub risks: Vec<Risk>,

    /// Next steps (actionable items)
    pub next_steps: Vec<String>,

    /// Generation timestamp
    pub generated_at: DateTime<Utc>,
}
```

---

## 🔍 Validation

All agents support output validation:

```rust
let validation = agent.validate_output(&plan).await?;

// Check quality score (0-100)
println!("Quality Score: {}/100", validation.quality_score);

// Check if plan is valid
if !validation.is_valid {
    println!("Errors:");
    for error in &validation.errors {
        println!("  - {}", error);
    }
}

// View warnings
for warning in &validation.warnings {
    println!("Warning: {}", warning);
}

// Get improvement suggestions
for suggestion in &validation.suggestions {
    println!("Suggestion: {}", suggestion);
}
```

---

## 🌐 API Rate Limits & Costs

**Anthropic Claude API**:
- Model: Claude 3.5 Sonnet
- Input: $3 per million tokens
- Output: $15 per million tokens

**Estimated Costs per Agent Execution**:
- AIEntrepreneurAgent: ~$0.15-0.30 (comprehensive 8-phase plan)
- ProductConceptAgent: ~$0.10-0.20 (MVP design)
- ProductDesignAgent: ~$0.12-0.22 (technical architecture)
- FunnelDesignAgent: ~$0.10-0.18 (AARRR metrics)
- PersonaAgent: ~$0.08-0.15 (customer personas)
- SelfAnalysisAgent: ~$0.10-0.18 (SWOT analysis)
- MarketResearchAgent: ~$0.12-0.25 (TAM/SAM/SOM analysis)
- MarketingStrategyAgent: ~$0.10-0.20 (marketing campaigns)
- ContentCreationAgent: ~$0.08-0.15 (content strategy)
- SNSStrategyAgent: ~$0.08-0.15 (social media strategy)
- YouTubeAgent: ~$0.08-0.15 (YouTube strategy)
- SalesStrategyAgent: ~$0.12-0.22 (sales operations)
- CRMAgent: ~$0.10-0.18 (customer lifecycle)
- AnalyticsAgent: ~$0.12-0.22 (data architecture)

**Rate Limits**:
- Free tier: 50 requests/day
- Paid tier: 1,000 requests/minute

---

## 🛠️ Troubleshooting

### Error: "Failed to create Claude client"

**Cause**: `ANTHROPIC_API_KEY` not set

**Solution**:
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

### Error: "Claude API failed: rate limit exceeded"

**Cause**: Too many requests in short time

**Solution**: Wait 60 seconds or upgrade to paid tier

---

### Low Quality Score (<70)

**Cause**: Insufficient input context

**Solution**: Provide more detailed `BusinessInput.context`:
```rust
let input = BusinessInput {
    context: Some(
        "GitHub-native automation platform. \
         Targets 28M global developers. \
         Competes with GitHub Copilot ($500M ARR), Cursor ($9.9B valuation). \
         Unique: 15-component GitHub integration, 53-label system, DAG task decomposition."
            .to_string()
    ),
    ..Default::default()
};
```

---

## 📚 Additional Resources

- **Agent Specifications**: `.claude/agents/specs/business/*.md`
- **API Documentation**: `https://docs.anthropic.com/`
- **GitHub Repository**: `https://github.com/ShunsukeHayashi/Miyabi`
- **Business Model**: `docs/SAAS_BUSINESS_MODEL.md`
- **Market Analysis**: `docs/MARKET_ANALYSIS_2025.md`

---

## 🤝 Contributing

Want to add new Business Agents? See [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

🌸 **Miyabi Business Agents** - From Strategy to Execution, Automated
