# Miyabi Historical API

Axum-based REST API server for historical AI chatbot with RAG (Retrieval-Augmented Generation).

## Features

- **Historical Figure Chat**: Chat with 3 historical figures (織田信長, 坂本龍馬, 徳川家康)
- **RAG Integration**: Uses `miyabi-historical-ai` for knowledge retrieval from Wikipedia
- **Claude AI**: Powered by Anthropic Claude API via `miyabi-llm`
- **CORS Enabled**: Cross-origin requests supported
- **Request Tracing**: Built-in HTTP request tracing with `tower-http`

## Prerequisites

```bash
# Required environment variable
export ANTHROPIC_API_KEY=sk-ant-xxx

# Optional: custom port (default: 3000)
export PORT=8080
```

## Installation

```bash
# Build the server
cargo build --release --bin miyabi-historical-api

# Or run directly
cargo run --bin miyabi-historical-api
```

## Running the Server

```bash
# Development mode
cargo run --bin miyabi-historical-api

# Production mode
./target/release/miyabi-historical-api
```

The server will start on `http://0.0.0.0:3000` (or custom PORT).

## API Specification

### POST `/api/chat`

Chat with a historical figure.

#### Request Body

```json
{
  "figure": "oda_nobunaga",
  "message": "新規事業の判断に迷っています",
  "user_id": "user_123"
}
```

**Fields:**
- `figure` (string, required): Historical figure identifier
  - Available: `"oda_nobunaga"`, `"sakamoto_ryoma"`, `"tokugawa_ieyasu"`
- `message` (string, required): User's question or message
- `user_id` (string, required): User identifier for session tracking

#### Response (Success)

```json
{
  "reply": "その迷いは不要であろう。まずは市場の動向を冷静に分析せよ。...",
  "sources": [
    "wikipedia: 織田信長は桶狭間の戦いで今川義元を破った...",
    "wikipedia: 信長は楽市楽座を導入し、経済改革を推進した..."
  ],
  "timestamp": "2025-10-25T12:00:00Z",
  "figure": "oda_nobunaga"
}
```

**Fields:**
- `reply` (string): AI-generated response in character
- `sources` (array): RAG retrieved sources (may be empty)
- `timestamp` (string): ISO 8601 timestamp
- `figure` (string): The figure that responded

#### Response (Error)

```json
{
  "error": "Invalid figure 'unknown_person'. Available: [\"oda_nobunaga\", \"sakamoto_ryoma\", \"tokugawa_ieyasu\"]",
  "code": "BAD_REQUEST"
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid figure name or malformed request
- `500 Internal Server Error`: LLM API failure or internal error
- `504 Gateway Timeout`: Request timeout

## Example Usage

### Using curl

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "figure": "oda_nobunaga",
    "message": "経営戦略について教えて",
    "user_id": "test_user"
  }'
```

### Using httpie

```bash
http POST localhost:3000/api/chat \
  figure=sakamoto_ryoma \
  message="新しい時代を切り開くには？" \
  user_id=demo_user
```

### Using JavaScript

```javascript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    figure: 'tokugawa_ieyasu',
    message: '長期的な成功のための戦略は？',
    user_id: 'web_user_001',
  }),
});

const data = await response.json();
console.log(data.reply);
console.log('Sources:', data.sources);
```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/chat
       ▼
┌──────────────────────────────────┐
│     Axum HTTP Server             │
│  ┌────────────────────────────┐  │
│  │  routes/chat.rs            │  │
│  │  1. Validate figure        │  │
│  │  2. Load character         │  │
│  │  3. RAG search             │  │
│  │  4. Build prompts          │  │
│  │  5. Call LLM               │  │
│  └────────────────────────────┘  │
└──────┬──────────────────┬────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌─────────────┐
│ miyabi-      │   │ miyabi-llm  │
│ historical-  │   │ (Claude API)│
│ ai (RAG)     │   └─────────────┘
└──────────────┘
```

## Components

### Models (`models.rs`)
- `ChatRequest`: API request structure
- `ChatResponse`: API response structure
- `ErrorResponse`: Error response structure

### State (`state.rs`)
- `AppState`: Shared application state
- Holds `AnthropicClient` (Arc-wrapped)

### Routes (`routes/chat.rs`)
- `chat_handler`: Main POST /api/chat handler
- `ApiError`: Custom error types with proper HTTP status codes

### Main (`main.rs`)
- Axum server setup
- CORS middleware
- Tracing configuration
- Server initialization

## Error Handling

The API provides detailed error messages:

1. **Invalid Figure Name** (400)
   ```json
   {
     "error": "Invalid figure 'unknown'. Available: [...]",
     "code": "BAD_REQUEST"
   }
   ```

2. **LLM API Failure** (500)
   ```json
   {
     "error": "AI service error: API timeout",
     "code": "INTERNAL_SERVER_ERROR"
   }
   ```

3. **RAG Search Failure** (Non-blocking)
   - RAG failures are logged but don't fail the request
   - Response continues without `sources`

## Logging

Structured logging with `tracing`:

```
[2025-10-25T12:00:00Z INFO  miyabi_historical_api] 🚀 Starting Miyabi Historical API Server
[2025-10-25T12:00:00Z INFO  miyabi_historical_api] ✅ Application state initialized
[2025-10-25T12:00:00Z INFO  miyabi_historical_api] 🎯 Server listening on http://0.0.0.0:3000
[2025-10-25T12:00:01Z INFO  miyabi_historical_api::routes::chat] Chat request: figure=oda_nobunaga, user=test_user, message_len=42
[2025-10-25T12:00:01Z INFO  miyabi_historical_api::routes::chat] Loaded character: 織田信長
[2025-10-25T12:00:02Z INFO  miyabi_historical_api::routes::chat] Found 3 relevant documents
[2025-10-25T12:00:03Z INFO  miyabi_historical_api::routes::chat] Received LLM response: 1234 chars
[2025-10-25T12:00:03Z INFO  miyabi_historical_api::routes::chat] Chat request completed successfully
```

## Testing

```bash
# Run tests
cargo test --package miyabi-historical-api

# With logs
RUST_LOG=debug cargo test --package miyabi-historical-api
```

## Dependencies

- **axum** 0.7: Web framework
- **tower** / **tower-http**: Middleware (CORS, tracing)
- **tokio**: Async runtime
- **miyabi-historical-ai**: RAG pipeline
- **miyabi-llm**: LLM client (Claude API)
- **serde** / **serde_json**: Serialization
- **tracing** / **tracing-subscriber**: Logging

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | - | Anthropic API key |
| `PORT` | No | 3000 | Server port |
| `RUST_LOG` | No | `miyabi_historical_api=info` | Log level |

## Performance

- **Latency**: ~2-5 seconds (RAG + LLM inference)
- **Concurrency**: Handles concurrent requests via tokio runtime
- **Memory**: ~100-200 MB (with Qdrant client)

## Future Enhancements

- [ ] Rate limiting (per user_id)
- [ ] WebSocket support for streaming responses
- [ ] Conversation history tracking
- [ ] Multi-turn dialogue support
- [ ] Custom character support
- [ ] Metrics endpoint (Prometheus)
- [ ] Health check endpoint (`GET /health`)

## License

Apache-2.0

## Author

Shunsuke Hayashi <supernovasyun@gmail.com>
