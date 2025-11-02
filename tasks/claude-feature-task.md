# Claude Code Task: Feature Implementation

## Task: Add Health Check Endpoint

Implement a simple health check endpoint for the Miyabi API.

### Requirements:
1. Create a new endpoint: `GET /health`
2. Return JSON: `{"status": "ok", "timestamp": "<current_time>"}`
3. Add test coverage

### Files to modify:
- `crates/miyabi-web-api/src/routes/mod.rs`
- `crates/miyabi-web-api/src/handlers/health.rs` (new file)

### Expected output:
```json
{
  "status": "ok",
  "timestamp": "2025-01-02T06:35:00Z"
}
```

Please implement this and show progress.
