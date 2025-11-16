# Plans for Issue #700

**Title**: refactor: Global Repository Restructure Kickoff (Q4 2025)

**URL**: _(to be created – recommend `customer-cloud/miyabi-private` issue #700 for tracking)_

---

## 📋 Summary

- **Total Tasks**: 6
- **Estimated Duration**: 18 hours (spread across 3-4 working days)
- **Execution Levels**: 4
- **Has Cycles**: ✅ No
- **Primary Agents**: CoordinatorAgent → CodeGenAgent / IssueAgent / DocumentationAgent / ReviewAgent

---

## 📝 Task Breakdown

### 1. Repository Baseline Audit

- **ID**: `task-700-baseline-audit`
- **Type**: Docs
- **Assigned Agent**: IssueAgent
- **Priority**: 0
- **Estimated Duration**: 2h

**Description**: Produce an authoritative inventory of the current repository, focusing on crate layout, legacy TypeScript surfaces, duplicated agent specs, and doc drift between `.codex` and `.claude`. Deliverables: updated `DIRECTORY_STRUCTURE.md` draft, dependency graph delta against 2025-10-24 snapshot, and structured notes in `.ai/logs/agent-execution-*.json`.

---

### 2. Miyabi Agents Decoupling Sprint

- **ID**: `task-700-agents-decouple`
- **Type**: Refactor
- **Assigned Agent**: CodeGenAgent
- **Priority**: 1
- **Estimated Duration**: 6h
- **Dependencies**: `task-700-baseline-audit`

**Description**: Remove the deprecated `miyabi-agents` umbrella crate from the build graph. Actions: migrate remaining imports in `crates/miyabi-cli/src/commands/agent_manage.rs`, expose the new agent registry via `miyabi-agent-*` crates, update tests, and ensure Cargo features remain green. Target: zero `deprecated` warnings on `cargo run --bin miyabi -- agent run --help`.

---

### 3. Feature Flag & Build Hygiene

- **ID**: `task-700-feature-hygiene`
- **Type**: Refactor
- **Assigned Agent**: CodeGenAgent
- **Priority**: 1
- **Estimated Duration**: 4h
- **Dependencies**: `task-700-agents-decouple`

**Description**: Resolve the `#[cfg(feature = "tui")]` warnings and standardise feature manifests across workspace crates. Update `Cargo.toml` feature matrices, scrub unused flags, and align build scripts. Goal: `cargo check --all-features` emits zero unexpected `cfg` warnings.

---

### 4. Legacy Surface Rationalisation

- **ID**: `task-700-legacy-rationalise`
- **Type**: Maintenance
- **Assigned Agent**: CodeGenAgent (with optional BusinessAgent support)
- **Priority**: 2
- **Estimated Duration**: 4h
- **Dependencies**: `task-700-baseline-audit`

**Description**: Decide the fate of `miyabi-web`, `miyabi-dashboard`, `packages/`, and other TypeScript artefacts. Outcomes: archive or migrate legacy packages, document active vs. sunset components in `projects/`, and generate migration tickets per surface. Coordinate with Business agents for GTM assets if impacts exist.

---

### 5. Documentation & Context Sync

- **ID**: `task-700-doc-sync`
- **Type**: Docs
- **Assigned Agent**: DocumentationGenerationAgent
- **Priority**: 2
- **Estimated Duration**: 1.5h
- **Dependencies**: `task-700-feature-hygiene`, `task-700-legacy-rationalise`

**Description**: Update `DIRECTORY_STRUCTURE.md`, `.codex/context/architecture.md`, and any impacted onboarding docs to reflect the new layout. Ensure `.codex` and `.claude` mirrors stay in sync and reference the updated crate/agent topology.

---

### 6. Quality Gate & Regression Sweep

- **ID**: `task-700-review`
- **Type**: Review
- **Assigned Agent**: ReviewAgent
- **Priority**: 3
- **Estimated Duration**: 0.5h
- **Dependencies**: `task-700-feature-hygiene`, `task-700-doc-sync`

**Description**: Execute full workspace validation: `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test --all`, and `pnpm test`. Deliverable: review report ≥ 85/100, attached to `.ai/logs/` and the tracking issue.

---

## 🔄 Execution Plan (DAG Levels)

- **Level 0**: `task-700-baseline-audit`
- **Level 1**: `task-700-agents-decouple`
- **Level 2**: `task-700-feature-hygiene`, `task-700-legacy-rationalise`
- **Level 3**: `task-700-doc-sync`
- **Level 4**: `task-700-review`

Parallel execution is allowed within each level once dependencies finish. CoordinatorAgent should enforce worktree isolation per task.

---

## 🎯 Success Criteria

- Deprecated `miyabi-agents` references removed from the active build graph.
- `cargo run --bin miyabi -- agent run --help` executes cleanly (no warnings).
- Feature flags defined once and referenced consistently across crates.
- Legacy TypeScript surfaces either archived or accompanied by explicit migration tickets.
- Documentation across `.codex` / `.claude` / `docs/` converges on the same structure snapshot (dated 2025-10-30).
- ReviewAgent sign-off ≥ 85/100 with zero blocker findings.

---

## 📎 Notes for CoordinatorAgent

- Use `miyabi agent run coordinator --issue 700 --dry-run` to sanity check the DAG before dispatch.
- Ensure each execution logs to `.ai/logs/agent-execution-{timestamp}.json`.
- Engage Business agents for `task-700-legacy-rationalise` if deprecations affect GTM assets.
- Consider spinning follow-up issues for Business Agent implementations that surface during the audit.

---

*Draft prepared 2025-10-30 by Codex (Coordinator role). Pending approval from TechLead/Product before execution.*
