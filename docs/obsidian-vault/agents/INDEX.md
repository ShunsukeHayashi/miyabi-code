---
title: "Agents Index"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "index"
tags: ["miyabi", "agents", "index"]
status: "published"
---

# Agents Index

**21 Autonomous Agents: 7 Coding + 14 Business**

← [[../INDEX|Back to Main Index]]

## 🎨 Agent System Architecture

![[../assets/diagrams/Miyabi Agent System - 20 Agents Architecture.png]]

*Visual representation of 21 agents and their interaction patterns*

## 🤖 Coding Agents (7)

Specialized agents for software development automation:

| Agent | Role | Label | Description |
|-------|------|-------|-------------|
| [[CoordinatorAgent]] | **Orchestration** | `agent:coordinator` | Task orchestration & DAG-based parallel execution |
| [[CodeGenAgent]] | **Code Generation** | `agent:codegen` | AI-driven code generation with Claude Sonnet 4 |
| [[ReviewAgent]] | **Quality Review** | `agent:review` | Static analysis, security scanning, quality scoring |
| [[IssueAgent]] | **Issue Analysis** | `agent:issue` | Issue classification with 57-label system |
| [[PRAgent]] | **PR Automation** | `agent:pr` | Conventional Commits & Draft PR creation |
| [[DeploymentAgent]] | **CI/CD** | `agent:deployment` | Firebase auto-deploy, health check, auto-rollback |
| [[RefresherAgent]] | **Monitoring** | `agent:refresher` | Issue status monitoring & auto-update |

## 💼 Business Agents (14)

Agents for business strategy, marketing, and growth:

### Phase 1-4: Foundation & Strategy

| Agent | Phase | Description |
|-------|-------|-------------|
| [[AIEntrepreneurAgent]] | - | **Comprehensive business planning** - Complete startup strategy |
| [[SelfAnalysisAgent]] | 1 | **Career & skill analysis** - Personal strengths, experience, portfolio |
| [[MarketResearchAgent]] | 2 | **Market research** - Competitor analysis (20+), trend identification |
| [[PersonaAgent]] | 3 | **Target customer personas** - 3-5 detailed personas & customer journey |
| [[ProductConceptAgent]] | 4 | **Product concept** - USP, revenue model, business model canvas |

### Phase 5-8: Product & Marketing

| Agent | Phase | Description |
|-------|-------|-------------|
| [[ProductDesignAgent]] | 5 | **Service design** - 6-month content plan, tech stack, MVP definition |
| [[ContentCreationAgent]] | 6 | **Content production** - Video, articles, tutorials production plan |
| [[FunnelDesignAgent]] | 7 | **Customer funnel** - Awareness → Purchase → LTV optimization |
| [[SNSStrategyAgent]] | 8 | **Social media strategy** - Twitter/Instagram/YouTube content calendar |

### Phase 9-12: Growth & Operations

| Agent | Phase | Description |
|-------|-------|-------------|
| [[MarketingAgent]] | 9 | **Marketing campaigns** - Ad, SEO, SNS-driven customer acquisition |
| [[SalesAgent]] | 10 | **Sales optimization** - Lead → Customer conversion, process optimization |
| [[CRMAgent]] | 11 | **Customer relationship** - Customer satisfaction & LTV maximization |
| [[AnalyticsAgent]] | 12 | **Data analysis** - KPI tracking, PDCA cycle, continuous improvement |

### Specialized

| Agent | Focus | Description |
|-------|-------|-------------|
| [[YouTubeAgent]] | YouTube | **YouTube optimization** - Channel concept to posting plan (13 workflows) |

## 📊 Agent Statistics

- **Total Agents**: 21
- **Coding Agents**: 7
- **Business Agents**: 14
  - Strategy & Analysis: 4
  - Product & Marketing: 5
  - Growth & Operations: 4
  - Specialized: 1

## 🔗 Agent Relationships

### Coding Agent Workflow

```
IssueAgent
  ↓ analyzes Issue
CoordinatorAgent
  ↓ creates DAG, decomposes Tasks
CodeGenAgent / ReviewAgent / DeploymentAgent
  ↓ execute Tasks in parallel
PRAgent
  ↓ creates Pull Request
ReviewAgent
  ↓ reviews code quality
DeploymentAgent
  ↓ deploys to Firebase
RefresherAgent
  ↓ monitors & updates status
```

### Business Agent Workflow

```
AIEntrepreneurAgent
  ↓ creates overall strategy
SelfAnalysisAgent → MarketResearchAgent → PersonaAgent
  ↓ foundation (Phase 1-3)
ProductConceptAgent → ProductDesignAgent
  ↓ product definition (Phase 4-5)
ContentCreationAgent → FunnelDesignAgent → SNSStrategyAgent
  ↓ content & marketing (Phase 6-8)
MarketingAgent → SalesAgent → CRMAgent → AnalyticsAgent
  ↓ growth & optimization (Phase 9-12)
```

## 🎯 Agents by Function

### Issue Processing
- [[IssueAgent]] - Analyzes Issues, infers labels
- [[CoordinatorAgent]] - Decomposes into Tasks, builds DAG

### Code Implementation
- [[CodeGenAgent]] - Generates code
- [[ReviewAgent]] - Reviews quality
- [[PRAgent]] - Creates Pull Requests

### Deployment & Monitoring
- [[DeploymentAgent]] - CI/CD deployment
- [[RefresherAgent]] - Status monitoring

### Business Strategy
- [[AIEntrepreneurAgent]] - Overall planning
- [[SelfAnalysisAgent]] - Self-analysis
- [[MarketResearchAgent]] - Market research
- [[PersonaAgent]] - Persona creation

### Product Development
- [[ProductConceptAgent]] - Product concept
- [[ProductDesignAgent]] - Service design
- [[ContentCreationAgent]] - Content production

### Marketing & Growth
- [[FunnelDesignAgent]] - Funnel optimization
- [[SNSStrategyAgent]] - SNS strategy
- [[MarketingAgent]] - Marketing campaigns
- [[YouTubeAgent]] - YouTube optimization

### Sales & Analytics
- [[SalesAgent]] - Sales process
- [[CRMAgent]] - Customer management
- [[AnalyticsAgent]] - Data analysis

## 🔍 Search by Tag

- `#agent` - All agents
- `#agent-coding` - Coding agents only
- `#agent-business` - Business agents only
- `#CoordinatorAgent` - Specific agent

## 📚 Related Documentation

- [[../entities/E3|Entity E3: Agent]] - Agent entity definition
- [[../workflows/INDEX|Workflows]] - Agent workflows
- [[../relations/INDEX|Relations]] - Agent relationships

---

**Total Agents**: 21 (7 Coding + 14 Business)  
**Last Updated**: 2025-11-18
