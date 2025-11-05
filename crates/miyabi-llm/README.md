# miyabi-llm

Unified LLM abstraction layer for Miyabi - Multi-provider support with intelligent routing.

[![Crates.io](https://img.shields.io/crates/v/miyabi-llm.svg)](https://crates.io/crates/miyabi-llm)
[![Documentation](https://docs.rs/miyabi-llm/badge.svg)](https://docs.rs/miyabi-llm)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Features

- **3 LLM Providers**: Anthropic Claude, OpenAI GPT, Google Gemini
- **Intelligent Routing**: 3-tier cost-optimized HybridRouter (75% cost savings)
- **Streaming Support**: Real-time text generation via Server-Sent Events
- **Tool Calling**: Structured function calls with JSON schema validation
- **Async/await**: Built on tokio for high performance
- **Type-safe API**: Strongly typed Rust interface
- **Unified Interface**: Same API across all providers

## Installation

```toml
[dependencies]
miyabi-llm = "0.1"
```

## Quick Start

### HybridRouter (Recommended)

Intelligent routing with 75% cost savings:

```rust
use miyabi_llm::{HybridRouter, LlmClient, Message, Role};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create router from environment variables
    let router = HybridRouter::from_env()?;

    // Simple tasks → GPT-4o-mini ($0.15/1M)
    let messages = vec![Message::new(
        Role::User,
        "Add documentation for this function".to_string()
    )];
    let response = router.chat(messages).await?;
    println!("{}", response);

    Ok(())
}
```

### Individual Providers

#### Anthropic Claude - Best for complex reasoning

```rust
use miyabi_llm::{AnthropicClient, LlmClient, Message, Role};

let claude = AnthropicClient::from_env()?.with_sonnet();
let messages = vec![Message::new(Role::User, "Explain quantum computing".to_string())];
let response = claude.chat(messages).await?;
```

#### OpenAI GPT - Best for simple, fast tasks

```rust
use miyabi_llm::{OpenAIClient, LlmClient, Message, Role};

let openai = OpenAIClient::from_env()?.with_gpt4o_mini();
let messages = vec![Message::new(Role::User, "Fix this typo".to_string())];
let response = openai.chat(messages).await?;
```

#### Google Gemini - Best for medium complexity

```rust
use miyabi_llm::{GoogleClient, LlmClient, Message, Role};

let google = GoogleClient::from_env()?.with_flash();
let messages = vec![Message::new(Role::User, "Implement REST API".to_string())];
let response = google.chat(messages).await?;
```

## Streaming

Real-time text generation:

```rust
use miyabi_llm::{GoogleClient, LlmStreamingClient, Message, Role};
use futures::StreamExt;

let client = GoogleClient::from_env()?.with_flash();
let messages = vec![Message::new(Role::User, "Write a story".to_string())];

let mut stream = client.chat_stream(messages).await?;
while let Some(chunk) = stream.next().await {
    match chunk {
        Ok(text) => print!("{}", text),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

## Tool Calling

Function calling with JSON schema:

```rust
use miyabi_llm::{AnthropicClient, LlmClient, Message, Role, ToolDefinition, ToolCallResponse};
use serde_json::json;

let client = AnthropicClient::from_env()?;
let messages = vec![Message::new(Role::User, "What's the weather in Tokyo?".to_string())];

let tools = vec![ToolDefinition {
    name: "get_weather".to_string(),
    description: "Get current weather".to_string(),
    parameters: json!({
        "type": "object",
        "properties": {
            "location": {"type": "string"}
        },
        "required": ["location"]
    }),
}];

let response = client.chat_with_tools(messages, tools).await?;
match response {
    ToolCallResponse::ToolCalls(calls) => {
        for call in calls {
            println!("Function: {} with args: {:?}", call.name, call.arguments);
        }
    }
    ToolCallResponse::Conclusion { text } => println!("{}", text),
}
```

## HybridRouter - 3-Tier Intelligent Routing

### Cost Optimization Strategy

| Complexity | Provider | Cost/1M tokens | Use Cases |
|------------|----------|----------------|-----------|
| Simple | GPT-4o-mini | $0.15 | Documentation, typos, formatting |
| Medium | Gemini Flash | $0.20 | API endpoints, tests, bug fixes |
| Complex | Claude Sonnet | $3.00 | Architecture, refactoring, security |

### Automatic Routing

The router analyzes your prompts and automatically routes to the optimal provider:

```rust
use miyabi_llm::{HybridRouter, LlmClient, Message, Role};

let router = HybridRouter::from_env()?;

// Simple task → GPT-4o-mini
let response1 = router.chat(vec![Message::new(
    Role::User,
    "Add documentation comment".to_string()
)]).await?;

// Medium task → Gemini Flash
let response2 = router.chat(vec![Message::new(
    Role::User,
    "Implement API endpoint".to_string()
)]).await?;

// Complex task → Claude Sonnet
let response3 = router.chat(vec![Message::new(
    Role::User,
    "Refactor authentication system".to_string()
)]).await?;
```

### Cost Metrics

Track cost savings in real-time:

```rust
let metrics = router.get_metrics().await;
println!("Total requests: {}", metrics.total_requests());
println!("Total tokens: {}", metrics.total_tokens());
println!("Actual cost: ${:.4}", metrics.estimated_cost_usd);
println!("Savings: {:.1}%", metrics.savings_percentage());
```

**Expected savings**: 75% cost reduction vs pure Claude approach

## Environment Variables

```bash
# Required API keys
export ANTHROPIC_API_KEY="sk-ant-xxx"
export OPENAI_API_KEY="sk-xxx"
export GOOGLE_API_KEY="xxx"  # or GEMINI_API_KEY
```

Get your API keys:
- [Anthropic Console](https://console.anthropic.com/)
- [OpenAI Platform](https://platform.openai.com/)
- [Google AI Studio](https://makersuite.google.com/app/apikey)

## Provider Comparison

### Models

| Provider | Model | Context | Max Output | Speed | Cost (in/out per 1M) |
|----------|-------|---------|------------|-------|---------------------|
| Anthropic | Claude 3.5 Sonnet | 200K | 4K | Medium | $3.00 / $15.00 |
| OpenAI | GPT-4o-mini | 128K | 16K | Fast | $0.15 / $0.60 |
| Google | Gemini 1.5 Flash | 1M | 8K | Fast | $0.075 / $0.30 |
| Google | Gemini 1.5 Pro | 2M | 8K | Medium | $1.25 / $5.00 |

### Features

| Feature | Anthropic | OpenAI | Google |
|---------|-----------|--------|--------|
| Streaming | ✅ | ✅ | ✅ |
| Tool calling | ✅ | ✅ | ✅ |
| Vision | ✅ | ✅ | ✅ |
| JSON mode | ✅ | ✅ | ❌ |

## API Reference

### `LlmClient` Trait

Core trait for all providers:

```rust
#[async_trait]
pub trait LlmClient: Send + Sync {
    async fn chat(&self, messages: Vec<Message>) -> Result<String>;
    async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>
    ) -> Result<ToolCallResponse>;
    fn provider_name(&self) -> &str;
    fn model_name(&self) -> &str;
}
```

### `LlmStreamingClient` Trait

Streaming support:

```rust
#[async_trait]
pub trait LlmStreamingClient: LlmClient {
    async fn chat_stream(&self, messages: Vec<Message>) -> Result<StreamResponse>;
}
```

### `Message`

Chat message structure:

```rust
pub struct Message {
    pub role: Role,  // User, Assistant, System
    pub content: String,
}
```

### `ToolDefinition`

Function definition:

```rust
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,  // JSON Schema
}
```

### `ToolCallResponse`

Tool call result:

```rust
pub enum ToolCallResponse {
    ToolCalls(Vec<ToolCall>),
    Conclusion { text: String },
    NeedApproval { action: String, reason: String },
}
```

## Examples

See the [examples/](examples/) directory:

- [`basic_usage.rs`](examples/basic_usage.rs) - All 3 providers
- [`hybrid_router.rs`](examples/hybrid_router.rs) - Intelligent routing
- [`streaming.rs`](examples/streaming.rs) - Streaming from all providers

Run examples:

```bash
cargo run --example basic_usage
cargo run --example hybrid_router
cargo run --example streaming
```

## Testing

```bash
# Run all tests
cargo test --package miyabi-llm

# Run specific test
cargo test --package miyabi-llm test_hybrid_router

# With output
cargo test --package miyabi-llm -- --nocapture
```

## Error Handling

```rust
use miyabi_llm::{LlmError, AnthropicClient, LlmClient};

match client.chat(messages).await {
    Ok(response) => println!("{}", response),
    Err(LlmError::MissingApiKey(key)) => eprintln!("Missing: {}", key),
    Err(LlmError::NetworkError(msg)) => eprintln!("Network: {}", msg),
    Err(LlmError::ApiError(msg)) => eprintln!("API: {}", msg),
    Err(LlmError::ParseError(msg)) => eprintln!("Parse: {}", msg),
    Err(e) => eprintln!("Error: {}", e),
}
```

## Architecture

```
miyabi-llm/ (Integration crate)
├── miyabi-llm-core/       # Core traits & types
├── miyabi-llm-anthropic/  # Claude client
├── miyabi-llm-openai/     # GPT client
└── miyabi-llm-google/     # Gemini client
```

## Migration Guide

### From v0.1.0 (2-provider) to v0.1.1 (3-provider)

**Before (2 providers)**:

```rust
let router = HybridRouter::new(claude, openai);
```

**After (3 providers)**:

```rust
let router = HybridRouter::new(claude, openai, google);
// or
let router = HybridRouter::from_env()?;  // Recommended
```

**TaskComplexity enum**:

- Added `Medium` variant
- Default changed from `Complex` to `Medium`
- CostMetrics now tracks Google usage

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Apache-2.0

## Links

- [Documentation](https://docs.rs/miyabi-llm)
- [GitHub Repository](https://github.com/ShunsukeHayashi/Miyabi)
- [Miyabi Project](https://github.com/ShunsukeHayashi/Miyabi)

## Provider Documentation

- [Anthropic Claude](https://docs.anthropic.com/)
- [OpenAI GPT](https://platform.openai.com/docs/)
- [Google Gemini](https://ai.google.dev/docs)
