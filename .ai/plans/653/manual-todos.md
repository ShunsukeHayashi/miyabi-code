# Manual Implementation Checklist – Issue #653

## Pre-flight
- [x] Confirm MCP availability (`codex mcp list`) and context sync (`.codex/context/INDEX.md`, `CLAUDE.md`)
- [x] Create and switch to dedicated worktree (`git worktree add .worktrees/issue-653-manual -b issue-653-manual`)

## Autopilot Plan Schema
- [ ] Draft `.ai/plans/<issue>/Autopilot.yaml` schema (fields: id, command, expectation, post, rollback, retries)
- [ ] Document schema usage in `docs/autopilot/autopilot-plan-schema.md` and link from `AGENTS.md`

## Automation Script
- [ ] Implement `scripts/autopilot/run_codex.sh`
  - [ ] Worktree lifecycle management (create, cleanup)
  - [ ] Step execution loop (`codex exec --full-auto`, optional `codex apply`)
  - [ ] Logging to `.ai/logs/codex/autopilot-<timestamp>.log`
  - [ ] Post-step hooks (`cargo fmt`, `cargo test`, etc.)
  - [ ] Failure handling (consecutive failures, timeout, non-zero exit)
- [ ] Support summary generation and GitHub issue comment on completion/failure

## Logging & Reporting
- [ ] Define directory structure: `.ai/logs/autopilot/status-*.log`, `summary-*.md`, `FAILED-*.log`
- [ ] Implement helper script or functions to append status snapshots and summaries
- [ ] Ensure secrets masking and environment sanitization

## Audit Tooling
- [ ] Add `scripts/audit/codex_autopilot_check.sh`
  - [ ] Validate worktree cleanup
  - [ ] Verify log completeness (status, summary, failure reports)
  - [ ] Output PASS/FAIL with actionable messages

## Sample Plan & Docs
- [ ] Create sample `Autopilot.yaml` for Issue #646 under `.ai/plans/646/`
- [ ] Update documentation (`.codex/agents/specs/` or `docs/`) with usage tutorial
- [ ] Add section on security guardrails and offline operation

## Validation
- [ ] Dry-run autopilot against sample plan (no code changes)
- [ ] Full run generating changes in isolated worktree; review produced logs
- [ ] Run audit script and capture PASS result

## Reporting & Cleanup
- [ ] Summarize results in `.ai/logs/autopilot/summary-issue-653.md`
- [ ] Comment on Issue #653 with summary and links to logs
- [ ] Merge or archive worktree changes per protocol
