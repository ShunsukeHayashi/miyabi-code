# miyabi-llm-core

Core traits and types for Miyabi LLM - A unified LLM interface for Rust.

## Overview

`miyabi-llm-core` provides the foundational abstractions for interacting with various Large Language Model (LLM) providers. It defines a unified interface that can be implemented by provider-specific crates.

## Features

- **Unified Interface**: Single `LlmClient` trait for all LLM providers
- **Tool Calling**: First-class support for function/tool calling
- **Streaming Support**: Optional streaming via `LlmStreamingClient`
- **Type Safety**: Strong typing for messages, roles, and tool definitions
- **Provider Agnostic**: Works with OpenAI, Anthropic, Google, and more

## Installation

```toml
[dependencies]
miyabi-llm-core = "0.1.0"
```

## Usage

### Basic Chat

```rust
use miyabi_llm_core::{LlmClient, Message};

async fn example(client: impl LlmClient) -> Result<String, Box<dyn std::error::Error>> {
    let messages = vec![
        Message::system("You are a helpful assistant"),
        Message::user("What is the capital of France?"),
    ];

    let response = client.chat(messages).await?;
    println!("Response: {}", response);
    Ok(response)
}
```

### Tool Calling

```rust
use miyabi_llm_core::{LlmClient, Message, ToolDefinition, ToolCallResponse};
use serde_json::json;

async fn tool_example(client: impl LlmClient) -> Result<(), Box<dyn std::error::Error>> {
    let messages = vec![
        Message::user("What's the weather in Tokyo?"),
    ];

    let tools = vec![
        ToolDefinition::new(
            "get_weather",
            "Get current weather for a location"
        ).with_parameter(
            "location",
            "string",
            "City name",
            true
        )
    ];

    match client.chat_with_tools(messages, tools).await? {
        ToolCallResponse::ToolCalls(calls) => {
            println!("LLM wants to call {} tools", calls.len());
        }
        ToolCallResponse::Conclusion(text) => {
            println!("Final answer: {}", text);
        }
        ToolCallResponse::NeedApproval { action, reason } => {
            println!("Need approval: {} ({})", action, reason);
        }
    }

    Ok(())
}
```

### Streaming

```rust
use miyabi_llm_core::{LlmStreamingClient, Message};
use futures::stream::StreamExt;

async fn stream_example(client: impl LlmStreamingClient) -> Result<(), Box<dyn std::error::Error>> {
    let messages = vec![Message::user("Tell me a story")];

    let mut stream = client.chat_stream(messages).await?;

    print!("Response: ");
    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(text) => print!("{}", text),
            Err(e) => eprintln!("Error: {}", e),
        }
    }
    println!();

    Ok(())
}
```

## Provider Implementations

This crate only defines the interfaces. Use provider-specific crates for actual implementations:

- [`miyabi-llm-openai`](https://crates.io/crates/miyabi-llm-openai) - OpenAI (GPT-4o, GPT-4 Turbo, o1)
- [`miyabi-llm-anthropic`](https://crates.io/crates/miyabi-llm-anthropic) - Anthropic (Claude 3.5 Sonnet, Opus)
- [`miyabi-llm-google`](https://crates.io/crates/miyabi-llm-google) - Google (Gemini 1.5 Pro/Flash)
- [`miyabi-llm`](https://crates.io/crates/miyabi-llm) - Unified package with all providers

## Architecture

```
miyabi-llm-core (traits & types)
    ↓ implements
Provider Crates (openai, anthropic, google)
    ↓ unified via
miyabi-llm (integration with HybridRouter)
```

## Types

### Message & Role

```rust
pub struct Message {
    pub role: Role,
    pub content: String,
}

pub enum Role {
    System,
    User,
    Assistant,
}
```

### Tool Definition

```rust
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}
```

### Responses

```rust
pub enum ToolCallResponse {
    ToolCalls(Vec<ToolCall>),
    Conclusion(String),
    NeedApproval { action: String, reason: String },
}
```

## Error Handling

```rust
pub enum LlmError {
    ApiError(String),
    InvalidResponse(String),
    ConfigError(String),
    Timeout(u64),
    MissingApiKey(String),
    // ...
}

pub type Result<T> = std::result::Result<T, LlmError>;
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Links

- [GitHub Repository](https://github.com/ShunsukeHayashi/Miyabi)
- [Documentation](https://docs.rs/miyabi-llm-core)
- [crates.io](https://crates.io/crates/miyabi-llm-core)
