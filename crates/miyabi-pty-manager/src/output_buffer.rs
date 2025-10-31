use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

/// Ring buffer for capturing terminal session output
#[derive(Clone)]
pub struct SessionOutputBuffer {
    buffer: Arc<Mutex<VecDeque<String>>>,
    max_lines: usize,
}

impl SessionOutputBuffer {
    pub fn new(max_lines: usize) -> Self {
        Self {
            buffer: Arc::new(Mutex::new(VecDeque::with_capacity(max_lines))),
            max_lines,
        }
    }

    /// Push a new line to the buffer
    pub fn push(&self, line: String) {
        let mut buf = self.buffer.lock().unwrap();
        if buf.len() >= self.max_lines {
            buf.pop_front();
        }
        buf.push_back(line);
    }

    /// Get the N most recent lines
    pub fn get_recent(&self, n: usize) -> Vec<String> {
        let buf = self.buffer.lock().unwrap();
        buf.iter()
            .rev()
            .take(n)
            .rev()
            .cloned()
            .collect()
    }

    /// Get all lines
    pub fn get_all(&self) -> Vec<String> {
        let buf = self.buffer.lock().unwrap();
        buf.iter().cloned().collect()
    }

    /// Search for lines containing a pattern
    pub fn search(&self, pattern: &str) -> Vec<String> {
        let buf = self.buffer.lock().unwrap();
        buf.iter()
            .filter(|line| line.contains(pattern))
            .cloned()
            .collect()
    }

    /// Search with regex pattern
    #[cfg(feature = "regex")]
    pub fn search_regex(&self, pattern: &str) -> Result<Vec<String>, regex::Error> {
        use regex::Regex;
        let re = Regex::new(pattern)?;
        let buf = self.buffer.lock().unwrap();
        Ok(buf.iter()
            .filter(|line| re.is_match(line))
            .cloned()
            .collect())
    }

    /// Clear all buffered output
    pub fn clear(&self) {
        self.buffer.lock().unwrap().clear();
    }

    /// Get buffer size (number of lines)
    pub fn len(&self) -> usize {
        self.buffer.lock().unwrap().len()
    }

    /// Check if buffer is empty
    pub fn is_empty(&self) -> bool {
        self.buffer.lock().unwrap().is_empty()
    }

    /// Wait for a pattern to appear in output (with timeout)
    pub async fn wait_for_pattern(
        &self,
        pattern: &str,
        timeout: std::time::Duration,
    ) -> Option<String> {
        let start = std::time::Instant::now();

        loop {
            {
                let buf = self.buffer.lock().unwrap();
                if let Some(line) = buf.iter().rev().find(|l| l.contains(pattern)) {
                    return Some(line.clone());
                }
            }

            if start.elapsed() > timeout {
                return None;
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_push_and_get_recent() {
        let buffer = SessionOutputBuffer::new(5);

        buffer.push("line 1".to_string());
        buffer.push("line 2".to_string());
        buffer.push("line 3".to_string());

        let recent = buffer.get_recent(2);
        assert_eq!(recent, vec!["line 2", "line 3"]);
    }

    #[test]
    fn test_ring_buffer_overflow() {
        let buffer = SessionOutputBuffer::new(3);

        buffer.push("line 1".to_string());
        buffer.push("line 2".to_string());
        buffer.push("line 3".to_string());
        buffer.push("line 4".to_string());

        let all = buffer.get_all();
        assert_eq!(all.len(), 3);
        assert_eq!(all, vec!["line 2", "line 3", "line 4"]);
    }

    #[test]
    fn test_search() {
        let buffer = SessionOutputBuffer::new(10);

        buffer.push("INFO: Starting application".to_string());
        buffer.push("WARN: Connection slow".to_string());
        buffer.push("ERROR: Failed to connect".to_string());
        buffer.push("INFO: Retrying...".to_string());

        let errors = buffer.search("ERROR");
        assert_eq!(errors.len(), 1);
        assert!(errors[0].contains("Failed to connect"));

        let info = buffer.search("INFO");
        assert_eq!(info.len(), 2);
    }

    #[tokio::test]
    async fn test_wait_for_pattern() {
        let buffer = SessionOutputBuffer::new(10);

        // Spawn task to push line after delay
        let buffer_clone = buffer.clone();
        tokio::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            buffer_clone.push("Deployment completed".to_string());
        });

        // Wait for pattern
        let result = buffer
            .wait_for_pattern("completed", std::time::Duration::from_secs(1))
            .await;

        assert!(result.is_some());
        assert!(result.unwrap().contains("Deployment completed"));
    }

    #[tokio::test]
    async fn test_wait_for_pattern_timeout() {
        let buffer = SessionOutputBuffer::new(10);

        let result = buffer
            .wait_for_pattern("never_appears", std::time::Duration::from_millis(100))
            .await;

        assert!(result.is_none());
    }
}
