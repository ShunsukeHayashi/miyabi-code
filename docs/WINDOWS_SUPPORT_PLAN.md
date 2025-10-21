# Windows Platform Support Execution Plan (Issue #360)

**Status**: Draft – Ready for execution  
**Last updated**: 2025-10-21

---

## 🎯 Objectives

1. Provide a first-class Windows experience for the Miyabi CLI and agent workflow.
2. Eliminate path-handling regressions (PathBuf migration and long-path safeguards).
3. Guarantee CI coverage and packaging parity for `miyabi.exe`.

---

## 🧭 Workstreams

### W1. Path Canonicalization & Invariants
- **Owner**: CodeGen team (つくるん)
- **Scope**:
  - Replace string-based worktree paths in:
    - `crates/miyabi-types/src/task.rs`
    - `crates/miyabi-types/src/workflow.rs`
    - `crates/miyabi-agents/src/codegen.rs`
    - CLI helpers in `crates/miyabi-cli/src/commands/{agent.rs,init.rs,install.rs,parallel.rs,setup.rs}`
  - Introduce a `WorktreePaths` helper in `crates/miyabi-worktree` that:
    - Accepts `PathBuf` inputs only.
    - Normalizes separators via `dunce::simplified`.
    - Exposes API parity for existing string consumers.
- **Deliverables**:
  - Updated types & unit tests for serialization/serde.
  - Integration test coverage (`crates/miyabi-integration/src/lib.rs`) using `assert_eq!(Path)` style assertions.

### W2. Worktree Base Path & Length Guard
- **Owner**: Core platform (しきるん)
- **Scope**:
  - Add `worktree.base_dir` configuration to `crates/miyabi-core/src/config.rs` with OS-specific defaults:
    - POSIX: `.worktrees`
    - Windows: `%LOCALAPPDATA%\\Miyabi\\wt`
  - Update CLI onboarding (`setup`, `install`, `init`) to write/read the new field.
  - Implement path-length guard inside `WorktreeManager`:
    - Warn when exceeding 240 characters.
    - Auto-shortening option via hash-based suffix.
- **Deliverables**:
  - Config migration script or fallback logic for existing `.miyabi.yml`.
  - Telemetry event for path-length warnings.

### W3. Shell & Hook Abstraction
- **Owner**: CLI team (つなぐん)
- **Scope**:
  - Wrap `.claude/hooks/*.sh` invocations with a Rust command adapter (`crates/miyabi-cli/src/startup.rs`).
  - Provide Windows-aware execution paths:
    - Native PowerShell for hook execution.
    - Optional WSL delegation (config flag).
  - Ensure SessionStart/End hooks (see `.claude/settings.json`) leverage the adapter.
- **Deliverables**:
  - Adapter module with unit tests (simulated commands).
  - Updated documentation in `.claude/docs/AI_CLI_COMPLETE_GUIDE.md`.

### W4. CI & Packaging Verification
- **Owner**: DevOps (はこぶん)
- **Scope**:
  - Extend `.github/workflows/rust.yml`:
    - Add Windows smoke test step executing `miyabi.exe status`.
    - Upload Windows artifacts for inspection.
  - Update `.github/workflows/release.yml` to verify Authenticode signature / SHA256.
- **Deliverables**:
  - Failing test proves the work is enforced.
  - Release checklist entry with verification commands.

### W5. Documentation & Support Materials
- **Owner**: Docs team (まとめるん)
- **Scope**:
  - Refresh Windows sections in:
    - `CLAUDE.md`
    - `docs/USER_GUIDE.md`
    - `docs/DEPLOYMENT_GUIDE.md`
  - Produce troubleshooting FAQ covering:
    - Long-path remediation.
    - Hook execution on PowerShell/WSL.
    - Known limitations (UNC paths, CRLF).
- **Deliverables**:
  - New `docs/WINDOWS_SUPPORT_FAQ.md`.
  - Cross-links from `docs/INTEGRATION_ROADMAP.md` and `CONSOLIDATION_STATUS_REPORT.md`.

---

## ⏱️ Timeline & Milestones

| Milestone | Target Date | Owner | Exit Criteria |
|-----------|-------------|-------|---------------|
| **M1** – PathBuf refactor merged | 2025-10-28 | W1 | All workspace path APIs accept `PathBuf`; tests green. |
| **M2** – Config + guards | 2025-10-30 | W2 | Windows default base path configurable; telemetry hook live. |
| **M3** – Hook adapter rollout | 2025-11-01 | W3 | Hooks run cross-platform; regression tests added. |
| **M4** – CI enhancements | 2025-11-02 | W4 | Windows smoke test + release verification in CI. |
| **M5** – Docs update | 2025-11-03 | W5 | Guides updated; FAQ published. |

---

## ✅ Dependencies & Risks

- `dunce` crate adoption must not break existing POSIX behaviour.
- Windows long-path support may require user to enable `LongPathsEnabled`; document fallback instructions.
- Hook adapter must preserve exit codes so automation (e.g., keepalive script) behaves identically.

---

## 📈 Success Metrics

- Windows CI pipeline passes end-to-end twice consecutively.
- `miyabi.exe` installer tested on Windows 11 (WSL optional) with zero manual patching.
- No open bugs tagged `windows-path` or `windows-shell` for two weeks post-release.

---

## 🔁 Reporting

- Weekly status entry in `SESSION_SUMMARY_202510*.md`.
- Issues / PRs reference `Issue #360` via `Fixes: #360` (private repo).
- Maintain progress checklist in `CONSOLIDATION_STATUS_REPORT.md`.

