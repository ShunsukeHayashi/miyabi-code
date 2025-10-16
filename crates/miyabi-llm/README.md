# miyabi-llm

LLM abstraction layer for Miyabi - GPT-OSS-20B integration

## Features

- **Provider abstraction**: Unified trait for all LLM providers
- **GPT-OSS-20B support**: Native support for OpenAI's open-source model (Apache 2.0 license)
- **Multiple backends**: vLLM, Ollama, Groq
- **Async/await**: Built on tokio for high performance
- **Function calling**: Support for structured function calls (planned)
- **Reasoning levels**: Low, Medium, High reasoning effort

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
miyabi-llm = { version = "1.0.0", path = "../miyabi-llm" }
```

## Quick Start

### Groq (Recommended for quick start)

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest, ReasoningEffort};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize Groq provider
    let provider = GPTOSSProvider::new_groq("gsk_xxxxx")?;

    // Create request
    let request = LLMRequest::new("Write a Rust function to calculate factorial")
        .with_temperature(0.2)
        .with_max_tokens(512)
        .with_reasoning_effort(ReasoningEffort::Medium);

    // Generate response
    let response = provider.generate(&request).await?;
    println!("Generated: {}", response.text);
    println!("Tokens used: {}", response.tokens_used);

    Ok(())
}
```

### vLLM (Recommended for production)

```bash
# Start vLLM server
vllm serve openai/gpt-oss-20b
```

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize vLLM provider
    let provider = GPTOSSProvider::new_vllm("http://localhost:8000")?;

    // Create request
    let request = LLMRequest::new("Explain Rust ownership");

    // Generate response
    let response = provider.generate(&request).await?;
    println!("{}", response.text);

    Ok(())
}
```

### Ollama (Recommended for development)

```bash
# Pull model
ollama pull gpt-oss:20b

# Run model
ollama run gpt-oss:20b
```

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize Ollama provider
    let provider = GPTOSSProvider::new_ollama()?;

    // Create request
    let request = LLMRequest::new("Write a hello world program in Rust");

    // Generate response
    let response = provider.generate(&request).await?;
    println!("{}", response.text);

    Ok(())
}
```

## API Reference

### `LLMProvider` trait

Core trait for all LLM providers.

```rust
#[async_trait]
pub trait LLMProvider: Send + Sync {
    /// Generate text from a prompt
    async fn generate(&self, request: &LLMRequest) -> Result<LLMResponse>;

    /// Chat completion with message history
    async fn chat(&self, messages: &[ChatMessage]) -> Result<ChatMessage>;

    /// Call a function using function calling
    async fn call_function(&self, name: &str, args: serde_json::Value) -> Result<serde_json::Value>;

    /// Get model name
    fn model_name(&self) -> &str;

    /// Get maximum tokens supported
    fn max_tokens(&self) -> usize;
}
```

### `GPTOSSProvider`

GPT-OSS-20B provider implementation.

**Constructors**:
- `GPTOSSProvider::new_groq(api_key)` - Groq provider
- `GPTOSSProvider::new_vllm(endpoint)` - vLLM provider
- `GPTOSSProvider::new_ollama()` - Ollama provider

**Builder methods**:
- `.with_model(model)` - Set custom model name
- `.with_timeout(duration)` - Set request timeout

### `LLMRequest`

Request configuration for LLM inference.

```rust
pub struct LLMRequest {
    pub prompt: String,
    pub temperature: f32,
    pub max_tokens: usize,
    pub reasoning_effort: ReasoningEffort,
}
```

**Builder methods**:
- `LLMRequest::new(prompt)` - Create new request with defaults
- `.with_temperature(temp)` - Set temperature (0.0-2.0)
- `.with_max_tokens(tokens)` - Set max tokens
- `.with_reasoning_effort(effort)` - Set reasoning level

### `ReasoningEffort`

Reasoning effort level for inference.

- `ReasoningEffort::Low` - Fast inference for simple tasks
- `ReasoningEffort::Medium` - Balanced quality and speed (default)
- `ReasoningEffort::High` - High quality reasoning for complex tasks

### `LLMResponse`

Response from LLM inference.

```rust
pub struct LLMResponse {
    pub text: String,
    pub tokens_used: u32,
    pub finish_reason: String,
    pub function_call: Option<FunctionCall>,
}
```

## Chat Completion

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, ChatMessage};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let provider = GPTOSSProvider::new_groq("gsk_xxxxx")?;

    let messages = vec![
        ChatMessage::system("You are a helpful Rust programming assistant"),
        ChatMessage::user("How do I create a Vec in Rust?"),
    ];

    let response = provider.chat(&messages).await?;
    println!("{}", response.content);

    Ok(())
}
```

## Error Handling

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest, LLMError};

#[tokio::main]
async fn main() {
    let provider = GPTOSSProvider::new_groq("invalid_key").unwrap();
    let request = LLMRequest::new("test");

    match provider.generate(&request).await {
        Ok(response) => println!("{}", response.text),
        Err(LLMError::ApiError(msg)) => eprintln!("API error: {}", msg),
        Err(LLMError::Timeout(ms)) => eprintln!("Timeout after {}ms", ms),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

## Cost Comparison

### Groq (Pay-per-use)

- **Input**: $0.10 / 1M tokens
- **Output**: $0.50 / 1M tokens
- **Speed**: 1000+ tokens/second
- **Best for**: Prototyping, low-frequency use

**Example cost** (500 Agent executions/month):
- Input: 1M tokens × $0.10 = $0.10
- Output: 0.5M tokens × $0.50 = $0.25
- **Total: $0.35/month** ($4.20/year)

### vLLM (Self-hosted)

- **Infrastructure**: AWS p3.2xlarge @ $3.06/hour
- **Monthly**: $2,203 (24/7) or $539 (8h/day × 22days)
- **Best for**: Production, high-frequency use

### Ollama (Local)

- **Hardware**: NVIDIA RTX 4080 16GB (~$1,200)
- **Electricity**: ~$6.76/month
- **Best for**: Development, privacy-sensitive applications

## Performance

| Provider | Speed | Latency | Cost/1M tokens |
|----------|-------|---------|----------------|
| Groq     | 1000+ t/s | ~1-2s | $0.10 in, $0.50 out |
| vLLM     | 500-1000 t/s | ~2-3s | Self-hosted |
| Ollama   | 50-100 t/s | ~5-15s | Self-hosted |

## Configuration

### Environment Variables

```bash
# Groq API key (required for Groq provider)
export GROQ_API_KEY="gsk_xxxxxxxxxxxxx"

# vLLM endpoint (optional, default: http://localhost:8000)
export VLLM_ENDPOINT="http://localhost:8000"

# Ollama endpoint (optional, default: http://localhost:11434)
export OLLAMA_ENDPOINT="http://localhost:11434"
```

### .miyabi.yml

```yaml
llm:
  provider: "groq"  # "vllm" | "ollama" | "groq"

  groq:
    api_key: "${GROQ_API_KEY}"
    model: "openai/gpt-oss-20b"

  vllm:
    endpoint: "http://localhost:8000"

  ollama:
    model: "gpt-oss:20b"

  default_temperature: 0.2
  default_max_tokens: 4096
  default_reasoning_effort: "medium"
```

## Testing

```bash
# Run tests
cargo test --package miyabi-llm

# Run tests with output
cargo test --package miyabi-llm -- --nocapture

# Run specific test
cargo test --package miyabi-llm test_provider_creation_groq
```

## Examples

See the [examples/](examples/) directory for more examples:

- `basic.rs` - Basic usage example
- `chat.rs` - Chat completion example
- `streaming.rs` - Streaming responses (planned)
- `function_calling.rs` - Function calling example (planned)

## Roadmap

- [x] Core LLMProvider trait
- [x] GPTOSSProvider implementation
- [x] Groq support
- [x] vLLM support
- [x] Ollama support
- [x] Basic chat completion
- [ ] Streaming responses
- [ ] Function calling
- [ ] Token counting utilities
- [ ] Retry logic with exponential backoff
- [ ] Response caching

## License

Apache-2.0

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Related Projects

- [Miyabi](https://github.com/ShunsukeHayashi/Miyabi) - Complete autonomous AI development operations platform
- [miyabi-agents](../miyabi-agents/) - Agent implementations using miyabi-llm
- [GPT-OSS](https://github.com/openai/gpt-oss) - OpenAI's open-source model

## References

- [OpenAI GPT-OSS Official Announcement](https://openai.com/index/introducing-gpt-oss/)
- [Hugging Face Model Card](https://huggingface.co/openai/gpt-oss-20b)
- [vLLM Documentation](https://docs.vllm.ai/projects/recipes/en/latest/OpenAI/GPT-OSS.html)
- [Ollama Documentation](https://ollama.com/library/gpt-oss:20b)
- [Groq API Documentation](https://console.groq.com/docs/model/openai/gpt-oss-20b)
