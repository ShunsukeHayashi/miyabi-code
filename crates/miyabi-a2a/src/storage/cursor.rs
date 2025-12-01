//! Cursor-based pagination for task lists
//!
//! This module provides stable, opaque cursors for efficient pagination
//! of large task lists. Cursors are Base64-encoded JSON containing
//! pagination state information.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Pagination cursor containing state information
///
/// Cursors are encoded as Base64 strings and are stable across
/// requests (same cursor always returns same results).
///
/// # Format
///
/// Cursors encode the following information:
/// - `last_id`: ID of the last item in the previous page
/// - `last_updated`: Timestamp of the last item (for stable sorting)
/// - `direction`: Forward or backward pagination
///
/// # Examples
///
/// ```
/// use miyabi_a2a::storage::cursor::{PaginationCursor, Direction};
/// use chrono::Utc;
///
/// // Create a cursor
/// let cursor = PaginationCursor {
///     last_id: 100,
///     last_updated: Utc::now(),
///     direction: Direction::Forward,
/// };
///
/// // Encode to string
/// let encoded = cursor.encode().unwrap();
/// assert!(encoded.len() > 0);
///
/// // Decode back
/// let decoded = PaginationCursor::decode(&encoded).unwrap();
/// assert_eq!(decoded.last_id, 100);
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaginationCursor {
    /// ID of the last item in the previous page
    pub last_id: u64,

    /// Timestamp of the last item (for stable sorting)
    pub last_updated: DateTime<Utc>,

    /// Pagination direction
    pub direction: Direction,
}

/// Pagination direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Direction {
    /// Forward pagination (next page)
    Forward,
    /// Backward pagination (previous page)
    Backward,
}

impl PaginationCursor {
    /// Create a new forward cursor
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_a2a::storage::cursor::PaginationCursor;
    /// use chrono::Utc;
    ///
    /// let cursor = PaginationCursor::forward(123, Utc::now());
    /// ```
    pub fn forward(last_id: u64, last_updated: DateTime<Utc>) -> Self {
        Self { last_id, last_updated, direction: Direction::Forward }
    }

    /// Create a new backward cursor
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_a2a::storage::cursor::PaginationCursor;
    /// use chrono::Utc;
    ///
    /// let cursor = PaginationCursor::backward(123, Utc::now());
    /// ```
    pub fn backward(last_id: u64, last_updated: DateTime<Utc>) -> Self {
        Self { last_id, last_updated, direction: Direction::Backward }
    }

    /// Encode cursor to Base64 string
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_a2a::storage::cursor::PaginationCursor;
    /// use chrono::Utc;
    ///
    /// let cursor = PaginationCursor::forward(123, Utc::now());
    /// let encoded = cursor.encode().unwrap();
    /// assert!(encoded.len() > 0);
    /// ```
    pub fn encode(&self) -> Result<String, CursorError> {
        let json = serde_json::to_string(self)?;
        Ok(URL_SAFE_NO_PAD.encode(json.as_bytes()))
    }

    /// Decode cursor from Base64 string
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_a2a::storage::cursor::PaginationCursor;
    /// use chrono::Utc;
    ///
    /// let cursor = PaginationCursor::forward(123, Utc::now());
    /// let encoded = cursor.encode().unwrap();
    /// let decoded = PaginationCursor::decode(&encoded).unwrap();
    /// assert_eq!(cursor, decoded);
    /// ```
    pub fn decode(encoded: &str) -> Result<Self, CursorError> {
        let bytes = URL_SAFE_NO_PAD.decode(encoded)?;
        let json = String::from_utf8(bytes)?;
        Ok(serde_json::from_str(&json)?)
    }
}

/// Pagination result with next/previous cursors
///
/// This structure wraps a page of results with cursors for
/// navigating to adjacent pages.
///
/// # Examples
///
/// ```
/// use miyabi_a2a::storage::cursor::PaginatedResult;
///
/// let result = PaginatedResult {
///     items: vec![1, 2, 3],
///     next_cursor: Some("abc123".to_string()),
///     previous_cursor: None,
///     has_more: true,
/// };
///
/// assert_eq!(result.items.len(), 3);
/// assert!(result.has_more);
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    /// Items in the current page
    pub items: Vec<T>,

    /// Cursor for the next page (None if last page)
    pub next_cursor: Option<String>,

    /// Cursor for the previous page (None if first page)
    pub previous_cursor: Option<String>,

    /// Whether there are more items after this page
    pub has_more: bool,
}

impl<T> PaginatedResult<T> {
    /// Create a new paginated result
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_a2a::storage::cursor::PaginatedResult;
    ///
    /// let result = PaginatedResult::new(
    ///     vec![1, 2, 3],
    ///     Some("next".to_string()),
    ///     None,
    ///     true,
    /// );
    /// ```
    pub fn new(items: Vec<T>, next_cursor: Option<String>, previous_cursor: Option<String>, has_more: bool) -> Self {
        Self { items, next_cursor, previous_cursor, has_more }
    }
}

/// Cursor error types
#[derive(Debug, thiserror::Error)]
pub enum CursorError {
    #[error("Invalid cursor format: {0}")]
    InvalidFormat(String),

    #[error("Base64 decode error: {0}")]
    Base64Error(#[from] base64::DecodeError),

    #[error("UTF-8 decode error: {0}")]
    Utf8Error(#[from] std::string::FromUtf8Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cursor_encode_decode() {
        let cursor = PaginationCursor::forward(123, Utc::now());
        let encoded = cursor.encode().unwrap();
        let decoded = PaginationCursor::decode(&encoded).unwrap();

        assert_eq!(cursor, decoded);
    }

    #[test]
    fn test_forward_cursor() {
        let timestamp = Utc::now();
        let cursor = PaginationCursor::forward(456, timestamp);

        assert_eq!(cursor.last_id, 456);
        assert_eq!(cursor.last_updated, timestamp);
        assert_eq!(cursor.direction, Direction::Forward);
    }

    #[test]
    fn test_backward_cursor() {
        let timestamp = Utc::now();
        let cursor = PaginationCursor::backward(789, timestamp);

        assert_eq!(cursor.last_id, 789);
        assert_eq!(cursor.last_updated, timestamp);
        assert_eq!(cursor.direction, Direction::Backward);
    }

    #[test]
    fn test_invalid_cursor() {
        let result = PaginationCursor::decode("invalid!!!base64");
        assert!(result.is_err());
    }

    #[test]
    fn test_paginated_result() {
        let result = PaginatedResult::new(vec![1, 2, 3], Some("next".to_string()), None, true);

        assert_eq!(result.items.len(), 3);
        assert!(result.next_cursor.is_some());
        assert!(result.previous_cursor.is_none());
        assert!(result.has_more);
    }
}
