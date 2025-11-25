# miyabi-a2a-gateway

**Status**: Internal
**Category**: Networking

## Overview

A2A (Agent-to-Agent) Gateway for unified inter-agent communication in the Miyabi platform. Provides a centralized gateway for routing messages between autonomous agents.

## Features

- Unified inter-agent communication protocol
- HTTP/JSON-RPC interface via Axum
- Request routing and message forwarding
- Agent registration and discovery
- Async message processing with Tokio

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Agent A       │────▶│                 │────▶│   Agent B       │
└─────────────────┘     │   A2A Gateway   │     └─────────────────┘
                        │                 │
┌─────────────────┐     │  - Routing      │     ┌─────────────────┐
│   Agent C       │◀────│  - Discovery    │────▶│   Agent D       │
└─────────────────┘     │  - Load Balance │     └─────────────────┘
                        └─────────────────┘
```

## Dependencies

- `axum` - Web framework
- `tokio` - Async runtime
- `miyabi-types` - Shared type definitions
- `miyabi-agent-core` - Core agent traits

## License

Apache-2.0
