# Miyabi MCP Template Server

**Template for creating new MCP servers in Rust**

This is a template crate for creating new MCP (Model Context Protocol) servers in the Miyabi ecosystem using the official Rust SDK (`rmcp`).

## Quick Start

### 1. Copy the Template

```bash
# Copy this template to create a new server
cp -r crates/miyabi-mcp-template crates/miyabi-mcp-<your-server-name>

# Example: Creating a rules server
cp -r crates/miyabi-mcp-template crates/miyabi-mcp-rules
```

### 2. Update Configuration

Edit `Cargo.toml`:
```toml
[package]
name = "miyabi-mcp-<your-server-name>"
description = "Your server description"
```

### 3. Implement Your Server

Edit `src/server.rs`:
- Add your tool schemas (structs with `#[derive(Debug, Deserialize, JsonSchema)]`)
- Implement your tools with the `#[tool]` macro
- Add server state if needed

### 4. Build and Test

```bash
# Build
cargo build -p miyabi-mcp-<your-server-name>

# Run tests
cargo test -p miyabi-mcp-<your-server-name>

# Run the server
cargo run -p miyabi-mcp-<your-server-name>
```

### 5. Test with MCP Inspector

```bash
# Build release binary
cargo build --release -p miyabi-mcp-<your-server-name>

# Start MCP Inspector
npx @modelcontextprotocol/inspector

# In the Inspector UI:
# - Command: ./target/release/miyabi-mcp-<your-server-name>
# - Args: (leave empty for stdio)
# - Click "Connect"
```

## Template Structure

```
crates/miyabi-mcp-template/
├── Cargo.toml          # Dependencies and metadata
├── README.md           # This file
└── src/
    ├── main.rs         # Entry point with transport setup
    └── server.rs       # Server implementation with tools
```

## Example Tools Included

This template includes 4 example tools:

1. **greet_user**: Greet a user by name with optional repetition
2. **get_server_info**: Get server information and status
3. **echo**: Echo back input for testing
4. **fail_intentionally**: Demonstrate error handling

## Adding New Tools

### Step 1: Define Tool Arguments

```rust
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct MyToolArgs {
    /// Field description (becomes part of the schema)
    pub field1: String,

    /// Optional field
    #[serde(default)]
    pub field2: Option<i32>,
}
```

### Step 2: Implement the Tool

```rust
#[tool(description = "Your tool description")]
async fn my_tool(
    &self,
    args: MyToolArgs,
) -> Result<CallToolResult, McpError> {
    tracing::info!("my_tool called: {:?}", args);

    // Your implementation here

    Ok(CallToolResult::success(vec![
        Content::text("Success!")
    ]))
}
```

### Step 3: Test

```rust
#[tokio::test]
async fn test_my_tool() {
    let server = TemplateServer::new();
    let args = MyToolArgs { /* ... */ };
    let result = server.my_tool(args).await;
    assert!(result.is_ok());
}
```

## Common Patterns

### Accessing Server State

```rust
#[derive(Clone)]
pub struct MyServer {
    tool_router: ToolRouter<MyServer>,
    database: Arc<Mutex<Database>>,  // Add state here
}

#[tool_router]
impl MyServer {
    pub fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
            database: Arc::new(Mutex::new(Database::new())),
        }
    }

    #[tool(description = "Access database")]
    async fn query_db(&self, args: QueryArgs) -> Result<CallToolResult, McpError> {
        let db = self.database.lock().await;
        // Use db
        Ok(/* ... */)
    }
}
```

### Error Handling

```rust
#[tool(description = "Tool that might fail")]
async fn risky_operation(&self, args: Args) -> Result<CallToolResult, McpError> {
    // Return custom error
    if args.invalid {
        return Err(McpError {
            code: -32000,
            message: "Invalid input".to_string(),
            data: Some(serde_json::json!({
                "reason": "field was invalid"
            })),
        });
    }

    // Or convert from anyhow::Error
    let result = some_operation()
        .map_err(|e| McpError {
            code: -32001,
            message: e.to_string(),
            data: None,
        })?;

    Ok(CallToolResult::success(vec![Content::text(result)]))
}
```

### Multiple Content Types

```rust
Ok(CallToolResult::success(vec![
    Content::text("Text response"),
    Content::image(ImageContent {
        data: base64_image,
        mime_type: "image/png".to_string(),
    }),
]))
```

## Dependencies

### Core Dependencies

- **rmcp** (0.8.0): Official Rust MCP SDK
- **tokio**: Async runtime
- **serde**: Serialization
- **schemars**: JSON Schema generation

### Adding More Dependencies

Edit `Cargo.toml`:

```toml
[dependencies]
# HTTP client
reqwest = { workspace = true }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "sqlite"] }

# CLI parsing (if needed)
clap = { version = "4", features = ["derive"] }
```

## Transport Options

### stdio (Default)

```rust
let service = server.serve(stdio()).await?;
```

### SSE (Server-Sent Events)

```rust
use rmcp::transport::sse;

let service = server
    .serve(sse::SseServer::new("127.0.0.1:8000"))
    .await?;
```

### HTTP

```rust
use rmcp::transport::http;

let service = server
    .serve(http::HttpServer::new("127.0.0.1:8000"))
    .await?;
```

## Testing

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tool() {
        let server = MyServer::new();
        let result = server.my_tool(args).await;
        assert!(result.is_ok());
    }
}
```

### Integration Tests

Create `tests/integration.rs`:

```rust
use miyabi_mcp_myserver::server::MyServer;

#[tokio::test]
async fn test_server_lifecycle() {
    let server = MyServer::new();
    // Test server
}
```

## Deployment

### Build Release Binary

```bash
cargo build --release -p miyabi-mcp-<your-server>
```

Binary location: `target/release/miyabi-mcp-<your-server>`

### Configure Claude Code

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "/path/to/target/release/miyabi-mcp-<your-server>",
      "args": []
    }
  }
}
```

## Resources

- [RMCP Documentation](https://github.com/modelcontextprotocol/rust-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [RMCP Examples](/tmp/mcp-rust-sdk/examples/)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## Migration from TypeScript

If you're migrating from a TypeScript MCP server:

1. Copy this template
2. Read your TypeScript `index.ts` to identify all tools
3. For each TypeScript tool:
   - Create a Rust struct for the arguments
   - Implement the tool with `#[tool]` macro
   - Port the business logic
4. Test with MCP Inspector
5. Compare behavior with TypeScript version

See: `docs/MCP_MIGRATION_MASTER_PLAN.md`

## License

Same as Miyabi project
