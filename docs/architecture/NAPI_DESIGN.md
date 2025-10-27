# NAPI Architecture Design Document

**Date**: 2025-10-28
**Author**: Claude Code (Miyabi Agent)
**Issue**: #593
**Parent Issue**: #558 (Rust FFI Bridge using NAPI)
**Dependencies**: #592 (NAPI Research - ✅ Completed)

---

## Executive Summary

This document defines the architecture for `miyabi-agent-sdk`, a Rust crate that provides a high-performance FFI bridge to TypeScript SDK functions via napi-rs. The design targets **10-100x performance improvement** over the current subprocess-based approach.

**Key Design Principles**:
- ✅ **Type Safety**: Leverage Rust's type system + automatic `.d.ts` generation
- ✅ **Async-First**: All SDK functions return `Promise<T>` in TypeScript
- ✅ **Error Transparency**: Rust errors propagate cleanly to JavaScript exceptions
- ✅ **Zero Dependencies**: No system libraries required (napi-rs v3.x)

---

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                      Miyabi Agent System                      │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Rust Agents     │         │  TypeScript SDK  │          │
│  │  (Coordinator,   │         │  (D2, etc.)      │          │
│  │   CodeGen, etc.) │         │                  │          │
│  └────────┬─────────┘         └─────────┬────────┘          │
│           │                              │                   │
│           │  ┌──────────────────────┐   │                   │
│           └─→│  miyabi-agent-sdk    │←──┘                   │
│              │  (NAPI FFI Bridge)   │                       │
│              └──────────────────────┘                       │
│                                                               │
│  Current: Rust → subprocess → npm run → TypeScript (5ms)    │
│  Target:  Rust → NAPI FFI → TypeScript (0.05ms)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Performance Goals

| Metric | Current (Subprocess) | Target (NAPI) | Improvement |
|--------|---------------------|---------------|-------------|
| Per-call latency | 5ms | 0.05ms | **100x** |
| Memory overhead | ~50MB (Node.js process) | ~1MB | **50x** |
| CPU usage | High (process spawn) | Low (function call) | **10x** |

---

## 2. Rust API Design

### 2.1 Crate Structure

```
crates/miyabi-agent-sdk/
├── Cargo.toml
├── build.rs              # NAPI build script
├── src/
│   ├── lib.rs            # Public API entry point
│   ├── ffi.rs            # NAPI FFI bindings
│   ├── types.rs          # Rust types (ComplexityResult, etc.)
│   ├── error.rs          # Error types (SdkError)
│   └── d2/               # D2 SDK module
│       ├── mod.rs
│       └── complexity.rs # check_complexity() implementation
└── tests/
    └── integration.rs    # Integration tests
```

### 2.2 Public API Functions

#### Core D2 SDK Functions

##### 2.2.1 `check_complexity()`

**Signature**:
```rust
use napi_derive::napi;
use crate::types::ComplexityResult;

/// Check the complexity of a GitHub Issue
///
/// # Arguments
/// * `issue_number` - GitHub Issue number
///
/// # Returns
/// * `ComplexityResult` - Complexity score and contributing factors
///
/// # Errors
/// * `SdkError::NetworkError` - Failed to fetch Issue from GitHub
/// * `SdkError::ParseError` - Invalid Issue format
/// * `SdkError::D2Error` - D2 analysis failed
#[napi]
pub async fn check_complexity(issue_number: u32) -> napi::Result<ComplexityResult> {
    // Phase 2 implementation
    todo!("Implement D2 SDK call via Node.js module import")
}
```

**TypeScript Signature** (auto-generated):
```typescript
/**
 * Check the complexity of a GitHub Issue
 * @param issueNumber - GitHub Issue number
 * @returns Promise with complexity score and factors
 * @throws {Error} Network error, parse error, or D2 analysis error
 */
export function checkComplexity(issueNumber: number): Promise<ComplexityResult>
```

##### 2.2.2 Future SDK Functions (Planned)

```rust
/// Generate code based on Issue requirements
#[napi]
pub async fn generate_code(issue_number: u32, context: CodeContext) -> napi::Result<CodeResult> {
    todo!()
}

/// Review code changes in a Pull Request
#[napi]
pub async fn review_pr(pr_number: u32) -> napi::Result<ReviewResult> {
    todo!()
}

/// Create a new GitHub Issue with AI-generated content
#[napi]
pub async fn create_issue(template: IssueTemplate) -> napi::Result<u32> {
    todo!()
}
```

### 2.3 Type Definitions

#### 2.3.1 `ComplexityResult`

```rust
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Result of complexity analysis
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplexityResult {
    /// Complexity score (0-100)
    pub score: u32,

    /// Contributing factors to complexity
    pub factors: Vec<String>,

    /// Estimated time to complete (minutes)
    pub estimated_time: u32,

    /// Recommended agent type
    pub recommended_agent: String,

    /// Confidence level (0.0-1.0)
    pub confidence: f64,
}
```

**TypeScript Output**:
```typescript
export interface ComplexityResult {
  score: number
  factors: Array<string>
  estimatedTime: number
  recommendedAgent: string
  confidence: number
}
```

#### 2.3.2 `CodeContext`

```rust
/// Context for code generation
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeContext {
    /// Programming language
    pub language: String,

    /// Target framework (e.g., "tokio", "actix-web")
    pub framework: Option<String>,

    /// Additional context from previous agents
    pub agent_context: Option<String>,
}
```

### 2.4 Error Types

#### 2.4.1 `SdkError`

```rust
use napi::Error as NapiError;
use thiserror::Error;

/// Errors from SDK operations
#[derive(Debug, Error)]
pub enum SdkError {
    /// Network request failed
    #[error("Network error: {0}")]
    NetworkError(String),

    /// Failed to parse response
    #[error("Parse error: {0}")]
    ParseError(String),

    /// D2 analysis failed
    #[error("D2 analysis error: {0}")]
    D2Error(String),

    /// GitHub API error
    #[error("GitHub API error: {0}")]
    GitHubError(String),

    /// Internal error
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<SdkError> for NapiError {
    fn from(err: SdkError) -> Self {
        NapiError::from_reason(err.to_string())
    }
}
```

**TypeScript Error Handling**:
```typescript
try {
    const result = await checkComplexity(270)
    console.log(`Score: ${result.score}`)
} catch (error) {
    // SdkError variants become JavaScript Error objects
    if (error.message.includes("Network error")) {
        console.error("Failed to connect to GitHub")
    } else if (error.message.includes("D2 analysis error")) {
        console.error("D2 processing failed")
    } else {
        console.error(`Unexpected error: ${error.message}`)
    }
}
```

---

## 3. TypeScript Export Design

### 3.1 Module Structure

```
dist/
├── index.js              # CommonJS entry point
├── index.d.ts            # TypeScript definitions (auto-generated)
├── miyabi-agent-sdk.darwin-arm64.node    # macOS Apple Silicon
├── miyabi-agent-sdk.darwin-x64.node      # macOS Intel
├── miyabi-agent-sdk.linux-x64-gnu.node   # Linux x64
└── miyabi-agent-sdk.win32-x64-msvc.node  # Windows x64
```

### 3.2 Package.json

```json
{
  "name": "@miyabi/agent-sdk",
  "version": "0.1.0",
  "description": "High-performance Rust FFI bridge for Miyabi TypeScript SDK",
  "main": "index.js",
  "types": "index.d.ts",
  "napi": {
    "name": "miyabi-agent-sdk",
    "triples": {
      "defaults": true,
      "additional": [
        "x86_64-unknown-linux-musl",
        "aarch64-apple-darwin",
        "aarch64-unknown-linux-gnu"
      ]
    }
  },
  "scripts": {
    "build": "napi build --platform --release",
    "build:debug": "napi build --platform",
    "prepublishOnly": "napi prepublish -t npm",
    "test": "vitest run",
    "artifacts": "napi artifacts"
  },
  "devDependencies": {
    "@napi-rs/cli": "^3.0.0-alpha.93",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "files": [
    "index.js",
    "index.d.ts",
    "*.node"
  ],
  "os": [
    "darwin",
    "linux",
    "win32"
  ],
  "cpu": [
    "x64",
    "arm64"
  ],
  "license": "MIT"
}
```

### 3.3 TypeScript Usage Examples

#### Example 1: Basic Complexity Check

```typescript
import { checkComplexity } from '@miyabi/agent-sdk'

async function analyzeIssue(issueNumber: number) {
  try {
    const result = await checkComplexity(issueNumber)

    console.log(`Complexity Score: ${result.score}/100`)
    console.log(`Estimated Time: ${result.estimatedTime} minutes`)
    console.log(`Recommended Agent: ${result.recommendedAgent}`)
    console.log(`Factors: ${result.factors.join(', ')}`)

    return result
  } catch (error) {
    console.error(`Failed to analyze Issue #${issueNumber}:`, error)
    throw error
  }
}

// Usage
await analyzeIssue(270)
```

#### Example 2: Batch Processing

```typescript
import { checkComplexity } from '@miyabi/agent-sdk'

async function analyzeMultipleIssues(issueNumbers: number[]) {
  const results = await Promise.allSettled(
    issueNumbers.map(num => checkComplexity(num))
  )

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Issue #${issueNumbers[index]}: ${result.value.score}`)
    } else {
      console.error(`Issue #${issueNumbers[index]}: ${result.reason}`)
    }
  })
}

// 10x faster than subprocess approach
await analyzeMultipleIssues([270, 271, 272, 273, 274])
```

#### Example 3: Integration with Coordinator Agent

```typescript
import { checkComplexity, type ComplexityResult } from '@miyabi/agent-sdk'

class CoordinatorAgent {
  async selectAgent(issueNumber: number): Promise<string> {
    const complexity: ComplexityResult = await checkComplexity(issueNumber)

    if (complexity.score >= 80) {
      return 'HumanReview'  // Escalate to human
    } else if (complexity.score >= 50) {
      return 'CoordinatorAgent'  // Complex decomposition needed
    } else {
      return complexity.recommendedAgent  // Use D2 recommendation
    }
  }
}
```

---

## 4. Error Handling Strategy

### 4.1 Error Propagation Flow

```
┌───────────────────────────────────────────────────────────────┐
│                    Error Propagation Chain                     │
│                                                                │
│  TypeScript SDK                                                │
│       ↓ throws Error                                           │
│  JavaScript Runtime (Node.js)                                  │
│       ↓ NAPI converts to napi::Error                          │
│  Rust FFI Bridge (miyabi-agent-sdk)                           │
│       ↓ maps to SdkError                                      │
│  Rust Business Logic                                           │
│       ↓ returns Result<T, SdkError>                           │
│  NAPI converts to JavaScript Error                             │
│       ↓ throws in TypeScript                                   │
│  Caller (Coordinator Agent)                                    │
│       ↓ try/catch                                              │
│  Error Logging & Recovery                                      │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 Recovery Mechanisms

#### 4.2.1 Retry Logic

```rust
use std::time::Duration;
use tokio::time::sleep;

async fn check_complexity_with_retry(
    issue_number: u32,
    max_retries: u32,
) -> napi::Result<ComplexityResult> {
    let mut attempts = 0;

    loop {
        match check_complexity_internal(issue_number).await {
            Ok(result) => return Ok(result),
            Err(e) if attempts < max_retries && is_retryable(&e) => {
                attempts += 1;
                let backoff = Duration::from_millis(100 * 2u64.pow(attempts));
                sleep(backoff).await;
            }
            Err(e) => return Err(e.into()),
        }
    }
}

fn is_retryable(error: &SdkError) -> bool {
    matches!(error, SdkError::NetworkError(_) | SdkError::GitHubError(_))
}
```

#### 4.2.2 Circuit Breaker (Future Enhancement)

```rust
use std::sync::Arc;
use tokio::sync::RwLock;

struct CircuitBreaker {
    failure_count: Arc<RwLock<u32>>,
    threshold: u32,
    is_open: Arc<RwLock<bool>>,
}

impl CircuitBreaker {
    async fn call<F, T>(&self, f: F) -> napi::Result<T>
    where
        F: Future<Output = napi::Result<T>>,
    {
        if *self.is_open.read().await {
            return Err(NapiError::from_reason("Circuit breaker open"));
        }

        match f.await {
            Ok(result) => {
                *self.failure_count.write().await = 0;
                Ok(result)
            }
            Err(e) => {
                let mut count = self.failure_count.write().await;
                *count += 1;

                if *count >= self.threshold {
                    *self.is_open.write().await = true;
                }

                Err(e)
            }
        }
    }
}
```

### 4.3 Logging & Tracing

```rust
use tracing::{info, warn, error, instrument};

#[instrument(skip(issue_number))]
#[napi]
pub async fn check_complexity(issue_number: u32) -> napi::Result<ComplexityResult> {
    info!("Starting complexity analysis for Issue #{}", issue_number);

    match check_complexity_internal(issue_number).await {
        Ok(result) => {
            info!(
                "Complexity analysis complete: score={}, time={}min",
                result.score, result.estimated_time
            );
            Ok(result)
        }
        Err(e) => {
            error!("Complexity analysis failed: {}", e);
            Err(e.into())
        }
    }
}
```

---

## 5. Build Configuration

### 5.1 Cargo.toml

```toml
[package]
name = "miyabi-agent-sdk"
version = "0.1.0"
edition = "2021"
authors = ["Miyabi Team"]
description = "High-performance Rust FFI bridge for Miyabi TypeScript SDK"
license = "MIT"

[lib]
crate-type = ["cdylib"]  # Dynamic library for Node.js

[dependencies]
# NAPI core
napi = { version = "3.0.0-alpha", features = ["async", "tokio_rt"] }
napi-derive = "3.0.0-alpha"

# Async runtime
tokio = { version = "1", features = ["full"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Error handling
thiserror = "2"
anyhow = "1"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# HTTP client (for TypeScript SDK calls)
reqwest = { version = "0.11", features = ["json"] }

[build-dependencies]
napi-build = "2"

[dev-dependencies]
tokio-test = "0.4"
```

### 5.2 build.rs

```rust
fn main() {
    napi_build::setup();
}
```

### 5.3 Build Scripts

#### Development Build

```bash
#!/bin/bash
# scripts/build-dev.sh

set -e

echo "Building miyabi-agent-sdk (debug)..."
cd crates/miyabi-agent-sdk
npm run build:debug

echo "Running tests..."
cargo test

echo "✅ Development build complete"
```

#### Production Build

```bash
#!/bin/bash
# scripts/build-prod.sh

set -e

echo "Building miyabi-agent-sdk (release)..."
cd crates/miyabi-agent-sdk

# Build for current platform
npm run build --release

# Generate TypeScript definitions
npm run prepublishOnly

echo "✅ Production build complete"
```

#### Cross-Platform Build (CI)

```yaml
# .github/workflows/build-sdk.yml
name: Build miyabi-agent-sdk

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    strategy:
      matrix:
        settings:
          - host: macos-latest
            target: x86_64-apple-darwin
          - host: macos-latest
            target: aarch64-apple-darwin
          - host: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - host: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.settings.host }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.settings.target }}

      - name: Build
        working-directory: crates/miyabi-agent-sdk
        run: npm run build --release -- --target ${{ matrix.settings.target }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: bindings-${{ matrix.settings.target }}
          path: crates/miyabi-agent-sdk/*.node
```

---

## 6. Testing Strategy

### 6.1 Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_complexity_result_serialization() {
        let result = ComplexityResult {
            score: 75,
            factors: vec!["Large codebase".to_string()],
            estimated_time: 120,
            recommended_agent: "CoordinatorAgent".to_string(),
            confidence: 0.85,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"score\":75"));
    }

    #[test]
    fn test_sdk_error_conversion() {
        let err = SdkError::NetworkError("Connection timeout".to_string());
        let napi_err: NapiError = err.into();

        assert!(napi_err.to_string().contains("Network error"));
    }
}
```

### 6.2 Integration Tests (TypeScript)

```typescript
// tests/integration.test.ts
import { describe, it, expect } from 'vitest'
import { checkComplexity } from '../index'

describe('NAPI FFI Bridge', () => {
  it('should check complexity successfully', async () => {
    const result = await checkComplexity(270)

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.factors).toBeInstanceOf(Array)
    expect(result.estimatedTime).toBeGreaterThan(0)
  })

  it('should handle errors gracefully', async () => {
    await expect(checkComplexity(999999)).rejects.toThrow()
  })

  it('should be faster than subprocess', async () => {
    const start = Date.now()
    await checkComplexity(270)
    const napiTime = Date.now() - start

    // NAPI should complete in <100ms
    expect(napiTime).toBeLessThan(100)
  })
})
```

---

## 7. Migration Path

### 7.1 Phase 2.1: Minimal POC (45min)

**Goal**: Prove NAPI bridge works with a simple echo function

```rust
#[napi]
pub fn echo(message: String) -> String {
    format!("Echo: {}", message)
}
```

**Success Criteria**:
- ✅ Rust compiles to `.node` binary
- ✅ TypeScript can import and call `echo()`
- ✅ Type definitions generated correctly

### 7.2 Phase 2.2: D2 Integration (45min)

**Goal**: Integrate `check_complexity()` with actual D2 SDK

**Implementation**:
```rust
use napi::JsObject;
use napi::bindgen_prelude::*;

#[napi]
pub async fn check_complexity(issue_number: u32, env: Env) -> napi::Result<ComplexityResult> {
    // Import TypeScript D2 module
    let d2_module: JsObject = env.get_global()?.get_named_property("require")?
        .call(Some(&env.create_string("@miyabi/d2-sdk")?), &[])?;

    // Call D2 checkComplexity function
    let check_fn: JsFunction = d2_module.get_named_property("checkComplexity")?;
    let result: JsObject = check_fn.call(None, &[env.create_uint32(issue_number)?])?;

    // Convert to Rust type
    Ok(ComplexityResult {
        score: result.get_named_property::<JsNumber>("score")?.get_uint32()?,
        factors: result.get_named_property::<JsObject>("factors")?.to_vec()?,
        estimated_time: result.get_named_property::<JsNumber>("estimatedTime")?.get_uint32()?,
        recommended_agent: result.get_named_property::<JsString>("recommendedAgent")?.into_utf8()?.as_str()?.to_string(),
        confidence: result.get_named_property::<JsNumber>("confidence")?.get_double()?,
    })
}
```

**Success Criteria**:
- ✅ Can call TypeScript D2 SDK from Rust
- ✅ Data flows correctly: Issue # → D2 → Rust → TypeScript
- ✅ Performance is 10x+ faster than subprocess

### 7.3 Phase 3: Full SDK Integration (Deferred)

**Goal**: Wrap all TypeScript SDK functions
- `generate_code()`
- `review_pr()`
- `create_issue()`
- etc.

---

## 8. Performance Benchmarks (Expected)

### 8.1 Latency Comparison

| Operation | Subprocess | NAPI | Speedup |
|-----------|-----------|------|---------|
| Single `check_complexity()` | 5ms | 0.05ms | **100x** |
| 10 parallel calls | 50ms | 0.5ms | **100x** |
| 100 sequential calls | 500ms | 5ms | **100x** |

### 8.2 Memory Usage

| Scenario | Subprocess | NAPI | Reduction |
|----------|-----------|------|-----------|
| Idle | 50MB | 1MB | **50x** |
| Processing 10 Issues | 500MB | 10MB | **50x** |

---

## 9. Next Steps

### Phase 2.1: Minimal POC Implementation (45min)

**Create Issue**: "Minimal NAPI Bridge POC with Echo Function"

**Tasks**:
1. Create `crates/miyabi-agent-sdk/` crate
2. Implement `echo()` function
3. Build `.node` binary
4. Test TypeScript import
5. Verify type definitions

### Phase 2.2: D2 SDK Integration (45min)

**Create Issue**: "Integrate D2 SDK check_complexity() via NAPI"

**Tasks**:
1. Implement `check_complexity()` in Rust
2. Call TypeScript D2 module via NAPI
3. Write integration tests
4. Benchmark vs subprocess approach

---

## 10. Appendix

### 10.1 NAPI API Reference

**Key Functions**:
- `env.get_global()` - Access JavaScript global object
- `env.create_string()` - Create JS string
- `JsObject::get_named_property()` - Access object property
- `JsFunction::call()` - Call JavaScript function

**Full Documentation**: https://docs.rs/napi/latest/napi/

### 10.2 Related Issues

- **This Issue**: #593 (NAPI Architecture Design)
- **Previous**: #592 (NAPI Research)
- **Parent**: #558 (Rust FFI Bridge using NAPI)
- **Next**: Phase 2.1 - Minimal POC (to be created)

---

**Generated with**: [Claude Code](https://claude.com/claude-code)
**Co-Authored-By**: Claude <noreply@anthropic.com>
