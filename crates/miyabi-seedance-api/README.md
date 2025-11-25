# miyabi-seedance-api

**Status**: Internal
**Category**: API Client

## Overview

BytePlus Seedance API client for Miyabi video generation. Provides a Rust interface to the BytePlus Seedance video generation service.

## Features

- BytePlus Seedance API integration
- Video generation requests
- Async/await support
- Error handling and retries

## Usage

```rust
use miyabi_seedance_api::SeedanceClient;

let client = SeedanceClient::new(api_key);
let result = client.generate_video(params).await?;
```

## Dependencies

- `reqwest` - HTTP client
- `tokio` - Async runtime
- `serde` - Serialization

## License

Apache-2.0
