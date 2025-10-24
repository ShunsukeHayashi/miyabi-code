# Claude Agent SDK Migration Note

**Date**: 2025-10-25
**Status**: For Awareness Only - No Action Required

## SDK Rename: Claude Code SDK → Claude Agent SDK

Anthropic has renamed their SDK from **Claude Code SDK** to **Claude Agent SDK** to better reflect its capabilities beyond coding tasks.

### Changes

| Aspect | Old | New |
|--------|-----|-----|
| **TypeScript/JS Package** | `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| **Python Package** | `claude-code-sdk` | `claude-agent-sdk` |
| **Documentation Location** | Claude Code docs → SDK section | API Guide → Agent SDK section |

## Impact on Miyabi: None

**Miyabi does not use the TypeScript or Python SDKs.**

Instead, Miyabi uses:
- **Direct HTTP API** via Anthropic's REST API
- **Rust HTTP Client** (`reqwest` crate)
- **Custom LLM abstraction** (`miyabi-llm` crate)

### Current Implementation

```rust
// crates/miyabi-llm/src/providers/anthropic.rs
use reqwest::Client;

pub struct AnthropicClient {
    client: Client,
    api_key: String,
    base_url: String,
}

impl AnthropicClient {
    pub async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>,
    ) -> Result<ToolCallResponse> {
        // Direct HTTP POST to https://api.anthropic.com/v1/messages
        let response = self.client
            .post(&format!("{}/v1/messages", self.base_url))
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&request_body)
            .send()
            .await?;

        // Parse response and return
        Ok(tool_call_response)
    }
}
```

## Related Documentation

- **Anthropic API Docs**: https://docs.anthropic.com/claude/reference
- **Agent SDK Overview**: https://docs.anthropic.com/ja/api/agent-sdk/overview
- **Migration Guide**: (Shared by user on 2025-10-25)

## References in Codebase

All references to "Claude Code" in Miyabi codebase refer to:
1. **Claude Code CLI Tool** (Anthropic's official CLI)
2. **Inspiration/comparison** for autonomous agent design
3. **Documentation references**

**No SDK package dependencies** exist in:
- `Cargo.toml` files (Rust)
- `package.json` files (TypeScript - legacy)
- `requirements.txt` files (Python - none)

## Future Considerations

If Miyabi adds a TypeScript/Python SDK wrapper in the future:
- Use `@anthropic-ai/claude-agent-sdk` (not claude-code)
- Use `claude-agent-sdk` Python package
- Follow migration guide for breaking changes (system prompts, settings)

---

**Note**: This document is for awareness only. No code changes required in Miyabi project.
