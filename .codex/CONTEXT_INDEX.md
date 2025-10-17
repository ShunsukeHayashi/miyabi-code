# Codex Context Index

Use this index to connect Codex agents with the operational knowledge they need before acting. Start here, follow the references, and you will always land on the canonical source of truth.

## 1. GitHub Operations Core

| Purpose | Primary Reference | What You’ll Find |
| --- | --- | --- |
| Constitution & Autonomy | `.github/AGENTS.md` | Prime directives, agent governance, economic safeguards, escalation rules. |
| Mandatory Workflow | `.github/WORKFLOW_RULES.md` | “Everything starts with an Issue” protocol, branch/PR flow, logging requirements. |
| Issue Templates | `.github/ISSUE_TEMPLATE/` | YAML + Markdown templates enforced in the repository UI. |
| Label System | `.github/labels.yml` / `labels-ja.yml` | Authoritative label definitions; align with `.claude/docs/LABEL_SYSTEM_GUIDE.md`. |
| Guardian Expectations | `.github/GUARDIAN.md` | Human oversight duties and when to escalate. |
| Actions & Automation | `.github/actions/` + `.github/workflows/` | Reusable composite actions and CI/CD pipelines; required for agent coordination. |

Always consult these files before making platform-level changes or creating new automation around GitHub.

## 2. Codex Execution Guides

- `.codex/agents/ISSUE_CREATION_INSTRUCTIONS.md` — step-by-step playbook for opening issues (environment prep, label selection, CLI usage, post-checks).
- `.codex/agents/coordinator-playbook.md` — Rust-first decomposition workflow (`miyabi agent coordinator --issue <n>`).
- `.codex/agents/codegen-playbook.md` — implementation checklist covering cargo fmt/clippy/test.
- `.codex/agents/review-playbook.md` — quality review flow (fmt/clippy/test/audit + scoring rubric).
- `.codex/agents/pr-playbook.md` — PR drafting instructions with new CLI support.
- `.codex/agents/deployment-playbook.md` — deployment orchestration via DeploymentAgent hooks.
- `.codex/agents/hooks-playbook.md` — lifecycle hook architecture and usage (`miyabi-agents::hooks`).
- `.codex/agents/AGENT_PORTING_PLAN.md` — progress tracker for Codex parity work.
- `.codex/hooks/` — reserved for Codex-specific workflow hook configurations.

When implementing new Codex capabilities, extend these directories so every agent run references a single, evolving knowledge base.

## 3. Cross-Agent Knowledge Links

- `.claude/agents/README.md` — character naming system, agent catalog, parallel execution rules.
- `.claude/agents/specs/**` — detailed specs per agent (authority, success criteria, integration points).
- `.claude/docs/AI_CLI_COMPLETE_GUIDE.md` — comparison of AI CLI behaviors (Claude, Codex, Gemini); useful when defining cross-tool workflows.

Sync Codex updates with the Claude documentation so both ecosystems share the same mental model and label taxonomy.

## 4. Working Playbook

1. **Orient** — Read the relevant entries above (especially `.github/AGENTS.md` and `.github/WORKFLOW_RULES.md`) before executing a task.
2. **Execute** — Use the Codex guides (`.codex/agents/…`) to run the required commands or automations.
3. **Document** — Record outcomes in GitHub Issues and `.ai/logs/YYYY-MM-DD.md`, respecting Log-Driven Development.
4. **Update** — If you discover gaps, extend this index or the referenced guides, then cross-link so future agents stay aligned.

This index is the connective tissue between GitHub governance and Codex execution. Keep it current, and every Codex run will operate with full situational awareness.
