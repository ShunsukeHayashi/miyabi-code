---
title: "Miyabi System Documentation"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "index"
tags: ["miyabi", "index", "navigation"]
status: "published"
---

# Miyabi System Documentation

**Complete documentation for the Miyabi autonomous development framework**

## 📊 System Overview

| Category | Count | Description |
|----------|-------|-------------|
| [[entities/INDEX\|Entities]] | 14 | Core data entities |
| [[relations/INDEX\|Relations]] | 39 | Entity relationships |
| [[workflows/INDEX\|Workflows]] | 5 | Automated workflows |
| [[agents/INDEX\|Agents]] | 21 | Autonomous agents (7 coding + 14 business) |
| [[labels/INDEX\|Labels]] | 57 | GitHub label system (11 categories) |

**Total Documents**: 136

## 🎨 System Architecture

![[assets/diagrams/Miyabi System Architecture - Rust Edition.png]]

*High-level overview of the Miyabi framework architecture*

## 🎯 Quick Navigation

### Core Entities

**Primary Entities:**
- [[entities/E1|E1: Issue]] - GitHub Issue (Primary entity)
- [[entities/E2|E2: Task]] - Decomposed tasks
- [[entities/E3|E3: Agent]] - Autonomous agents
- [[entities/E4|E4: PR]] - Pull Requests
- [[entities/E5|E5: Label]] - GitHub labels

**Extended Entities:**
- [[entities/E6|E6: QualityReport]] - Code quality reports
- [[entities/E7|E7: Command]] - Slash commands
- [[entities/E8|E8: Escalation]] - Escalation info
- [[entities/E9|E9: Deployment]] - Deployment info
- [[entities/E10|E10: LDDLog]] - LDD execution logs

**System Entities:**
- [[entities/E11|E11: DAG]] - Directed Acyclic Graph
- [[entities/E12|E12: Worktree]] - Git worktrees
- [[entities/E13|E13: DiscordServer]] - Discord integration
- [[entities/E14|E14: SubIssue]] - Hierarchical issues

### Agents

**Coding Agents (7):**
- [[agents/CoordinatorAgent|CoordinatorAgent]] - Task orchestration & DAG execution
- [[agents/CodeGenAgent|CodeGenAgent]] - AI-driven code generation
- [[agents/ReviewAgent|ReviewAgent]] - Quality review
- [[agents/IssueAgent|IssueAgent]] - Issue analysis & labeling
- [[agents/PRAgent|PRAgent]] - PR automation
- [[agents/DeploymentAgent|DeploymentAgent]] - CI/CD deployment
- [[agents/RefresherAgent|RefresherAgent]] - Issue status monitoring

**Business Agents (14):**
- [[agents/AIEntrepreneurAgent|AIEntrepreneurAgent]] - Comprehensive business planning
- [[agents/SelfAnalysisAgent|SelfAnalysisAgent]] - Career & skill analysis
- [[agents/MarketResearchAgent|MarketResearchAgent]] - Market analysis (20+ competitors)
- [[agents/PersonaAgent|PersonaAgent]] - Target customer personas
- [[agents/ProductConceptAgent|ProductConceptAgent]] - USP & business model
- [[agents/ProductDesignAgent|ProductDesignAgent]] - Service design (6 months)
- [[agents/ContentCreationAgent|ContentCreationAgent]] - Content production
- [[agents/FunnelDesignAgent|FunnelDesignAgent]] - Customer funnel optimization
- [[agents/SNSStrategyAgent|SNSStrategyAgent]] - Social media strategy
- [[agents/MarketingAgent|MarketingAgent]] - Marketing campaigns
- [[agents/SalesAgent|SalesAgent]] - Sales process optimization
- [[agents/CRMAgent|CRMAgent]] - Customer relationship management
- [[agents/AnalyticsAgent|AnalyticsAgent]] - Data analysis & PDCA
- [[agents/YouTubeAgent|YouTubeAgent]] - YouTube channel optimization

### Workflows

- [[workflows/W1|W1: Issue Processing]] - GitHub Issue → Tasks → PR
- [[workflows/W2|W2: Code Review]] - PR → Quality Report → Merge
- [[workflows/W3|W3: Deployment]] - PR Merge → Deploy → Health Check
- [[workflows/W4|W4: Escalation]] - Error → Escalation → Resolution
- [[workflows/W5|W5: LDD Logging]] - Command → Log → Analysis

### Key Relations

**Entity Lifecycle:**
- [[relations/R1|R1: analyzed-by]] - Issue → Agent (IssueAgent)
- [[relations/R2|R2: decomposed-into]] - Issue → Task[]
- [[relations/R5|R5: assigned-to]] - Task → Agent
- [[relations/R10|R10: generates]] - Agent → PR

**Quality Control:**
- [[relations/R19|R19: reviewed-by]] - PR → Agent (ReviewAgent)
- [[relations/R20|R20: has]] - PR → QualityReport

**Complete relation map**: [[relations/INDEX|View all 39 relations →]]

## 🎨 Graph View

Open the graph view to visualize the entire system:
- **Blue nodes**: Entities
- **Green nodes**: Agents
- **Red nodes**: Relations
- **Yellow nodes**: Workflows
- **Purple nodes**: Labels

See [[.obsidian/GRAPH_VIEW_GUIDE|Graph View Guide]] for customization.

## 📚 Category Indexes

### 🏗️ Architecture & System Guides

- [[architecture/2025-11-20-knowledge-graph-index|🗺️ Knowledge Graph Index]] - **START HERE** - Complete navigation map
- [[architecture/2025-11-20-claude-directory-index|📚 .claude/ Directory Guide]] - Narrative guide to 258 files (⭐⭐⭐⭐⭐)
- [[architecture/2025-11-20-context-modules-guide|📖 Context Modules Guide]] - 17 knowledge modules
- [[architecture/2025-11-20-skills-system-guide|⚡ Skills System Guide]] - 19 special abilities
- [[architecture/2025-11-20-agents-system-guide|🤖 Agents System Guide]] - 21 autonomous agents

### 📊 Entity-Relation System

- [[entities/INDEX|📦 Entities Index]] - All 14 entities with descriptions
- [[agents/INDEX|🤖 Agents Index]] - All 21 agents categorized
- [[relations/INDEX|🔗 Relations Index]] - All 39 relationships
- [[workflows/INDEX|⚙️ Workflows Index]] - All 5 workflows
- [[labels/INDEX|🏷️ Labels Index]] - All 57 labels by category

## 🔍 Search Tags

Use these tags to filter documents:

- `#entity` - All entity documents
- `#agent` - All agent documents
- `#agent-coding` - Coding agents only
- `#agent-business` - Business agents only
- `#relation` - All relation documents
- `#workflow` - All workflow documents
- `#label` - All label documents

## 📖 Documentation Structure

```
obsidian-vault/
├── INDEX.md (this file)
├── entities/
│   ├── INDEX.md
│   └── E1.md - E14.md
├── agents/
│   ├── INDEX.md
│   └── [21 agent documents]
├── relations/
│   ├── INDEX.md
│   └── R1.md - R39.md
├── workflows/
│   ├── INDEX.md
│   └── W1.md - W5.md
├── labels/
│   ├── INDEX.md
│   └── [57 label documents]
└── .obsidian/
    ├── graph.json
    └── GRAPH_VIEW_GUIDE.md
```

## 📋 System Documentation

- [[QUICK_REFERENCE|📌 Quick Reference Card]] - Fast lookup for common patterns
- [[DIAGRAMS_GALLERY|🎨 Diagrams Gallery]] - All visual documentation in one place
- [[WORKFLOWS_DIAGRAM|🔄 Workflows Visual Guide]] - Interactive workflow diagrams
- [[DOCUMENTATION_SYSTEM_REPORT|📊 Complete Enhancement Report]] - Full system details

## 🚀 Quick Start

### 🌟 NEW: Narrative Knowledge Graph (2025-11-20)

**For first-time users**:
1. **Start**: [[architecture/2025-11-20-knowledge-graph-index|Knowledge Graph Index]] - Choose your path
2. **Read**: [[architecture/2025-11-20-claude-directory-index|.claude/ Directory Story]] - Chapters 1-8
3. **Navigate**: Use the 6 purpose-based navigation patterns

### Classic Quick Start

1. **Quick Reference**: Check [[QUICK_REFERENCE|Quick Reference Card]] for common lookup patterns
2. **Explore Entities**: Start with [[entities/E1|Issue (E1)]] to understand the primary entity
3. **View Workflows**: Check [[workflows/W1|Issue Processing Workflow]] to see the full lifecycle
4. **Graph View**: Open graph view to visualize all connections
5. **Search**: Use the search bar to find specific entities, agents, or relations

## 🔗 External Resources

- **Project Repository**: [miyabi-private](https://github.com/customer-cloud/miyabi-private)
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md`
- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md`
- **Agent Specifications**: `.claude/agents/specs/`

---

**Auto-generated by**: miyabi-obsidian-generator
**Last Updated**: 2025-11-20
**Version**: 2.0.0

---

## 🆕 What's New (v2.0.0 - 2025-11-20)

### Narrative Knowledge Graph System

**Added**:
- ✅ [[architecture/2025-11-20-knowledge-graph-index|Knowledge Graph Index]] - Complete navigation map
- ✅ [[architecture/2025-11-20-claude-directory-index|.claude/ Directory Guide]] - 258 files narrative
- ✅ [[architecture/2025-11-20-context-modules-guide|Context Modules Guide]] - 17 modules
- ✅ [[architecture/2025-11-20-skills-system-guide|Skills System Guide]] - 19 skills
- ✅ [[architecture/2025-11-20-agents-system-guide|Agents System Guide]] - 21 agents

**Features**:
- 📚 150+ internal links (wikilinks)
- 🎭 Story-based structure (Chapters 1-8)
- 🎯 6 purpose-based navigation patterns
- 🏷️ Comprehensive tagging system
- 📊 Mermaid diagrams for visualization

**Total**: 5 new architecture documents, ~15,000 tokens
