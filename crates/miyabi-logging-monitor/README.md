# miyabi-logging-monitor

**Status**: Internal
**Category**: Observability

## Overview

Logging and monitoring system for Miyabi video generation pipeline. Provides centralized logging, metrics collection, and monitoring capabilities.

## Features

- Structured logging with tracing
- Metrics collection and aggregation
- Pipeline monitoring
- Error tracking and alerting
- Performance profiling

## Usage

```rust
use miyabi_logging_monitor::{Logger, Monitor};

let logger = Logger::new();
logger.info("Pipeline started");

let monitor = Monitor::new();
monitor.track_metric("frames_processed", 100);
```

## Dependencies

- `tracing` - Structured logging
- `tokio` - Async runtime
- `serde` - Serialization

## License

Apache-2.0
