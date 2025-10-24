//! Tool result caching with LRU eviction and TTL expiration
//!
//! This module provides a cache layer for MCP tool execution results to reduce
//! redundant API calls and improve performance.
//!
//! ## Features
//!
//! - **LRU Eviction**: Least Recently Used cache eviction policy
//! - **TTL Expiration**: Time-to-live based cache expiration
//! - **Metrics Tracking**: Cache hit/miss statistics
//! - **Thread-Safe**: Uses interior mutability for concurrent access
//!
//! ## Usage
//!
//! ```rust
//! use miyabi_mcp_server::ToolResultCache;
//! use std::time::Duration;
//!
//! let cache = ToolResultCache::new(1000, Duration::from_secs(300));
//! ```

use lru::LruCache;
use serde_json::Value;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::num::NonZeroUsize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tracing::{debug, info};

/// Cache key for tool execution results
///
/// A cache key consists of the tool name and a hash of the tool arguments.
/// This ensures that identical tool invocations with the same arguments
/// will retrieve cached results.
#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct CacheKey {
    /// Name of the tool (e.g., "agent.coordinator.execute")
    pub tool_name: String,
    /// Hash of the serialized arguments
    pub arguments_hash: u64,
}

impl CacheKey {
    /// Create a new cache key from tool name and arguments
    ///
    /// # Arguments
    ///
    /// * `tool_name` - Name of the tool
    /// * `arguments` - Tool arguments as JSON value
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::CacheKey;
    /// use serde_json::json;
    ///
    /// let key = CacheKey::new("agent.coordinator.execute", &json!({"issue_number": 270}));
    /// ```
    pub fn new(tool_name: impl Into<String>, arguments: &Value) -> Self {
        let mut hasher = DefaultHasher::new();

        // Serialize arguments to stable JSON string for hashing
        // This ensures consistent hashing across runs
        let args_string = serde_json::to_string(arguments).unwrap_or_default();
        args_string.hash(&mut hasher);

        Self {
            tool_name: tool_name.into(),
            arguments_hash: hasher.finish(),
        }
    }
}

/// Cache entry with result and timestamp
#[derive(Debug, Clone)]
struct CacheEntry {
    /// The cached result value
    result: Value,
    /// Timestamp when the entry was created
    timestamp: Instant,
}

impl CacheEntry {
    /// Create a new cache entry
    fn new(result: Value) -> Self {
        Self {
            result,
            timestamp: Instant::now(),
        }
    }

    /// Check if the entry has expired
    fn is_expired(&self, ttl: Duration) -> bool {
        self.timestamp.elapsed() > ttl
    }
}

/// LRU cache for tool execution results
///
/// This cache stores tool execution results with automatic expiration (TTL)
/// and LRU eviction when capacity is reached.
///
/// ## Thread Safety
///
/// The cache is thread-safe and can be shared across multiple threads using `Arc`.
///
/// ## Examples
///
/// ```rust
/// use miyabi_mcp_server::{ToolResultCache, CacheKey};
/// use serde_json::json;
/// use std::time::Duration;
///
/// let cache = ToolResultCache::new(1000, Duration::from_secs(300));
///
/// let key = CacheKey::new("test.tool", &json!({"param": "value"}));
/// let result = json!({"output": "cached result"});
///
/// cache.put(key.clone(), result.clone());
///
/// if let Some(cached) = cache.get(&key) {
///     println!("Cache hit! Result: {}", cached);
/// }
///
/// println!("Hit rate: {:.2}%", cache.hit_rate() * 100.0);
/// ```
pub struct ToolResultCache {
    /// LRU cache for storing entries
    cache: Arc<Mutex<LruCache<CacheKey, CacheEntry>>>,
    /// Time-to-live for cache entries
    ttl: Duration,
    /// Number of cache hits
    hit_count: Arc<AtomicU64>,
    /// Number of cache misses
    miss_count: Arc<AtomicU64>,
}

impl ToolResultCache {
    /// Create a new tool result cache
    ///
    /// # Arguments
    ///
    /// * `capacity` - Maximum number of entries to store
    /// * `ttl` - Time-to-live for cache entries
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::ToolResultCache;
    /// use std::time::Duration;
    ///
    /// // Cache with 1000 entries, 5 minute TTL
    /// let cache = ToolResultCache::new(1000, Duration::from_secs(300));
    /// ```
    pub fn new(capacity: usize, ttl: Duration) -> Self {
        let capacity = NonZeroUsize::new(capacity).unwrap_or(NonZeroUsize::new(1000).unwrap());

        info!(
            capacity = capacity.get(),
            ttl_secs = ttl.as_secs(),
            "Initializing ToolResultCache"
        );

        Self {
            cache: Arc::new(Mutex::new(LruCache::new(capacity))),
            ttl,
            hit_count: Arc::new(AtomicU64::new(0)),
            miss_count: Arc::new(AtomicU64::new(0)),
        }
    }

    /// Get a cached result by key
    ///
    /// Returns `Some(Value)` if the key exists and has not expired,
    /// otherwise returns `None`.
    ///
    /// # Arguments
    ///
    /// * `key` - Cache key to lookup
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolResultCache, CacheKey};
    /// use serde_json::json;
    /// use std::time::Duration;
    ///
    /// let cache = ToolResultCache::new(100, Duration::from_secs(60));
    /// let key = CacheKey::new("test.tool", &json!({"id": 1}));
    ///
    /// if let Some(result) = cache.get(&key) {
    ///     println!("Found cached result: {}", result);
    /// }
    /// ```
    pub fn get(&self, key: &CacheKey) -> Option<Value> {
        let mut cache = self.cache.lock().unwrap();

        if let Some(entry) = cache.get(key) {
            // Check if entry has expired
            if entry.is_expired(self.ttl) {
                debug!(
                    tool_name = %key.tool_name,
                    args_hash = key.arguments_hash,
                    "Cache entry expired"
                );
                cache.pop(key);
                self.miss_count.fetch_add(1, Ordering::Relaxed);
                None
            } else {
                debug!(
                    tool_name = %key.tool_name,
                    args_hash = key.arguments_hash,
                    "Cache hit"
                );
                self.hit_count.fetch_add(1, Ordering::Relaxed);
                Some(entry.result.clone())
            }
        } else {
            debug!(
                tool_name = %key.tool_name,
                args_hash = key.arguments_hash,
                "Cache miss"
            );
            self.miss_count.fetch_add(1, Ordering::Relaxed);
            None
        }
    }

    /// Store a result in the cache
    ///
    /// If the cache is at capacity, the least recently used entry will be evicted.
    ///
    /// # Arguments
    ///
    /// * `key` - Cache key
    /// * `result` - Result value to cache
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolResultCache, CacheKey};
    /// use serde_json::json;
    /// use std::time::Duration;
    ///
    /// let cache = ToolResultCache::new(100, Duration::from_secs(60));
    /// let key = CacheKey::new("test.tool", &json!({"id": 1}));
    /// let result = json!({"status": "success"});
    ///
    /// cache.put(key, result);
    /// ```
    pub fn put(&self, key: CacheKey, result: Value) {
        let mut cache = self.cache.lock().unwrap();

        debug!(
            tool_name = %key.tool_name,
            args_hash = key.arguments_hash,
            "Storing result in cache"
        );

        cache.put(key, CacheEntry::new(result));
    }

    /// Calculate the cache hit rate
    ///
    /// Returns a value between 0.0 and 1.0 representing the percentage of
    /// cache hits out of total requests.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::ToolResultCache;
    /// use std::time::Duration;
    ///
    /// let cache = ToolResultCache::new(100, Duration::from_secs(60));
    ///
    /// // After some cache operations...
    /// let hit_rate = cache.hit_rate();
    /// println!("Cache hit rate: {:.2}%", hit_rate * 100.0);
    /// ```
    pub fn hit_rate(&self) -> f64 {
        let hits = self.hit_count.load(Ordering::Relaxed);
        let misses = self.miss_count.load(Ordering::Relaxed);
        let total = hits + misses;

        if total == 0 {
            0.0
        } else {
            hits as f64 / total as f64
        }
    }

    /// Get the number of cache hits
    pub fn hit_count(&self) -> u64 {
        self.hit_count.load(Ordering::Relaxed)
    }

    /// Get the number of cache misses
    pub fn miss_count(&self) -> u64 {
        self.miss_count.load(Ordering::Relaxed)
    }

    /// Get the current number of entries in the cache
    pub fn len(&self) -> usize {
        self.cache.lock().unwrap().len()
    }

    /// Check if the cache is empty
    pub fn is_empty(&self) -> bool {
        self.cache.lock().unwrap().is_empty()
    }

    /// Clear all entries from the cache
    ///
    /// This resets the cache to an empty state but preserves hit/miss counters.
    pub fn clear(&self) {
        let mut cache = self.cache.lock().unwrap();
        cache.clear();
        info!("Cache cleared");
    }

    /// Get cache statistics as a JSON value
    ///
    /// Returns statistics including hit rate, total requests, and cache size.
    pub fn stats(&self) -> Value {
        let hits = self.hit_count.load(Ordering::Relaxed);
        let misses = self.miss_count.load(Ordering::Relaxed);
        let total = hits + misses;
        let hit_rate = self.hit_rate();
        let size = self.len();

        serde_json::json!({
            "hit_count": hits,
            "miss_count": misses,
            "total_requests": total,
            "hit_rate": hit_rate,
            "cache_size": size,
            "ttl_seconds": self.ttl.as_secs(),
        })
    }
}

impl Default for ToolResultCache {
    /// Create a cache with default settings
    ///
    /// - Capacity: 1000 entries
    /// - TTL: 5 minutes (300 seconds)
    fn default() -> Self {
        Self::new(1000, Duration::from_secs(300))
    }
}

impl Clone for ToolResultCache {
    fn clone(&self) -> Self {
        Self {
            cache: Arc::clone(&self.cache),
            ttl: self.ttl,
            hit_count: Arc::clone(&self.hit_count),
            miss_count: Arc::clone(&self.miss_count),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::thread;

    #[test]
    fn test_cache_key_creation() {
        let key1 = CacheKey::new("test.tool", &json!({"id": 1}));
        let key2 = CacheKey::new("test.tool", &json!({"id": 1}));
        let key3 = CacheKey::new("test.tool", &json!({"id": 2}));

        // Same arguments should produce same key
        assert_eq!(key1, key2);
        // Different arguments should produce different key
        assert_ne!(key1, key3);
    }

    #[test]
    fn test_cache_basic_operations() {
        let cache = ToolResultCache::new(100, Duration::from_secs(60));
        let key = CacheKey::new("test.tool", &json!({"id": 1}));
        let result = json!({"status": "success"});

        // Initially empty
        assert!(cache.is_empty());
        assert_eq!(cache.len(), 0);

        // Store result
        cache.put(key.clone(), result.clone());
        assert_eq!(cache.len(), 1);
        assert!(!cache.is_empty());

        // Retrieve result
        let cached = cache.get(&key);
        assert!(cached.is_some());
        assert_eq!(cached.unwrap(), result);
    }

    #[test]
    fn test_cache_miss() {
        let cache = ToolResultCache::new(100, Duration::from_secs(60));
        let key = CacheKey::new("test.tool", &json!({"id": 999}));

        let result = cache.get(&key);
        assert!(result.is_none());
        assert_eq!(cache.miss_count(), 1);
    }

    #[test]
    fn test_cache_hit_miss_metrics() {
        let cache = ToolResultCache::new(100, Duration::from_secs(60));
        let key1 = CacheKey::new("test.tool", &json!({"id": 1}));
        let key2 = CacheKey::new("test.tool", &json!({"id": 2}));
        let result = json!({"status": "success"});

        // Store one result
        cache.put(key1.clone(), result.clone());

        // Hit
        cache.get(&key1);
        assert_eq!(cache.hit_count(), 1);
        assert_eq!(cache.miss_count(), 0);

        // Miss
        cache.get(&key2);
        assert_eq!(cache.hit_count(), 1);
        assert_eq!(cache.miss_count(), 1);

        // Another hit
        cache.get(&key1);
        assert_eq!(cache.hit_count(), 2);
        assert_eq!(cache.miss_count(), 1);

        // Hit rate should be 2/3 = 0.666...
        let hit_rate = cache.hit_rate();
        assert!((hit_rate - 0.666).abs() < 0.01);
    }

    #[test]
    fn test_cache_ttl_expiration() {
        let cache = ToolResultCache::new(100, Duration::from_millis(50));
        let key = CacheKey::new("test.tool", &json!({"id": 1}));
        let result = json!({"status": "success"});

        // Store result
        cache.put(key.clone(), result.clone());

        // Should be available immediately
        assert!(cache.get(&key).is_some());

        // Wait for TTL to expire
        thread::sleep(Duration::from_millis(100));

        // Should be expired now
        assert!(cache.get(&key).is_none());
        assert_eq!(cache.len(), 0); // Entry should be removed
    }

    #[test]
    fn test_cache_lru_eviction() {
        let cache = ToolResultCache::new(2, Duration::from_secs(60));
        let key1 = CacheKey::new("tool", &json!({"id": 1}));
        let key2 = CacheKey::new("tool", &json!({"id": 2}));
        let key3 = CacheKey::new("tool", &json!({"id": 3}));
        let result = json!({"status": "success"});

        // Fill cache to capacity
        cache.put(key1.clone(), result.clone());
        cache.put(key2.clone(), result.clone());
        assert_eq!(cache.len(), 2);

        // Access key1 to make it more recent
        cache.get(&key1);

        // Add key3, should evict key2 (least recently used)
        cache.put(key3.clone(), result.clone());
        assert_eq!(cache.len(), 2);

        // key1 and key3 should be present
        assert!(cache.get(&key1).is_some());
        assert!(cache.get(&key3).is_some());
        // key2 should be evicted
        assert!(cache.get(&key2).is_none());
    }

    #[test]
    fn test_cache_clear() {
        let cache = ToolResultCache::new(100, Duration::from_secs(60));
        let key = CacheKey::new("test.tool", &json!({"id": 1}));
        let result = json!({"status": "success"});

        cache.put(key.clone(), result);
        assert_eq!(cache.len(), 1);

        cache.clear();
        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());

        // Metrics should be preserved
        assert!(cache.get(&key).is_none());
        assert_eq!(cache.miss_count(), 1);
    }

    #[test]
    fn test_cache_stats() {
        let cache = ToolResultCache::new(100, Duration::from_secs(300));
        let key = CacheKey::new("test.tool", &json!({"id": 1}));
        let result = json!({"status": "success"});

        cache.put(key.clone(), result);
        cache.get(&key); // Hit
        cache.get(&CacheKey::new("tool", &json!({"id": 999}))); // Miss

        let stats = cache.stats();
        assert_eq!(stats["hit_count"], 1);
        assert_eq!(stats["miss_count"], 1);
        assert_eq!(stats["total_requests"], 2);
        assert_eq!(stats["cache_size"], 1);
        assert_eq!(stats["ttl_seconds"], 300);
    }

    #[test]
    fn test_cache_default() {
        let cache = ToolResultCache::default();
        assert!(cache.is_empty());
        assert_eq!(cache.hit_rate(), 0.0);
    }

    #[test]
    fn test_cache_clone() {
        let cache1 = ToolResultCache::new(100, Duration::from_secs(60));
        let key = CacheKey::new("test.tool", &json!({"id": 1}));
        let result = json!({"status": "success"});

        cache1.put(key.clone(), result);

        let cache2 = cache1.clone();

        // Both caches should share the same underlying data
        assert!(cache2.get(&key).is_some());
        assert_eq!(cache1.len(), cache2.len());
    }

    #[test]
    fn test_cache_concurrent_access() {
        let cache = ToolResultCache::new(100, Duration::from_secs(60));
        let cache_clone = cache.clone();

        let handle = thread::spawn(move || {
            let key = CacheKey::new("test.tool", &json!({"id": 1}));
            let result = json!({"status": "success"});
            cache_clone.put(key.clone(), result);
            cache_clone.get(&key)
        });

        let result = handle.join().unwrap();
        assert!(result.is_some());

        // Main thread should see the entry
        let key = CacheKey::new("test.tool", &json!({"id": 1}));
        assert!(cache.get(&key).is_some());
    }

    #[test]
    fn test_argument_order_consistency() {
        // serde_json maintains insertion order in the map,
        // but json!() macro produces consistent ordering
        let key1 = CacheKey::new("tool", &json!({"a": 1, "b": 2}));
        let key2 = CacheKey::new("tool", &json!({"b": 2, "a": 1}));

        // json!() macro produces same internal representation,
        // so hashes will be identical - this is desired behavior
        // as it ensures cache hits for semantically equivalent JSON
        assert_eq!(key1.arguments_hash, key2.arguments_hash);

        // But truly different arguments should have different hashes
        let key3 = CacheKey::new("tool", &json!({"a": 1, "b": 3}));
        assert_ne!(key1.arguments_hash, key3.arguments_hash);
    }
}
