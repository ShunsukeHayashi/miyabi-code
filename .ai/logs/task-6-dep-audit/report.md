# Task-6 Dependency Audit Report

Location: `.worktrees/task-6-dep-audit`  
Commands run: `cargo audit` (also saved as JSON) and `cargo outdated --workspace --root-deps-only`.

## Security findings (cargo audit)
- `ring 0.17.9` — RUSTSEC-2025-0009 (“Some AES functions may panic…”). Upgrade to `>=0.17.12`. Affects rustls/rustls-webpki stacks and all AWS SDK client crates used by miyabi-* services.
- `rsa 0.9.8` — RUSTSEC-2023-0071 (Marvin timing attack). No fixed release yet; currently pulled in via `sqlx-mysql` → `sea-orm` → `miyabi-web-api`/`miyabi-business-api`. Mitigate by tracking vendor patch or swapping RSA backend when available.

### Advisory warnings (unmaintained/unsound)
- `fxhash 0.2.1` (RUSTSEC-2025-0057) via `sled` → `miyabi-workflow`.
- `instant 0.1.13` (RUSTSEC-2024-0384) via `parking_lot`/`sled` paths.
- `json5 0.4.1` (RUSTSEC-2025-0120) via `config` → `miyabi-core`.
- `net2 0.2.39` (RUSTSEC-2020-0016) via `jsonrpc-http-server` → `miyabi-mcp-server`.
- `paste 1.0.15` (RUSTSEC-2024-0436) via `simba`/`nalgebra` → `miyabi-agent-swml`.
- `crossbeam-utils 0.7.2` (RUSTSEC-2022-0041) and `memoffset 0.5.6` (RUSTSEC-2023-0045) via legacy `tokio-threadpool` stack in `miyabi-session-manager`.

## Outdated direct deps (cargo outdated, root-deps-only)
- `axum` 0.7.9 → 0.8.7 across multiple crates (`miyabi-a2a`, `knowledge`, `web-api`, `telegram`, `e2e-tests`, `historical`, `business-api`, `discord-mcp-server`).
- `jsonwebtoken` 9.3.1 → 10.2.0 (`miyabi-a2a`, `miyabi-web-api`).
- `redis` 0.27.6 → 0.32.7 (`miyabi-web-api`).
- `tower` 0.4.13 → 0.5.2 and `tower-http` 0.5.2 → 0.6.6 (`miyabi-historical`, `knowledge`).
- `qdrant-client` 1.15.0 → 1.16.0 (`miyabi-knowledge`, `miyabi-historical`).
- `thiserror` 1.0.69 → 2.0.17 (`miyabi-claudable`, `miyabi-modes`, `miyabi-discord-mcp-server`).
- `bytes` 1.10.1 → 1.11.0 (`miyabi-llm*` crates).
- `clap` 4.5.51 → 4.5.53 (`miyabi-cli`, `miyabi-mcp-server`, `miyabi-benchmark`, `miyabi-discord-mcp-server`); `open` 5.3.2 → 5.3.3 (`miyabi-cli`).
- `rmcp` 0.8.5 → 0.9.0 and `schemars` 0.8.22 → 1.1.0 (`miyabi-mcp-template`).
- AWS SDK patch bumps (`aws-config` 1.8.10 → 1.8.11, service crates +2–4 patch levels) for `miyabi-aws-agent`.

## Artifacts
- Raw audit JSON: `.ai/logs/task-6-dep-audit/cargo-audit.json`
- Outdated summary: `.ai/logs/task-6-dep-audit/cargo-outdated-root.txt`
