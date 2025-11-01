# Miyabi Agent Operations Guide

> Authoritative reference for coordinating Miyabi's autonomous agents.  
> For the complete control protocol, see `CLAUDE.md`.

---

## Critical Protocols

- **Task Execution Protocol** — Never implement changes directly. Assign todos to a sub-agent via the `agent-execution` Skill (or a specialised Skill such as `rust-development`, `debugging-troubleshooting`, `performance-analysis`, `security-audit`, `documentation-generation`).  
- **MCP First** — Before running any workflow, confirm MCP availability.  
  ```bash
  codex mcp list   # use claude mcp list if running the legacy CLI
  ```  
- **Context7 Requirement** — When you need external library/API context, request it through Context7 before coding.  
- **Status Logging** — Every agent execution must post status updates to `.ai/logs/` so the coordinator can reconcile parallel runs.

---

## Agent Hierarchy

```
Human Layer (Strategy / Approvals)
  ├── TechLead
  ├── Product Owner
  └── CISO
       ↓ escalation
Coordinator Layer
  └── CoordinatorAgent – task orchestration, dependency resolution
       ↓ assignment
Specialist Layer
  ├── Coding agents (Rust runtime ownership)
  ├── Business agents (Go-to-market, analytics)
  └── Support agents (review, deployment, refresher)
```

Escalation rules mirror those documented in `CLAUDE.md`:

| Agent | Authority | Escalates To |
|-------|-----------|--------------|
| CoordinatorAgent | Task orchestration | TechLead |
| CodeGenAgent | Implementation | TechLead (architecture) |
| ReviewAgent | Quality gate (80% minimum) | CISO |
| IssueAgent | Labeling / triage | Product Owner |
| PRAgent | PR authoring | TechLead |
| DeploymentAgent | CI/CD, releases | CTO |

---

## Agent Catalog (Rust Implementation)

### Coding Agents (7)
- `CoordinatorAgent` — Builds execution plans, resolves dependencies.
- `CodeGenAgent` — Generates/updates Rust & TypeScript via Skills.
- `ReviewAgent` — Performs automated review, enforces zero-regression policy.
- `IssueAgent` — Classifies issues, applies organisational labels.
- `PRAgent` — Drafts PRs with change summaries and test evidence.
- `DeploymentAgent` — Manages CI/CD pipelines, artifact promotion.
- `RefresherAgent` — Keeps stale branches and docs in sync.

### Business Agents (14)
- **Strategy / Planning (6)** — AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis.
- **Marketing (5)** — MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube.
- **Sales / Customer Success (3)** — Sales, CRM, Analytics.

Specs live in `.codex/agents/specs/` (mirrored from `.claude/agents/specs/` for legacy tooling).  
Execution prompts sit in `.codex/agents/prompts/`.  
Character references and tone guidelines: `.codex/agents/AGENT_CHARACTERS.md`.

---

## Execution Workflow

### Operational Sequence (Mandatory)

1. **MCP First** — Run `codex mcp list` (or `claude mcp list` on legacy setups) and ensure required MCP servers are reachable.
2. **Context Sync** — Review `.codex/context/INDEX.md` (and linked modules) plus `CLAUDE.md` for any protocol updates.
3. **Miyabi Definition Lookup (Pattern 0)** ✨ — Before starting any task, consult the authoritative definitions:
   ```bash
   # Entity attributes
   cat miyabi_def/variables/entities.yaml | grep -A 20 "E3_Agent:"

   # Relation implementation
   cat miyabi_def/variables/relations.yaml | grep -A 30 "R1_Issue_analyzed_by_Agent:"

   # Label assignment rules
   cat miyabi_def/variables/labels.yaml | grep -A 10 "STATE:"

   # Workflow stages
   cat miyabi_def/variables/workflows.yaml | grep -A 30 "W3_Code_Implementation:"
   ```
4. **Task Selection** — Inspect `TODO.md`, `Plans.md`, and open issues to determine the highest-priority work item.
5. **Skill/Agent Dispatch** — Execute the task via the appropriate Skill (e.g., `agent-execution`, `rust-development`, `documentation-generation`) or sub-agent; never implement changes directly.
6. **Logging & Reporting** — Record outcomes in `.ai/logs/`, update relevant issues/PRs, and document follow-up actions.

1. **Pre-flight (MCP First)**  
   - `codex mcp list` to verify servers (filesystem, miyabi, github, project-context, etc.).  
   - Load `.codex/context/INDEX.md` for the latest critical rules.

2. **Select Skill / Agent**  
   - Use `agent-execution` Skill for coding work; choose specialised Skills when appropriate.  
   - Provide the issue number, desired outcome, guardrails, and exit criteria.

3. **Run via Miyabi CLI**  
   ```bash
   miyabi agent run coordinator --issue 270
   miyabi agent run codegen --issue 270 --plan plan.yaml
   miyabi agent run review --issue 270 --checklist .codex/commands/review.md
   ```  
   Use `--dry-run` for validation and `--concurrency` when orchestrating multiple issues.

4. **Monitor & Log**  
   - Tail `.ai/logs/agent-execution.log`.  
   - Use `miyabi status` or the MCP `miyabi__get_status` tool for runtime health.

5. **Close Loop**
   - Record outcomes in the issue, attach test commands, and archive the plan under `.ai/plans/`.

---

## Miyabi Definition System ✨

### Quick Reference

The `miyabi_def/` directory contains the **authoritative machine-readable source of truth** for the entire Miyabi project using Jinja2 + YAML format.

**Foundation (Phase 1 - Complete):**
- `variables/entities.yaml` — 14 Core Entities (E1-E14), 1,420 lines
- `variables/relations.yaml` — 39 Relations (R1-R39), 1,350 lines
- `variables/labels.yaml` — 57 Labels (11 categories), 840 lines
- `variables/workflows.yaml` — 5 Workflows (W1-W5, 38 stages), 680 lines
- `variables/agents.yaml` — 21 Agents (7 Coding, 14 Business)
- `variables/crates.yaml` — 15 Crates
- `variables/skills.yaml` — 18 Skills

### Generating Definition Files

```bash
cd miyabi_def

# Activate Python environment
source .venv/bin/activate

# Generate all definition files
python generate.py

# View generated files (8 files, 152KB)
ls -lh generated/

# Validate specific file
cat generated/entities.yaml
```

### Common Lookup Patterns

**Pattern 0 (Highest Priority) — Definition Lookup:**

```bash
# Check entity attributes
grep -A 20 "E1_Issue:" miyabi_def/variables/entities.yaml

# Find relation implementation
grep -A 30 "R2_Issue_decomposed_into_Task:" miyabi_def/variables/relations.yaml

# Review label categories
grep -A 15 "STATE:" miyabi_def/variables/labels.yaml

# Understand workflow stage
grep -A 25 "W2_Task_Decomposition_Planning:" miyabi_def/variables/workflows.yaml

# Check agent capabilities
grep -A 15 "CoordinatorAgent:" miyabi_def/variables/agents.yaml
```

**Integration with Agent Work:**
- Agents reference: `.codex/context/miyabi-definition.md` (800 tokens, quick overview)
- Source of truth: `miyabi_def/variables/*.yaml` (complete specifications)
- Generated outputs: `miyabi_def/generated/*.yaml` (formatted for consumption)

---

## Resource Index

| Area | Location | Notes |
|------|----------|-------|
| **Miyabi Definitions** ✨ | `miyabi_def/variables/**` | ⭐⭐⭐⭐⭐ **Primary source of truth** for all definitions |
| Entity-Relation Model | `miyabi_def/variables/entities.yaml` | 14 Core Entities (E1-E14) |
| Relation Mappings | `miyabi_def/variables/relations.yaml` | 39 Relations (R1-R39) with N1/N2/N3 notation |
| Label System | `miyabi_def/variables/labels.yaml` | 57 Labels across 11 categories |
| Workflow Definitions | `miyabi_def/variables/workflows.yaml` | 5 Workflows (W1-W5) with 38 stages |
| Agent Definitions | `miyabi_def/variables/agents.yaml` | 21 Agents (7 Coding, 14 Business) |
| **Context Integration** | `.codex/context/miyabi-definition.md` | Bridge to miyabi_def system (Pattern 0) |
| Agent Specs | `.codex/agents/specs/**` | Authoritative behaviours & escalation logic |
| Agent Prompts | `.codex/agents/prompts/**` | Execution-time instructions |
| Skills | `.codex/Skills/**` | Reusable task-specific procedures |
| Context Modules | `.codex/context/**` | Core rules, architecture, worktree protocol |
| MCP Config | `.codex/mcp-config.json` | Node/Rust server definitions |
| Hooks | `.codex/hooks/**` | Auto format, validation, keep-alive routines |

**Priority Order for Agent Work:**
1. ⭐⭐⭐⭐⭐ `miyabi_def/variables/` — Primary source of truth
2. ⭐⭐⭐⭐ `.codex/context/` — Context modules (quick reference)
3. ⭐⭐⭐ `docs/` — Detailed implementation documentation
4. ⭐⭐ `.codex/agents/specs/` — Agent specifications
5. ⭐ `.codex/agents/prompts/` — Execution prompts

For historical compatibility, legacy `.claude/` paths remain readable but `.codex/` is the primary source.

---

## Development Guardrails

### Project Structure
- `crates/` — Rust workspace (`miyabi-core`, `miyabi-types`, `miyabi-agents`, `miyabi-cli`, etc.).
- Legacy TypeScript utilities reside in `packages/` (consult migration tickets before editing).
- Shared docs under `docs/`; agent assets under `.codex/agents/` (plus legacy `.claude/agents/`).
- Integration fixtures live in `tests/`, `examples/`, and `assets/`.

### Build & Test Commands
- `cargo build` / `cargo build --release` — debug vs. optimised builds.
- `cargo test --all` — full suite; use `cargo test -p <crate>` for focused runs.
- `cargo clippy -- -D warnings` & `cargo fmt` — lint + format gates.
- `pnpm test`, `pnpm typecheck` — Vitest & TypeScript checks for MCP adapters.
- `pnpm mcp:test` — end-to-end MCP diagnostics (`scripts/test-mcp.sh`).

### Coding Standards
- Rust 2021 defaults: four-space indent, `snake_case` functions/modules, `UpperCamelCase` types, `SCREAMING_SNAKE_CASE` constants.
- Document every public item with `///`; prefer explicit error types or `anyhow::Result` at crate boundaries.
- Feature-flag experimental code paths; avoid unchecked `unwrap` outside tests.
- TypeScript: PascalCase classes, camelCase members, kebab-case directories.

### Testing Expectations
- Co-locate unit tests with their modules; integration tests go in `tests/` (use `#[tokio::test]` for async).
- Use `insta` for snapshot-heavy features; update fixtures in `tests/fixtures`.
- Target ≥80% coverage; document deliberate gaps and executed commands in PRs/issues.

### Security & Configuration
- Keep secrets in env vars (`GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, etc.); never commit `.miyabi.yml` with credentials.
- Run `pnpm mcp:diagnose` and `cargo audit` after dependency bumps; record temporary exceptions in `SECURITY.md`.
- Follow MCP sandbox policies defined in `.codex/settings.json` when automating with Codex.

---

Maintain this document alongside `CLAUDE.md`—if control rules change, update both to keep agent behaviour predictable.***
