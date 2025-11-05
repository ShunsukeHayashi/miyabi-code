# miyabi-llm-google

Google Gemini API client for Miyabi LLM - Provider-specific implementation.

[![Crates.io](https://img.shields.io/crates/v/miyabi-llm-google.svg)](https://crates.io/crates/miyabi-llm-google)
[![Documentation](https://docs.rs/miyabi-llm-google/badge.svg)](https://docs.rs/miyabi-llm-google)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Features

- **Gemini 1.5 Pro and Flash models** - High-quality and fast inference
- **Streaming responses** - Real-time text generation via Server-Sent Events
- **Tool (function) calling** - Execute functions with structured parameters
- **Multi-turn conversations** - Context-aware dialogue
- **Type-safe API** - Strongly typed Rust interface
- **Async/await support** - Built on Tokio runtime
- **Unified LLM interface** - Compatible with `miyabi-llm-core` traits

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
miyabi-llm-google = "0.1"
```

Or use the unified `miyabi-llm` crate for multi-provider support:

```toml
[dependencies]
miyabi-llm = "0.1"
```

## Quick Start

```rust
use miyabi_llm_google::GoogleClient;
use miyabi_llm_core::{LlmClient, Message, Role};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client from environment variable (GOOGLE_API_KEY or GEMINI_API_KEY)
    let client = GoogleClient::from_env()?
        .with_flash()  // Use Gemini 1.5 Flash (faster, cheaper)
        .with_temperature(0.7);

    // Simple chat
    let messages = vec![
        Message::new(Role::User, "What is Rust?".to_string()),
    ];

    let response = client.chat(messages).await?;
    println!("Response: {}", response);

    Ok(())
}
```

## Usage Examples

### Basic Chat

```rust
use miyabi_llm_google::GoogleClient;
use miyabi_llm_core::{LlmClient, Message, Role};

let client = GoogleClient::new("your-api-key".to_string())
    .with_pro()  // Use Gemini 1.5 Pro (default)
    .with_max_tokens(2048);

let messages = vec![
    Message::new(Role::User, "Explain quantum computing".to_string()),
];

let response = client.chat(messages).await?;
println!("{}", response);
```

### Streaming Responses

```rust
use miyabi_llm_google::GoogleClient;
use miyabi_llm_core::{LlmStreamingClient, Message, Role};
use futures::StreamExt;

let client = GoogleClient::from_env()?.with_flash();

let messages = vec![
    Message::new(Role::User, "Write a short story about AI".to_string()),
];

let mut stream = client.chat_stream(messages).await?;

while let Some(chunk) = stream.next().await {
    match chunk {
        Ok(text) => print!("{}", text),
        Err(e) => eprintln!("Stream error: {}", e),
    }
}
```

### Tool (Function) Calling

```rust
use miyabi_llm_google::GoogleClient;
use miyabi_llm_core::{LlmClient, Message, Role, ToolDefinition, ToolCallResponse};
use serde_json::json;

let client = GoogleClient::from_env()?;

let messages = vec![
    Message::new(Role::User, "What's the weather in Tokyo?".to_string()),
];

let tools = vec![
    ToolDefinition {
        name: "get_weather".to_string(),
        description: "Get current weather for a location".to_string(),
        parameters: json!({
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name"
                }
            },
            "required": ["location"]
        }),
    },
];

let response = client.chat_with_tools(messages, tools).await?;

match response {
    ToolCallResponse::ToolCalls(calls) => {
        for call in calls {
            println!("Function: {} with args: {:?}", call.name, call.arguments);
        }
    }
    ToolCallResponse::Conclusion { text } => {
        println!("Final answer: {}", text);
    }
}
```

### Multi-turn Conversation

```rust
use miyabi_llm_google::GoogleClient;
use miyabi_llm_core::{LlmClient, Message, Role};

let client = GoogleClient::from_env()?;

let messages = vec![
    Message::new(Role::User, "Hello! My name is Alice.".to_string()),
    Message::new(Role::Assistant, "Hello Alice! How can I help you today?".to_string()),
    Message::new(Role::User, "What was my name?".to_string()),
];

let response = client.chat(messages).await?;
println!("{}", response);  // Should mention "Alice"
```

## Configuration

### Model Selection

```rust
// Gemini 1.5 Pro (default) - Higher quality, slower
let client = GoogleClient::from_env()?.with_pro();

// Gemini 1.5 Flash - Faster, cheaper, good quality
let client = GoogleClient::from_env()?.with_flash();

// Custom model
let client = GoogleClient::from_env()?.with_model("gemini-1.5-pro-latest");
```

### Generation Parameters

```rust
let client = GoogleClient::from_env()?
    .with_max_tokens(4096)      // Maximum output tokens
    .with_temperature(0.7);     // Randomness (0.0-1.0)
```

### Environment Variables

Set one of these environment variables:

```bash
export GOOGLE_API_KEY="your-gemini-api-key"
# or
export GEMINI_API_KEY="your-gemini-api-key"
```

Get your API key from: [Google AI Studio](https://makersuite.google.com/app/apikey)

## API Reference

### `GoogleClient`

#### Methods

- `new(api_key: String) -> Self` - Create client with API key
- `from_env() -> Result<Self>` - Create from environment variable
- `with_pro(self) -> Self` - Use Gemini 1.5 Pro model
- `with_flash(self) -> Self` - Use Gemini 1.5 Flash model
- `with_model(self, model: impl Into<String>) -> Self` - Set custom model
- `with_max_tokens(self, max_tokens: i32) -> Self` - Set max output tokens
- `with_temperature(self, temperature: f32) -> Self` - Set temperature (0.0-1.0)

### `LlmClient` Trait

- `async fn chat(&self, messages: Vec<Message>) -> Result<String>` - Basic chat completion
- `async fn chat_with_tools(&self, messages: Vec<Message>, tools: Vec<ToolDefinition>) -> Result<ToolCallResponse>` - Chat with function calling
- `fn provider_name(&self) -> &str` - Returns "google"
- `fn model_name(&self) -> &str` - Returns current model name

### `LlmStreamingClient` Trait

- `async fn chat_stream(&self, messages: Vec<Message>) -> Result<StreamResponse>` - Streaming chat completion

## Error Handling

```rust
use miyabi_llm_core::LlmError;

match client.chat(messages).await {
    Ok(response) => println!("{}", response),
    Err(LlmError::MissingApiKey(var)) => {
        eprintln!("Missing API key: {}", var);
    }
    Err(LlmError::NetworkError(msg)) => {
        eprintln!("Network error: {}", msg);
    }
    Err(LlmError::ApiError(msg)) => {
        eprintln!("API error: {}", msg);
    }
    Err(LlmError::ParseError(msg)) => {
        eprintln!("Parse error: {}", msg);
    }
    Err(e) => eprintln!("Other error: {}", e),
}
```

## Pricing

Gemini 1.5 pricing (as of 2024):

| Model | Input | Output |
|-------|-------|--------|
| Gemini 1.5 Pro | $0.00125 / 1K tokens | $0.005 / 1K tokens |
| Gemini 1.5 Flash | $0.000075 / 1K tokens | $0.0003 / 1K tokens |

*Flash is ~17x cheaper than Pro for input and ~16x cheaper for output.*

## Comparison with Other Providers

| Feature | Gemini 1.5 Pro | Gemini 1.5 Flash | Claude 3.5 | GPT-4o |
|---------|---------------|-----------------|-----------|--------|
| Max tokens | 8192 | 8192 | 4096 | 16384 |
| Context window | 2M tokens | 1M tokens | 200K | 128K |
| Speed | Medium | Fast | Medium | Medium |
| Cost | Low | Very Low | High | Medium |
| Tool calling | ✅ | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ | ✅ |

## Examples

See the `examples/` directory for more:

- `basic_chat.rs` - Simple chat example
- `streaming.rs` - Streaming responses
- `tool_calling.rs` - Function calling example
- `conversation.rs` - Multi-turn dialogue

Run examples:

```bash
cargo run --example basic_chat
```

## Testing

Run tests:

```bash
cargo test --package miyabi-llm-google
```

**Note**: Some tests require `GOOGLE_API_KEY` or `GEMINI_API_KEY` environment variable.

## Integration with `miyabi-llm`

This crate is designed to be used via the unified `miyabi-llm` interface:

```rust
use miyabi_llm::{GoogleClient, LlmClient};

let client = GoogleClient::from_env()?;
let response = client.chat(messages).await?;
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](../../LICENSE) for details.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Links

- [Documentation](https://docs.rs/miyabi-llm-google)
- [GitHub Repository](https://github.com/ShunsukeHayashi/Miyabi)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
