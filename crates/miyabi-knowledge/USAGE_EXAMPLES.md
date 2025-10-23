# Miyabi Knowledge - Usage Examples

**Version**: 0.1.1
**Feature**: AST-based Context Tracking + RAG Integration (Issue #497 - Phase 1)

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [AST Context Tracking](#ast-context-tracking)
3. [Hybrid Context Search](#hybrid-context-search)
4. [Priority-Based Pruning](#priority-based-pruning)
5. [Caching Configuration](#caching-configuration)
6. [Integration Examples](#integration-examples)

---

## Basic Usage

### Rust API

```rust
use miyabi_knowledge::{
    HybridContextSearcher,
    QdrantSearcher,
    KnowledgeConfig,
};
use std::path::PathBuf;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize RAG searcher
    let config = KnowledgeConfig::default();
    let rag_searcher = QdrantSearcher::new(config).await?;

    // Create hybrid searcher (AST + RAG)
    let mut hybrid = HybridContextSearcher::new(
        rag_searcher,
        0.5, // 50% AST weight, 50% RAG weight
    )?;

    // Search with both AST and RAG
    let files = vec![PathBuf::from("src/main.rs")];
    let results = hybrid.search(
        "error handling",  // Query
        Some(&files),      // Files to analyze
        10,                // Max results
    ).await?;

    // Format for LLM prompt
    let prompt = hybrid.format_for_prompt(&results, 2000);
    println!("{}", prompt);

    Ok(())
}
```

---

## AST Context Tracking

### Parse Individual Files

```rust
use miyabi_knowledge::{FileContextTracker, SymbolKind, Visibility};
use std::path::Path;

fn main() -> anyhow::Result<()> {
    // Create AST tracker for Rust files
    let mut tracker = FileContextTracker::new_rust()?;

    // Parse a single file
    let context = tracker.parse_file(Path::new("src/lib.rs"))?;

    // Access file metadata
    println!("File: {}", context.path.display());
    println!("Total lines: {}", context.total_lines);
    println!("Symbols: {}", context.symbols.len());

    // Filter by visibility
    let public_symbols = context.public_symbols();
    println!("Public API symbols: {}", public_symbols.len());

    // Filter by symbol kind
    let functions = context.symbols_by_kind(SymbolKind::Function);
    for func in functions {
        println!("Function: {} at L{}-L{}",
            func.name,
            func.start_line + 1,
            func.end_line + 1
        );
        if let Some(doc) = &func.doc_comment {
            println!("  Doc: {}", doc);
        }
    }

    // Format summary
    println!("{}", context.format_summary());
    println!("{}", context.format_public_api());

    Ok(())
}
```

### Parse Multiple Files

```rust
use miyabi_knowledge::FileContextTracker;
use std::path::PathBuf;

fn analyze_project(files: Vec<PathBuf>) -> anyhow::Result<()> {
    let mut tracker = FileContextTracker::new_rust()?;

    for path in files {
        if path.extension().and_then(|e| e.to_str()) == Some("rs") {
            let context = tracker.parse_file(&path)?;

            println!("\n{}", context.format_summary());

            // Count by symbol kind
            let mut counts = std::collections::HashMap::new();
            for symbol in &context.symbols {
                *counts.entry(&symbol.kind).or_insert(0) += 1;
            }

            for (kind, count) in counts {
                println!("  {:?}: {}", kind, count);
            }
        }
    }

    Ok(())
}
```

---

## Hybrid Context Search

### Basic Hybrid Search

```rust
use miyabi_knowledge::{
    HybridContextSearcher,
    QdrantSearcher,
    KnowledgeConfig,
    ContextSource,
};
use std::path::PathBuf;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = KnowledgeConfig::default();
    let rag_searcher = QdrantSearcher::new(config).await?;

    let mut hybrid = HybridContextSearcher::new(rag_searcher, 0.6)?; // 60% AST, 40% RAG

    // Specify files to analyze
    let files = vec![
        PathBuf::from("crates/miyabi-types/src/error.rs"),
        PathBuf::from("crates/miyabi-types/src/agent.rs"),
    ];

    // Search
    let results = hybrid.search("error handling patterns", Some(&files), 5).await?;

    for (i, piece) in results.iter().enumerate() {
        println!("\n=== Result {} ===", i + 1);
        println!("Source: {:?}", piece.source);
        println!("Score: {:.2}", piece.score);
        println!("Priority: {}", piece.priority);

        if let Some(path) = &piece.file_path {
            println!("File: {}", path.display());
        }

        if let Some((start, end)) = piece.line_range {
            println!("Lines: {}-{}", start, end);
        }

        println!("Content:\n{}", piece.content);
    }

    Ok(())
}
```

### Filtering by Context Source

```rust
use miyabi_knowledge::{ContextSource, ContextPiece};

fn filter_by_source(results: &[ContextPiece], source: ContextSource) -> Vec<&ContextPiece> {
    results.iter()
        .filter(|p| p.source == source)
        .collect()
}

// Example usage
let ast_only = filter_by_source(&results, ContextSource::Ast);
let rag_only = filter_by_source(&results, ContextSource::Rag);
let hybrid = filter_by_source(&results, ContextSource::Hybrid);

println!("AST results: {}", ast_only.len());
println!("RAG results: {}", rag_only.len());
println!("Hybrid results: {}", hybrid.len());
```

---

## Priority-Based Pruning

### Understanding Priority Levels

```rust
use miyabi_knowledge::{ContextSource, ContextPiece};

// Priority calculation examples
let ast_high = ContextPiece::calculate_priority(&ContextSource::Ast, 0.95); // 10
let ast_medium = ContextPiece::calculate_priority(&ContextSource::Ast, 0.75); // 8
let rag_high = ContextPiece::calculate_priority(&ContextSource::Rag, 0.90); // 9
let rag_low = ContextPiece::calculate_priority(&ContextSource::Rag, 0.55); // 5
let hybrid_any = ContextPiece::calculate_priority(&ContextSource::Hybrid, 0.0); // 10 (always)

assert_eq!(ast_high, 10);
assert_eq!(hybrid_any, 10); // Hybrid always gets highest priority
```

### Token Budget Management

```rust
use miyabi_knowledge::HybridContextSearcher;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut hybrid = /* ... */;

    // Large dataset
    let results = hybrid.search("async runtime", Some(&files), 100).await?;

    // Small token budget - only critical items (priority 10) will be included
    let tight_budget = hybrid.format_for_prompt(&results, 500);

    // Medium token budget - includes priority 10 and 9-8 items
    let medium_budget = hybrid.format_for_prompt(&results, 2000);

    // Large token budget - includes all priority 5+ items
    let large_budget = hybrid.format_for_prompt(&results, 10000);

    println!("Tight budget:\n{}", tight_budget);
    println!("\nMedium budget:\n{}", medium_budget);
    println!("\nLarge budget:\n{}", large_budget);

    Ok(())
}
```

---

## Caching Configuration

### Default Caching

```rust
use miyabi_knowledge::HybridContextSearcher;

// Default: 300 seconds TTL, 100 max entries
let mut hybrid = HybridContextSearcher::new(rag_searcher, 0.5)?;

// First call - parses file (slow)
let results1 = hybrid.search("query", Some(&files), 10).await?;

// Second call - uses cache (fast, 10-100x faster)
let results2 = hybrid.search("query", Some(&files), 10).await?;
```

### Custom Caching

```rust
use miyabi_knowledge::HybridContextSearcher;
use std::time::Duration;

// Custom cache settings
let mut hybrid = HybridContextSearcher::new_with_cache(
    rag_searcher,
    0.5,
    Duration::from_secs(600), // 10 minutes TTL
    200,                       // Max 200 entries
)?;

// Cache operations
let (size, max) = hybrid.cache_stats();
println!("Cache: {}/{} entries", size, max);

hybrid.clear_cache(); // Manual cache clear
```

### Cache Invalidation

The cache automatically invalidates entries when:
1. **TTL expires** - Entry older than configured TTL
2. **File modified** - File modification time changed
3. **LRU eviction** - Cache full, oldest entry removed

```rust
use std::fs;
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut hybrid = HybridContextSearcher::new_with_cache(
        rag_searcher,
        0.5,
        Duration::from_secs(2), // 2 second TTL
        100,
    )?;

    // First call - cache miss, parses file
    hybrid.search("query", Some(&files), 10).await?;

    // Second call - cache hit
    hybrid.search("query", Some(&files), 10).await?;

    // Wait for TTL expiration
    sleep(Duration::from_secs(3)).await;

    // Third call - cache miss (TTL expired), reparses file
    hybrid.search("query", Some(&files), 10).await?;

    // Modify file
    fs::write("src/lib.rs", "// New content")?;

    // Fourth call - cache miss (file modified), reparses file
    hybrid.search("query", Some(&files), 10).await?;

    Ok(())
}
```

---

## Integration Examples

### LLM Prompt Enhancement

```rust
use miyabi_knowledge::HybridContextSearcher;

async fn enhance_prompt_with_context(
    base_prompt: &str,
    query: &str,
    files: &[PathBuf],
    hybrid: &mut HybridContextSearcher<impl KnowledgeSearcher>,
) -> anyhow::Result<String> {
    // Search for relevant context
    let results = hybrid.search(query, Some(files), 10).await?;

    // Format with 2000 token budget
    let context = hybrid.format_for_prompt(&results, 2000);

    // Combine with base prompt
    let enhanced_prompt = format!(
        "{}\n\n{}\n\n## Task\n{}",
        context,
        base_prompt,
        query
    );

    Ok(enhanced_prompt)
}
```

### Agent Context Injection

```rust
use miyabi_knowledge::{HybridContextSearcher, QdrantSearcher, KnowledgeConfig};
use std::path::PathBuf;

struct AgentContext {
    hybrid: HybridContextSearcher<QdrantSearcher>,
}

impl AgentContext {
    async fn new() -> anyhow::Result<Self> {
        let config = KnowledgeConfig::default();
        let rag_searcher = QdrantSearcher::new(config).await?;
        let hybrid = HybridContextSearcher::new(rag_searcher, 0.7)?; // 70% AST

        Ok(Self { hybrid })
    }

    async fn get_context_for_task(
        &mut self,
        task_description: &str,
        relevant_files: Vec<PathBuf>,
    ) -> anyhow::Result<String> {
        // Search with AST + RAG
        let results = self.hybrid.search(
            task_description,
            Some(&relevant_files),
            15, // Top 15 results
        ).await?;

        // Format with priority-based pruning
        Ok(self.hybrid.format_for_prompt(&results, 3000))
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut agent_context = AgentContext::new().await?;

    let context = agent_context.get_context_for_task(
        "implement error handling",
        vec![
            PathBuf::from("crates/miyabi-types/src/error.rs"),
            PathBuf::from("crates/miyabi-core/src/config.rs"),
        ],
    ).await?;

    println!("Context for LLM:\n{}", context);

    Ok(())
}
```

### Batch Analysis

```rust
use miyabi_knowledge::{FileContextTracker, HybridContextSearcher};
use std::path::PathBuf;
use walkdir::WalkDir;

async fn analyze_workspace(
    workspace_path: &Path,
    queries: Vec<&str>,
) -> anyhow::Result<()> {
    // Collect all Rust files
    let mut files = Vec::new();
    for entry in WalkDir::new(workspace_path) {
        let entry = entry?;
        if entry.path().extension().and_then(|e| e.to_str()) == Some("rs") {
            files.push(entry.path().to_path_buf());
        }
    }

    println!("Found {} Rust files", files.len());

    // Initialize hybrid searcher
    let config = KnowledgeConfig::default();
    let rag_searcher = QdrantSearcher::new(config).await?;
    let mut hybrid = HybridContextSearcher::new(rag_searcher, 0.6)?;

    // Run queries
    for query in queries {
        println!("\n=== Query: {} ===", query);

        let results = hybrid.search(query, Some(&files), 5).await?;
        let formatted = hybrid.format_for_prompt(&results, 1500);

        println!("{}", formatted);

        // Cache stats
        let (size, max) = hybrid.cache_stats();
        println!("Cache: {}/{} entries", size, max);
    }

    Ok(())
}
```

---

## Performance Tips

### 1. Optimize AST Weight

```rust
// More AST weight (0.7-0.9) for:
// - Local code analysis
// - Symbol discovery
// - API usage patterns

let hybrid_local = HybridContextSearcher::new(searcher, 0.8)?;

// More RAG weight (0.3-0.5) for:
// - Semantic search
// - Documentation lookup
// - Cross-project patterns

let hybrid_semantic = HybridContextSearcher::new(searcher, 0.4)?;
```

### 2. Cache Tuning

```rust
use std::time::Duration;

// Large projects - increase cache size and TTL
let hybrid_large = HybridContextSearcher::new_with_cache(
    searcher,
    0.5,
    Duration::from_secs(900), // 15 minutes
    500,                       // 500 entries
)?;

// Small projects - smaller cache OK
let hybrid_small = HybridContextSearcher::new_with_cache(
    searcher,
    0.5,
    Duration::from_secs(300), // 5 minutes
    50,                        // 50 entries
)?;
```

### 3. Query Optimization

```rust
// Specific queries work better with AST
let results = hybrid.search("pub fn new", Some(&files), 10).await?;

// Semantic queries work better with RAG
let results = hybrid.search("error handling best practices", Some(&files), 10).await?;

// Combine both for hybrid queries
let results = hybrid.search("async error handling implementation", Some(&files), 10).await?;
```

---

## Troubleshooting

### Cache Not Working

```rust
// Check cache stats
let (size, max) = hybrid.cache_stats();
if size == 0 {
    println!("Cache is empty - first run or recently cleared");
}

// Verify TTL not too short
let hybrid = HybridContextSearcher::new_with_cache(
    searcher,
    0.5,
    Duration::from_secs(300), // At least 5 minutes recommended
    100,
)?;
```

### Poor Search Results

```rust
// Try adjusting AST weight
let mut hybrid = HybridContextSearcher::new(searcher, 0.7)?; // More AST
let results = hybrid.search(query, Some(&files), 10).await?;

// Check priority distribution
for piece in &results {
    println!("Priority: {}, Score: {:.2}, Source: {:?}",
        piece.priority,
        piece.score,
        piece.source
    );
}
```

---

## Related Documentation

- **API Reference**: `crates/miyabi-knowledge/API_REFERENCE.md`
- **User Guide**: `crates/miyabi-knowledge/USER_GUIDE.md`
- **README**: `crates/miyabi-knowledge/README.md`
- **Issue #497**: Implement Cline learnings (Phase 1)

---

**Last Updated**: 2025-10-24
**Version**: 0.1.1 (Phase 1 Complete)
