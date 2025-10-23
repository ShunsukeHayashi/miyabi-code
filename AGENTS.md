# Repository Guidelines

## Project Structure & Module Organization
- `crates/` contains the Rust workspace: `miyabi-core` (shared services), `miyabi-types` (entities), `miyabi-agents` (agent runtime), and `miyabi-cli` (binary entrypoint).
- Legacy TypeScript utilities sit in `packages/`; consult migration tickets before modifying them. Shared docs live in `docs/`, while agent prompts and specs are under `.claude/agents/`.
- Integration assets live in `tests/`, `examples/`, and `assets/`; keep fixtures minimal and update them when API contracts change.

## Build, Test, and Development Commands
- `cargo build` / `cargo build --release`: compile the full workspace in debug or optimized mode.
- `cargo test --all`: run unit, integration, and doc tests; use `cargo test -p <crate>` for targeted loops.
- `cargo clippy -- -D warnings` and `cargo fmt`: enforce lint and formatting gates before committing.
- `pnpm test` and `pnpm typecheck`: exercise Vitest suites and TypeScript types used by MCP adapters.
- `pnpm mcp:test`: execute the scripted end-to-end MCP diagnostics in `scripts/test-mcp.sh`.

## Coding Style & Naming Conventions
- Follow Rust 2021 spacing (four-space indents), `snake_case` for functions/modules, `UpperCamelCase` for types, and `SCREAMING_SNAKE_CASE` for constants.
- Document every public item with `///`; prefer explicit error types or `anyhow::Result` at boundaries.
- Use feature flags for experimental code paths; avoid unchecked `unwrap` outside tests.
- For TypeScript, retain ESLint defaults: PascalCase classes, camelCase members, and kebab-case directories.

## Testing Guidelines
- Co-locate unit tests with source modules and place integration tests in top-level `tests/` using `#[tokio::test]` for async flows.
- Snapshot-heavy features should rely on `insta`; check new snapshots into `tests/fixtures` and review diffs carefully.
- Aim for 80% coverage; call out intentional gaps in the PR description and include the commands you ran locally.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`); add agent context when relevant (`feat(codegen): enable batching`).
- Link the driving issue, apply the correct state/agent labels, and provide before/after evidence for CLI or UX updates.
- PRs must list executed build/test commands and MCP diagnostics; request reviewers defined in `CODEOWNERS` and wait for green CI.

## Security & Configuration Tips
- Keep secrets in environment variables (`GITHUB_TOKEN`, `ANTHROPIC_API_KEY`); never commit `.miyabi.yml` with credentials.
- Run `pnpm mcp:diagnose` and `cargo audit` after dependency bumps, and document any temporary exceptions in `SECURITY.md`.
