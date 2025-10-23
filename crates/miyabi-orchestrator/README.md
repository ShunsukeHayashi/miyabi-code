# miyabi-orchestrator

The control-plane service that will coordinate long-lived Claude Code sessions for the Miyabi platform. It exposes an HTTP API, session scheduler, and telemetry hooks so agents, web dashboards, and external channels can share the same stateful Claude runtime.

## Current State (2025-10-23)
- Axum-based HTTP server skeleton with a `/healthz` endpoint.
- Command-line flags configure bind address, concurrency limit, Claude CLI binary path, and database URL.
- Environment variables: `CLAUDE_BINARY_PATH`, `MIYABI_ORCHESTRATOR_DATABASE`.
- `SessionScheduler` is a placeholder and will evolve into a proper queue/worker manager.

## Roadmap Highlights
1. Introduce a persistent session store (SQLite → PostgreSQL) and durable message log.
2. Add Claude CLI process management via `tokio::process::Command` and structured job queueing.
3. Ship SSE/WebSocket streaming, Prometheus metrics, and rate-limiting guardrails.
4. Integrate with Miyabi agents, the WebUI dashboard, and the LINE adapter.

For the end-to-end design, see `docs/CLAUDE_SESSION_ORCHESTRATION_PLAN.md`.
