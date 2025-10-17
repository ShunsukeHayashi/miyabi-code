# Codex Agent Porting Plan

Goal: mirror the Claude coding agents inside the Rust-based Codex environment so they deliver the same autonomous capabilities while respecting Miyabi’s workflow rules.

## Overview

| Agent (Claude) | Primary Role | Key Actions in Claude Prompt | Codex Counterpart | Status / Gap |
| --- | --- | --- | --- | --- |
| CoordinatorAgent | Issue decomposition, DAG planning | `gh issue view`, parse tasks, build DAG, assign agents | `miyabi-agents::coordinator`, `miyabi-cli agent coordinator` | ✅ Agent exists in Rust; CLI already wires it. Need Codex instructions aligned with Cargo + worktree APIs. |
| CodeGenAgent | Implementation + tests | TypeScript strict mode, Vitest, BaseAgent pattern | `miyabi-agents::codegen` | ✅ Agent exists but targets Rust crates. Need new checklist covering `cargo fmt`, `cargo test`, Rust module layout. |
| ReviewAgent | Quality scoring, lint/tests/security | ESLint, npm audit, score rubric | `miyabi-agents::review` | ✅ CLI wired (`miyabi agent review --issue <n>`) with hooks executing cargo fmt/clippy/test/audit; Codex playbook available. |
| IssueAgent | Labeling & hierarchy | Keyword rules, CODEOWNERS lookup | `miyabi-agents::issue` | ✅ Implemented in Rust and exposed through CLI. Need Codex brief on label taxonomy and command usage. |
| PRAgent | PR creation | Conventional commit summary, GitHub API | `miyabi-agents::pr` | ✅ CLI wiring + hooks emit draft PR metadata, auto-detect branch/base; follow Codex playbook. |
| DeploymentAgent | CI/CD execution | Firebase/Vercel CLI, health checks | `miyabi-agents::deployment` | ✅ CLI wiring uses hooks with env/health metadata; ready to integrate provider-specific deploy commands. |
| Hooks Integration | Event driven execution | Shell hook bridging, logging | `miyabi-agents::hooks` | ✅ Hook trait + wrappers implemented; register Metrics & Environment checks in CLI. |

## Shared Foundations for Codex Agents
- **Environment bootstrap**: source `.env`, export `GH_TOKEN`, verify `gh auth status`.
- **Workspace expectations**: use Cargo workspace commands (`cargo fmt`, `cargo clippy -- -D warnings`, `cargo test --all`) instead of npm.
- **Logging**: append to `.ai/logs/YYYY-MM-DD.md` per LDD rules.
- **Worktree orchestration**: use `miyabi-worktree::WorktreeManager` for branch isolation when running in parallel.

## Porting Steps (per agent)
1. Extract required outcomes and checks from Claude prompt/spec.
2. Map each step to Rust commands or library calls.
3. Draft a Codex-specific instruction sheet under `.codex/agents/<agent>-playbook.md`.
4. Update CLI or service layer if Rust agent execution path is missing.
5. Add automated tests or dry-run scripts validating the new workflow.

The next deliverable is a set of Codex playbooks (one per agent) that replaces the TypeScript instructions with Rust/Cargo equivalents while preserving the intent, metrics, and escalation rules.
